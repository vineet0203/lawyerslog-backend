const express = require('express');
const {
  sendOtp,
  resendSignupOtp,
  verifyOtp,
  login,
  sendResetOtp,
  resetPassword
} = require('./authController');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/resend-signup-otp', resendSignupOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/send-reset-otp', sendResetOtp);
router.post('/reset-password', resetPassword);

// Backward-compatible aliases for existing frontend calls
router.post('/signup', sendOtp);
router.post('/verify', verifyOtp);

module.exports = router;
