const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
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
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        created_at: updatedUser.created_at
      }
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

module.exports = router;
