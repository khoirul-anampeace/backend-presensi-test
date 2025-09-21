const pool = require('../config/database');

class User {
  static async findAll() {
    const result = await pool.query('SELECT id, email, role, created_at FROM users');
    return result.rows;
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { email, password, role } = userData;
    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, password, role]
    );
    return result.rows[0];
  }
}

module.exports = User;