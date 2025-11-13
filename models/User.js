const pool = require("../config/database");

class User {
  static async findAll() {
    const [rows] = await pool.query(
      "SELECT id, email, role, created_at FROM users"
    );
    return rows;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async create(userData) {
    const { email, password, role } = userData;
    const [result] = await pool.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, password, role]
    );

    const [rows] = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  static async update(id, userData) {
    // Build dynamic UPDATE query
    const fields = [];
    const values = [];

    if (userData.email !== undefined) {
      fields.push(`email = ?`);
      values.push(userData.email);
    }
    if (userData.role !== undefined) {
      fields.push(`role = ?`);
      values.push(userData.role);
    }

    // Jika tidak ada field yang diupdate, return data existing
    if (fields.length === 0) {
      const [rows] = await pool.query(
        "SELECT id, email, role, created_at FROM users WHERE id = ?",
        [id]
      );
      return rows[0];
    }

    // Add id to values
    values.push(id);

    // Execute update
    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated data
    const [rows] = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    const [rows] = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async delete(id) {
    const [employeeCheck] = await pool.query(
      "SELECT id FROM employees WHERE user_id = ? AND is_active = TRUE",
      [id]
    );

    if (employeeCheck.length > 0) {
      throw new Error("Cannot delete user with active employee record");
    }

    const [rows] = await pool.query(
      "SELECT id, email, role FROM users WHERE id = ?",
      [id]
    );

    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return rows[0];
  }
}

module.exports = User;
