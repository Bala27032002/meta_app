const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

const otpRequestLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 3,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use phone number as key
    keyGenerator: (req) => {
        return req.body.phone || req.ip;
    },
    handler: (req, res) => {
        logger.warn('Rate limit exceeded for OTP request', {
            phone: req.body.phone,
            ip: req.ip,
        });
        res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Please try again after 15 minutes.',
        });
    },
});

const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_VERIFY_ATTEMPTS) || 5,
    message: {
        success: false,
        message: 'Too many verification attempts. Please request a new OTP.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.body.otpId || req.ip;
    },
    handler: (req, res) => {
        logger.warn('Rate limit exceeded for OTP verification', {
            otpId: req.body.otpId,
            ip: req.ip,
        });
        res.status(429).json({
            success: false,
            message: 'Too many verification attempts. Please request a new OTP.',
        });
    },
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    otpRequestLimiter,
    otpVerifyLimiter,
    generalLimiter,
};
