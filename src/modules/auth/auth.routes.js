const express = require('express');
const router = express.Router();
const { signup, login, resetPassword, getMe } = require('./auth.controller');
const { protect } = require('../../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
