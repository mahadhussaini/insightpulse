const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { redisClient } = require('../config/database');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('company').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password, firstName, lastName, company } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      error: 'User already exists',
      code: 'USER_EXISTS'
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    company
  });

  // Generate token
  const token = generateToken(user.id);

  // Update last login
  await user.update({ lastLogin: new Date() });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      role: user.role,
      subscription: user.subscription,
      isEmailVerified: user.isEmailVerified
    },
    token
  });
}));

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Generate token
  const token = generateToken(user.id);

  // Update last login
  await user.update({ lastLogin: new Date() });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      role: user.role,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences
    },
    token
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      role: user.role,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      monthlyFeedbackLimit: user.monthlyFeedbackLimit,
      integrationsLimit: user.integrationsLimit,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      preferences: user.preferences,
      createdAt: user.createdAt
    }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('company').optional().trim(),
  body('preferences').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { firstName, lastName, company, preferences } = req.body;
  const updateData = {};

  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (company !== undefined) updateData.company = company;
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

  await req.user.update(updateData);

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      company: req.user.company,
      preferences: req.user.preferences
    }
  });
}));

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Verify current password
  const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      error: 'Current password is incorrect',
      code: 'INVALID_CURRENT_PASSWORD'
    });
  }

  // Update password
  await req.user.update({ password: newPassword });

  res.json({
    message: 'Password changed successfully'
  });
}));

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  await user.update({
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetTokenExpiry
  });

  // TODO: Send email with reset link
  // For now, just return success
  res.json({
    message: 'Password reset link sent to your email'
  });
}));

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { token, newPassword } = req.body;

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    return res.status(400).json({
      error: 'Invalid or expired reset token',
      code: 'INVALID_RESET_TOKEN'
    });
  }

  // Update password and clear reset token
  await user.update({
    password: newPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null
  });

  res.json({
    message: 'Password reset successfully'
  });
}));

// Logout (blacklist token)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Add token to blacklist in Redis
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await redisClient.setEx(`blacklist:${token}`, 7 * 24 * 60 * 60, 'true'); // 7 days
  }

  res.json({
    message: 'Logged out successfully'
  });
}));

// Verify email
router.post('/verify-email', [
  body('token').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { token } = req.body;

  const user = await User.findOne({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    return res.status(400).json({
      error: 'Invalid verification token',
      code: 'INVALID_VERIFICATION_TOKEN'
    });
  }

  await user.update({
    isEmailVerified: true,
    emailVerificationToken: null
  });

  res.json({
    message: 'Email verified successfully'
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const newToken = generateToken(req.user.id);
  
  res.json({
    token: newToken
  });
}));

module.exports = router; 