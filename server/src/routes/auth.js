const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateResetToken, hashToken, sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({ token, user: user.toSafeObject() });
}));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken(user._id);
  res.json({ token, user: user.toSafeObject() });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

// PATCH /api/auth/me
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'timezone', 'preferences'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (updates.preferences) {
    const current = req.user.preferences?.toObject?.() ?? req.user.preferences ?? {};
    updates.preferences = { ...current, ...updates.preferences };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json({ user });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond 200 to prevent email enumeration attacks
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const { raw, hash } = generateResetToken();
  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;

  try {
    await sendPasswordResetEmail({ to: email, name: user.name, resetUrl });
    res.json({ message: 'If that email exists, a reset link has been sent.', devResetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ message: 'Failed to send email. Try again later.' });
  }
}));

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, email, password } = req.body;
  const hash = hashToken(token);

  const user = await User.findOne({
    email,
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });

  user.password = password; // pre-save hook will hash it
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const authToken = signToken(user._id);
  res.json({ message: 'Password reset successful.', token: authToken, user: user.toSafeObject() });
}));

// POST /api/auth/change-password  (authenticated)
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findById(req.user._id);
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully.' });
}));

module.exports = router;
