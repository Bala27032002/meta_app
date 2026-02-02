const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const generateOTP = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max).toString();
};


const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
};

const compareOTP = async (plainOTP, hashedOTP) => {
    return bcrypt.compare(plainOTP, hashedOTP);
};

const generateOTPId = () => {
    return uuidv4();
};


const getOTPExpiry = (minutes = 5) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

const isValidPhone = (phone) => {
    return /^\+[1-9]\d{1,14}$/.test(phone);
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};


const normalizePhone = (phone) => {
    let normalized = phone.replace(/[^\d+]/g, '');

    if (!normalized.startsWith('+')) {
        normalized = '+91' + normalized;
    }

    return normalized;
};

module.exports = {
    generateOTP,
    hashOTP,
    compareOTP,
    generateOTPId,
    getOTPExpiry,
    isValidPhone,
    isValidEmail,
    normalizePhone,
};
