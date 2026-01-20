/**
 * Database connection and setup
 * Uses PostgreSQL in production, SQLite in development
 */

const isProduction = process.env.NODE_ENV === 'production';
let db;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL for production
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  db = {
    query: (text, params) => pool.query(text, params),
    close: () => pool.end(),
    type: 'postgres'
  };

  console.log('✅ Connected to PostgreSQL database');
} else {
  // SQLite for development
  try {
    const Database = require('better-sqlite3');
    const dbPath = process.env.DB_PATH || './dev.db';
    const sqlite = new Database(dbPath);
    
    db = {
      query: (text, params) => {
        // Convert PostgreSQL-style queries to SQLite
        const stmt = sqlite.prepare(text);
        if (params && params.length > 0) {
          return Promise.resolve({ rows: stmt.all(params), rowCount: stmt.changes || 0 });
        }
        return Promise.resolve({ rows: stmt.all(), rowCount: 0 });
      },
      querySync: (text, params) => {
        const stmt = sqlite.prepare(text);
        if (params && params.length > 0) {
          return { rows: stmt.all(params), rowCount: stmt.changes || 0 };
        }
        return { rows: stmt.all(), rowCount: 0 };
      },
      close: () => sqlite.close(),
      type: 'sqlite',
      raw: sqlite
    };

    console.log('✅ Connected to SQLite database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

// Initialize database schema
async function initializeDatabase() {
  let createUsersTable;
  let createIndex;
  let createSessionsTable;

  if (db.type === 'postgres') {
    createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    createIndex = `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    
    // Session table for connect-pg-simple (will be auto-created by connect-pg-simple with createTableIfMissing: true)
    // No need to create manually
  } else {
    createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    createIndex = `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  }

  try {
    if (db.type === 'sqlite' && db.raw) {
      db.raw.exec(createUsersTable);
      db.raw.exec(createIndex);
      console.log('✅ Database schema initialized');
    } else {
      await db.query(createUsersTable);
      await db.query(createIndex);
      if (createSessionsTable) {
        try {
          await db.query(createSessionsTable);
        } catch (err) {
          // Session table might already exist, ignore
          if (!err.message.includes('already exists')) {
            console.warn('Session table creation warning:', err.message);
          }
        }
      }
      console.log('✅ Database schema initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // Don't throw - allow server to start even if table already exists
    if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
      throw error;
    }
  }
}

// Initialize on module load
if (db.type === 'sqlite' && db.raw) {
  initializeDatabase();
} else {
  initializeDatabase().catch((err) => {
    console.error('Database init error (non-fatal):', err.message);
  });
}

module.exports = db;
