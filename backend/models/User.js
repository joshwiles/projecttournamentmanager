/**
 * User model with database operations
 */

const db = require('../db');
const bcrypt = require('bcryptjs');

// Helper to get db type
function getDbType() {
  return db.type || 'sqlite';
}

const SALT_ROUNDS = 12;

class User {
  /**
   * Create a new user
   */
  static async create({ email, password, name }) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const dbType = getDbType();
      if (dbType === 'sqlite' && db.raw) {
        // SQLite doesn't support RETURNING, so insert then select
        const insertStmt = db.raw.prepare(`
          INSERT INTO users (email, password_hash, name)
          VALUES (?, ?, ?)
        `);
        const result = insertStmt.run(normalizedEmail, passwordHash, name.trim());
        const userId = result.lastInsertRowid;
        
        // Fetch the created user
        const selectStmt = db.raw.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?');
        const user = selectStmt.get(userId);
        return user;
      } else {
        // PostgreSQL supports RETURNING
        const query = `
          INSERT INTO users (email, password_hash, name)
          VALUES ($1, $2, $3)
          RETURNING id, email, name, created_at, updated_at
        `;
        const result = await db.query(query, [normalizedEmail, passwordHash, name.trim()]);
        return result.rows[0];
      }
    } catch (error) {
      if (error.code === '23505' || error.message.includes('UNIQUE constraint') || error.message.includes('UNIQUE')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const dbType = getDbType();
    
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('SELECT * FROM users WHERE email = ?');
      return stmt.get(normalizedEmail) || null;
    } else {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await db.query(query, [normalizedEmail]);
      return result.rows[0] || null;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const dbType = getDbType();
    
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?');
      return stmt.get(id) || null;
    } else {
      const query = 'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user without sensitive data
   */
  static toSafeUser(user) {
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = User;
