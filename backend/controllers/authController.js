const OTP = require('../models/OTP');
const User = require('../models/User');
const {
    generateOTP,
    hashOTP,
    compareOTP,
    generateOTPId,
    getOTPExpiry,
    isValidPhone,
    isValidEmail,
    normalizePhone,
} = require('../utils/otpUtils');
const { generateToken } = require('../middleware/auth');
const { sendWhatsAppOTP } = require('../services/whatsappService');
const zohoCRMService = require('../services/zohoCRMService');
const logger = require('../config/logger');

const requestOTP = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        // Validate input
        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, and email are required',
            });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(phone);

        // Validate phone format
        if (!isValidPhone(normalizedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Use E.164 format (e.g., +919876543210)',
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Check for recent OTP requests (prevent spam)
        const recentOTP = await OTP.findOne({
            phone: normalizedPhone,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // Last 1 minute
        });

        if (recentOTP) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 1 minute before requesting another OTP',
            });
        }

        // Generate OTP
        const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
        const otpHash = await hashOTP(otp);
        const otpId = generateOTPId();
        const expiresAt = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 5);

        // Save OTP to database
        const otpRecord = await OTP.create({
            otpId,
            phone: normalizedPhone,
            name,
            email,
            otpHash,
            expiresAt,
        });

        // Send OTP via WhatsApp
        try {
            await sendWhatsAppOTP(normalizedPhone, otp);
        } catch (whatsappError) {
            // Delete OTP record if WhatsApp send fails
            await OTP.deleteOne({ _id: otpRecord._id });

            logger.error('WhatsApp OTP send failed', {
                error: whatsappError.message,
                phone: normalizedPhone,
            });

            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please check your phone number and try again.',
            });
        }

        logger.info('OTP requested successfully', {
            otpId,
            phone: normalizedPhone,
            email,
        });

        res.status(200).json({
            success: true,
            message: 'OTP sent to your WhatsApp number',
            otpId,
            expiresIn: process.env.OTP_EXPIRY_MINUTES || 5,
        });
    } catch (error) {
        logger.error('Request OTP error', {
            error: error.message,
            stack: error.stack,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to process OTP request. Please try again.',
        });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { otpId, otp, phone } = req.body;

        // Validate input
        if (!otpId || !otp || !phone) {
            return res.status(400).json({
                success: false,
                message: 'OTP ID, OTP, and phone number are required',
            });
        }

        // Normalize phone
        const normalizedPhone = normalizePhone(phone);

        // Find OTP record
        const otpRecord = await OTP.findOne({
            otpId,
            phone: normalizedPhone,
        });

        if (!otpRecord) {
            return res.status(404).json({
                success: false,
                message: 'Invalid OTP request. Please request a new OTP.',
            });
        }

        // Check if already used
        if (otpRecord.isUsed) {
            return res.status(400).json({
                success: false,
                message: 'OTP already used. Please request a new OTP.',
            });
        }

        // Check if expired
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired. Please request a new OTP.',
            });
        }

        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        // Check max attempts
        if (otpRecord.attempts > 5) {
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.',
            });
        }

        // Verify OTP
        const isValid = await compareOTP(otp, otpRecord.otpHash);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
                attemptsRemaining: 5 - otpRecord.attempts,
            });
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Create or update user
        let user = await User.findOne({ phone: normalizedPhone });

        if (user) {
            // Update existing user
            user.name = otpRecord.name;
            user.email = otpRecord.email;
            user.isVerified = true;
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                name: otpRecord.name,
                phone: normalizedPhone,
                email: otpRecord.email,
                isVerified: true,
                lastLogin: new Date(),
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            phone: user.phone,
            email: user.email,
        });

        // Sync to Zoho CRM (async, non-blocking)
        // Don't wait for this to complete
        if (!user.crmSynced) {
            zohoCRMService.syncUserToCRM(user).catch((err) => {
                logger.error('CRM sync failed (async)', {
                    userId: user._id,
                    error: err.message,
                });
            });
        }

        logger.info('OTP verified successfully', {
            userId: user._id,
            phone: normalizedPhone,
            email: user.email,
        });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        logger.error('Verify OTP error', {
            error: error.message,
            stack: error.stack,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP. Please try again.',
        });
    }
};


const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        logger.error('Get current user error', {
            error: error.message,
            userId: req.user.userId,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
        });
    }
};

module.exports = {
    requestOTP,
    verifyOTP,
    getCurrentUser,
};
