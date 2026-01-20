const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config();

// Initialize database (creates tables if needed)
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Session secret validation
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  WARNING: SESSION_SECRET not set. Using default (INSECURE - change in production!)');
}
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-in-production';

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? false : undefined
}));
// CORS configuration with logging
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.CORS_ORIGIN;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log CORS info for debugging
    console.log('CORS Request:', {
      origin: origin,
      allowedOrigin: allowedOrigin,
      isProduction: isProduction,
      hasOrigin: !!origin
    });
    
    // In production, if CORS_ORIGIN is set, use it; otherwise allow all (not recommended)
    if (isProduction) {
      if (allowedOrigin) {
        // Allow exact match or if origin matches the allowed origin
        if (!origin || origin === allowedOrigin || origin.startsWith(allowedOrigin)) {
          callback(null, true);
        } else {
          console.warn('CORS blocked:', origin, 'Expected:', allowedOrigin);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // No CORS_ORIGIN set - allow all (for testing, but not recommended)
        console.warn('⚠️ CORS_ORIGIN not set in production - allowing all origins');
        callback(null, true);
      }
    } else {
      // Development: allow localhost
      callback(null, origin || 'http://localhost:5173');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const clientOrigin = process.env.CLIENT_ORIGIN || (isProduction ? process.env.CORS_ORIGIN : 'http://localhost:5173');

let sessionStore;
if (isProduction && process.env.DATABASE_URL && !isTest) {
  // Use PostgreSQL session store in production (not in tests)
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false
      }
    });
    sessionStore = new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true // Auto-create session table
    });
  } catch (error) {
    console.warn('⚠️  Could not initialize PostgreSQL session store, using memory store:', error.message);
    sessionStore = undefined; // Will use memory store
  }
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'lax' : 'lax', // 'lax' allows cookies on same-site navigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: isProduction ? undefined : undefined // Let browser handle domain
  }
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Swiss Tournament API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    corsOrigin: process.env.CORS_ORIGIN || 'not set',
    nodeEnv: process.env.NODE_ENV || 'not set'
  });
});

// API Routes
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/auth', require('./routes/auth'));

// 404 handler for API routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});

module.exports = app;
