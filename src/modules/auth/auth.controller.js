const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./auth.model');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const signup = async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: name || '',
      role: role || 'claimant'
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Signup failed', error: error.message });
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

    const isMatch = await user.comparePassword(password);
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

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Reset password failed', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

module.exports = { signup, login, resetPassword, getMe };
