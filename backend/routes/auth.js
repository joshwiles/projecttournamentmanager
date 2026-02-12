const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sendPasswordResetEmail } = require('../utils/email');

/**
 * Parse preferences JSON safely
 */
function parsePreferences(user) {
  if (!user || !user.preferences) return {};
  if (typeof user.preferences === 'object') return user.preferences;
  try {
    return JSON.parse(user.preferences);
  } catch {
    return {};
  }
}

/**
 * Build user response object with parsed preferences
 */
function userResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferences: parsePreferences(user),
    created_at: user.created_at,
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error
      });
    }

    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name: trimmedName
    });

    // Start session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to create session'
        });
      }

      res.status(201).json({
        success: true,
        user: userResponse(user),
        message: 'Account created successfully'
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.message === 'User with this email already exists') {
      // Don't leak that email exists - use generic message
      return res.status(400).json({
        success: false,
        error: 'Unable to create account. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

/**
 * POST /api/auth/login
 * Sign in an existing user
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    
    // Always use the same error message to prevent email enumeration
    const genericError = 'Invalid email or password';

    if (!user) {
      // Hash a dummy password to prevent timing attacks
      await require('bcryptjs').hash('dummy', 10);
      return res.status(401).json({
        success: false,
        error: genericError
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: genericError
      });
    }

    // Start session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to create session'
        });
      }

      res.json({
        success: true,
        user: userResponse(user),
        message: 'Signed in successfully'
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign in'
    });
  }
});

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to sign out'
      });
    }

    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  });
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      // Session has invalid user ID
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userResponse(user),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (name and/or email)
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ success: false, error: 'Name or email is required' });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (name !== undefined && name.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const updatedUser = await User.updateProfile(req.session.userId, { name, email });

    res.json({
      success: true,
      user: userResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.message === 'Email already in use') {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, error: passwordValidation.error });
    }

    const user = await User.findByIdWithHash(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const bcrypt = require('bcryptjs');
    const newHash = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(req.session.userId, newHash);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

/**
 * PUT /api/auth/preferences
 * Update user preferences (theme, etc.)
 */
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ success: false, error: 'No preferences provided' });
    }

    // Build preferences object from allowed keys
    const preferences = {};
    if (theme) preferences.theme = String(theme);

    const updatedUser = await User.updatePreferences(req.session.userId, preferences);

    res.json({
      success: true,
      user: userResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with that email, we have sent a password reset link.'
    };

    const user = await User.findByEmail(email);
    if (!user) {
      return res.json(successResponse);
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token hash
    if (db.type === 'sqlite') {
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt.toISOString()]
      );
    } else {
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt.toISOString()]
      );
    }

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}?reset-token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using a valid token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and password are required' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, error: passwordValidation.error });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    let result;
    if (db.type === 'sqlite') {
      result = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?',
        [tokenHash, new Date().toISOString()]
      );
    } else {
      result = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
        [tokenHash]
      );
    }

    if (!result.rows || result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const resetToken = result.rows[0];

    // Update password
    const bcrypt = require('bcryptjs');
    const newHash = await bcrypt.hash(password, 12);
    await User.updatePassword(resetToken.user_id, newHash);

    // Mark token as used
    if (db.type === 'sqlite') {
      await db.query(
        'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?',
        [new Date().toISOString(), resetToken.id]
      );
    } else {
      await db.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [resetToken.id]
      );
    }

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

module.exports = router;
