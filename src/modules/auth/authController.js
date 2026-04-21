const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./userModel');
const Otp = require('./otpModel');
const { sendOtpEmail } = require('./emailService');

const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sendOtp = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'signup' },
      {
        email: normalizedEmail,
        otp,
        password,
        name: name || '',
        role: role || 'claimant',
        purpose: 'signup',
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(normalizedEmail, otp);

    const response = { success: true, message: 'OTP sent to email' };
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const pendingSignup = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' });
    if (!pendingSignup) {
      return res.status(400).json({ success: false, message: 'No pending signup found. Please sign up again.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    pendingSignup.otp = otp;
    pendingSignup.expiresAt = expiresAt;
    await pendingSignup.save();

    await sendOtpEmail(normalizedEmail, otp);

    const response = { success: true, message: 'OTP resent to email' };
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Resend signup OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpDoc = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }
    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (otpDoc.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const alreadyExists = await User.findOne({ email: normalizedEmail });
    if (alreadyExists) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(String(otpDoc.password), 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: otpDoc.name || '',
      role: otpDoc.role || 'claimant'
    });

    await Otp.deleteOne({ _id: otpDoc._id });

    return res.status(201).json({
      success: true,
      message: 'OTP verified and account created',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'OTP verification failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'reset' },
      {
        email: normalizedEmail,
        otp,
        purpose: 'reset',
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(normalizedEmail, otp);

    const response = { success: true, message: 'Reset OTP sent to email' };
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Send reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reset OTP', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpDoc = await Otp.findOne({ email: normalizedEmail, purpose: 'reset' });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }
    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (otpDoc.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    await Otp.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Password reset failed', error: error.message });
  }
};

module.exports = {
  sendOtp,
  resendSignupOtp,
  verifyOtp,
  login,
  sendResetOtp,
  resetPassword
};
