const pool = require('../config/database');

class RefreshToken {
  static async create(userId, token, expiresAt) {
    const result = await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await pool.query(
      'SELECT rt.*, u.email, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = $1 AND rt.is_active = true AND rt.expires_at > NOW()',
      [token]
    );
    return result.rows[0];
  }

  static async deactivate(token) {
    const result = await pool.query(
      'UPDATE refresh_tokens SET is_active = false WHERE token = $1 RETURNING *',
      [token]
    );
    return result.rows[0];
  }

  static async deactivateAllByUserId(userId) {
    const result = await pool.query(
      'UPDATE refresh_tokens SET is_active = false WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  }
}

module.exports = RefreshToken;