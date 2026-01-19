const express = require('express');
const router = express.Router();

// In-memory user storage (in production, use a database)
let users = [];
let userIdCounter = 1;

// Create a default test account
const testUser = {
  id: userIdCounter++,
  email: 'test@example.com',
  password: 'test123',
  name: 'Test User',
  createdAt: new Date().toISOString(),
};
users.push(testUser);
console.log('✅ Test account created:', { email: testUser.email, password: 'test123' });

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', (req, res) => {
  console.log('📝 Signup request received:', { 
    body: { ...req.body, password: req.body.password ? '***' : undefined },
    headers: req.headers['content-type']
  });
  
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    console.log('❌ Validation failed:', { email: !!email, password: !!password, name: !!name });
    return res.status(400).json({
      success: false,
      error: 'Email, password, and name are required',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format',
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long',
    });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User with this email already exists',
    });
  }

  // Create user (in production, hash the password)
  const user = {
    id: userIdCounter++,
    email: email.toLowerCase(),
    password: password, // In production, hash this with bcrypt
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    user: userWithoutPassword,
    message: 'Account created successfully',
  });
});

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Sign in attempt:', { email, passwordLength: password?.length });

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }

  // Find user
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  console.log('👤 User lookup:', { found: !!user, totalUsers: users.length });
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Check password (in production, use bcrypt.compare)
  console.log('🔑 Password check:', { 
    provided: password, 
    stored: user.password, 
    match: user.password === password 
  });
  
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  // In production, generate a JWT token here
  const token = `mock-token-${user.id}-${Date.now()}`;

  res.json({
    success: true,
    user: userWithoutPassword,
    token,
    message: 'Signed in successfully',
  });
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', (req, res) => {
  // In production, verify JWT token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // Extract user ID from token (mock implementation)
  const userIdMatch = token.match(/mock-token-(\d+)-/);
  if (!userIdMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  const userId = parseInt(userIdMatch[1]);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not found',
    });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    user: userWithoutPassword,
  });
});

module.exports = router;

