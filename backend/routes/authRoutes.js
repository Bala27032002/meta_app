const express = require('express');
const {
    requestOTP,
    verifyOTP,
    getCurrentUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
    otpRequestLimiter,
    otpVerifyLimiter,
} = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/request-otp', otpRequestLimiter, requestOTP);

router.post('/verify-otp', otpVerifyLimiter, verifyOTP);

router.get('/me', authenticate, getCurrentUser);

module.exports = router;
