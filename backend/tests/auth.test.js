const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Authentication', () => {
  // Clean up test data before each test
  beforeEach(async () => {
    // Clear any test users (in a real app, use a test database)
    try {
      const db = require('../db');
      if (db.type === 'sqlite' && db.raw) {
        // SQLite: Delete users with test emails
        const stmt = db.raw.prepare('DELETE FROM users WHERE email LIKE ?');
        stmt.run('test%@%');
      } else {
        // PostgreSQL: Delete users with test emails
        await db.query('DELETE FROM users WHERE email LIKE $1', ['test%@%']);
      }
    } catch (error) {
      // Ignore errors - table might not exist yet or cleanup failed
      console.warn('Test cleanup warning:', error.message);
    }
  });

  describe('POST /api/auth/signup', () => {
    test('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should return 400 if password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('8 characters');
    });

    test('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    test('should not allow duplicate emails', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User'
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Second User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should create session on successful signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'session@example.com',
          password: 'password123',
          name: 'Session User'
        })
        .expect(201);

      // Check that session cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('sessionId'))).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = await User.create({
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User'
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should create session on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      // Check that session cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('sessionId'))).toBe(true);
    });

    test('should return 401 with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('should return 401 with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let agent;

    beforeEach(async () => {
      // Create a test user and login
      testUser = await User.create({
        email: 'me@example.com',
        password: 'password123',
        name: 'Me User'
      });

      agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123'
        });
    });

    test('should return user when authenticated', async () => {
      const response = await agent
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('me@example.com');
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('POST /api/auth/logout', () => {
    let agent;

    beforeEach(async () => {
      // Create and login a test user
      await User.create({
        email: 'logout@example.com',
        password: 'password123',
        name: 'Logout User'
      });

      agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'password123'
        });
    });

    test('should logout successfully', async () => {
      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should clear session after logout', async () => {
      await agent.post('/api/auth/logout').expect(200);

      // Try to access protected route
      const response = await agent
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
