/**
 * Authentication middleware
 */

/**
 * Require authentication - blocks unauthenticated requests
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

/**
 * Optional authentication - adds user to request if logged in
 */
const optionalAuth = (req, res, next) => {
  // User is already set by session middleware if logged in
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};
