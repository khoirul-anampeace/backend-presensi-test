const pool = require("../config/database");

class RefreshToken {
  static async create(userId, token, expiresAt) {
    const [result] = await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    const [rows] = await pool.query(
      "SELECT * FROM refresh_tokens WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  static async findByToken(token) {
    const [rows] = await pool.query(
      `SELECT rt.*, u.email, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.is_active = TRUE AND rt.expires_at > NOW()`,
      [token]
    );
    return rows[0];
  }

  static async deactivate(token) {
    await pool.query(
      "UPDATE refresh_tokens SET is_active = FALSE WHERE token = ?",
      [token]
    );

    const [rows] = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [token]
    );
    return rows[0];
  }

  static async deactivateAllByUserId(userId) {
    const [result] = await pool.query(
      "UPDATE refresh_tokens SET is_active = FALSE WHERE user_id = ?",
      [userId]
    );
    return result.affectedRows;
  }
}

module.exports = RefreshToken;
