const db = require('../db');

function getDbType() {
  return db.type || 'sqlite';
}

function _parseRow(row) {
  if (!row) return null;
  if (typeof row.tournament_data === 'string') {
    row.tournament_data = JSON.parse(row.tournament_data);
  }
  return row;
}

class SavedTournament {
  static async create(userId, tournament) {
    const name = tournament.name;
    const tournamentType = tournament.tournamentType || 'swiss';
    const status = tournament.status || 'registration';
    const playerCount = tournament.players ? tournament.players.length : 0;
    const currentRound = tournament.currentRound || 0;
    const numberOfRounds = tournament.numberOfRounds || 0;
    const data = JSON.stringify(tournament);

    const dbType = getDbType();
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare(`
        INSERT INTO saved_tournaments (user_id, name, tournament_type, status, player_count, current_round, number_of_rounds, tournament_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(userId, name, tournamentType, status, playerCount, currentRound, numberOfRounds, data);
      const id = result.lastInsertRowid;
      const row = db.raw.prepare('SELECT * FROM saved_tournaments WHERE id = ?').get(id);
      return _parseRow(row);
    } else {
      const query = `
        INSERT INTO saved_tournaments (user_id, name, tournament_type, status, player_count, current_round, number_of_rounds, tournament_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await db.query(query, [userId, name, tournamentType, status, playerCount, currentRound, numberOfRounds, data]);
      return _parseRow(result.rows[0]);
    }
  }

  static async update(id, userId, tournament) {
    const name = tournament.name;
    const tournamentType = tournament.tournamentType || 'swiss';
    const status = tournament.status || 'registration';
    const playerCount = tournament.players ? tournament.players.length : 0;
    const currentRound = tournament.currentRound || 0;
    const numberOfRounds = tournament.numberOfRounds || 0;
    const data = JSON.stringify(tournament);

    const dbType = getDbType();
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare(`
        UPDATE saved_tournaments
        SET name = ?, tournament_type = ?, status = ?, player_count = ?, current_round = ?, number_of_rounds = ?, tournament_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      const result = stmt.run(name, tournamentType, status, playerCount, currentRound, numberOfRounds, data, id, userId);
      if (result.changes === 0) return null;
      const row = db.raw.prepare('SELECT * FROM saved_tournaments WHERE id = ?').get(id);
      return _parseRow(row);
    } else {
      const query = `
        UPDATE saved_tournaments
        SET name = $1, tournament_type = $2, status = $3, player_count = $4, current_round = $5, number_of_rounds = $6, tournament_data = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING *
      `;
      const result = await db.query(query, [name, tournamentType, status, playerCount, currentRound, numberOfRounds, data, id, userId]);
      return _parseRow(result.rows[0]) || null;
    }
  }

  static async listByUser(userId) {
    const dbType = getDbType();
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare(`
        SELECT id, user_id, name, tournament_type, status, player_count, current_round, number_of_rounds, created_at, updated_at
        FROM saved_tournaments WHERE user_id = ? ORDER BY updated_at DESC
      `);
      return stmt.all(userId);
    } else {
      const query = `
        SELECT id, user_id, name, tournament_type, status, player_count, current_round, number_of_rounds, created_at, updated_at
        FROM saved_tournaments WHERE user_id = $1 ORDER BY updated_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    }
  }

  static async findById(id, userId) {
    const dbType = getDbType();
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('SELECT * FROM saved_tournaments WHERE id = ? AND user_id = ?');
      return _parseRow(stmt.get(id, userId)) || null;
    } else {
      const query = 'SELECT * FROM saved_tournaments WHERE id = $1 AND user_id = $2';
      const result = await db.query(query, [id, userId]);
      return _parseRow(result.rows[0]) || null;
    }
  }

  static async delete(id, userId) {
    const dbType = getDbType();
    if (dbType === 'sqlite' && db.raw) {
      const stmt = db.raw.prepare('DELETE FROM saved_tournaments WHERE id = ? AND user_id = ?');
      const result = stmt.run(id, userId);
      return result.changes > 0;
    } else {
      const query = 'DELETE FROM saved_tournaments WHERE id = $1 AND user_id = $2';
      const result = await db.query(query, [id, userId]);
      return result.rowCount > 0;
    }
  }
}

module.exports = SavedTournament;
