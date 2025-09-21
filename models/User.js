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

  static async findById(id) {
    const result = await pool.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [id]);
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

  static async update(id, userData) {
    const { email, role } = userData;
    const result = await pool.query(
      'UPDATE users SET email = $2, role = $3 WHERE id = $1 RETURNING id, email, role, created_at',
      [id, email, role]
    );
    return result.rows[0];
  }

  static async updatePassword(id, hashedPassword) {
    const result = await pool.query(
      'UPDATE users SET password = $2 WHERE id = $1 RETURNING id, email, role, created_at',
      [id, hashedPassword]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Check if user has employee record first
    const employeeCheck = await pool.query('SELECT id FROM employees WHERE user_id = $1 AND is_active = true', [id]);
    
    if (employeeCheck.rows.length > 0) {
      throw new Error('Cannot delete user with active employee record');
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email, role', [id]);
    return result.rows[0];
  }
}

module.exports = User;