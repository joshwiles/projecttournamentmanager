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
        const selectStmt = db.raw.prepare('SELECT id, email, name, preferences, created_at, updated_at FROM users WHERE id = ?');
        const user = selectStmt.get(userId);
        return user;
      } else {
        // PostgreSQL supports RETURNING
        const query = `
          INSERT INTO users (email, password_hash, name)
          VALUES ($1, $2, $3)
          RETURNING id, email, name, preferences, created_at, updated_at
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
      const stmt = db.raw.prepare('SELECT id, email, name, preferences, created_at, updated_at FROM users WHERE id = ?');
      return stmt.get(id) || null;
    } else {
      const query = 'SELECT id, email, name, preferences, created_at, updated_at FROM users WHERE id = $1';
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
   * Update user profile (name and/or email)
   */
  static async updateProfile(id, { name, email }) {
    const dbType = getDbType();
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name');
      values.push(name.trim());
    }
    if (email !== undefined) {
      updates.push('email');
      values.push(email.toLowerCase().trim());
    }
    if (updates.length === 0) return User.findById(id);

    try {
      if (dbType === 'sqlite' && db.raw) {
        const setClauses = updates.map(col => `${col} = ?`).join(', ');
        const stmt = db.raw.prepare(`UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(...values, id);
        return User.findById(id);
      } else {
        const setClauses = updates.map((col, i) => `${col} = $${i + 1}`).join(', ');
        const query = `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $${updates.length + 1} RETURNING id, email, name, preferences, created_at, updated_at`;
        const result = await db.query(query, [...values, id]);
        return result.rows[0] || null;
      }
    } catch (error) {
      if (error.code === '23505' || (error.message && error.message.includes('UNIQUE'))) {
        throw new Error('Email already in use');
      }
      throw error;
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(id, newPasswordHash) {
    const dbType = getDbType();

    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(newPasswordHash, id);
    } else {
      await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, id]);
    }
  }

  /**
   * Find user by ID with password hash (for password verification)
   */
  static async findByIdWithHash(id) {
    const dbType = getDbType();

    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('SELECT * FROM users WHERE id = ?');
      return stmt.get(id) || null;
    } else {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(id, preferences) {
    const dbType = getDbType();
    const json = JSON.stringify(preferences);

    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('UPDATE users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(json, id);
      return User.findById(id);
    } else {
      const result = await db.query(
        'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, preferences, created_at, updated_at',
        [json, id]
      );
      return result.rows[0] || null;
    }
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
