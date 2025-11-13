const pool = require("../config/database");

class Employee {
  static async generateEmployeeCode(hireDate) {
    const year = new Date(hireDate).getFullYear().toString().slice(-2);

    const [rows] = await pool.query(
      `SELECT employee_code FROM employees 
       WHERE employee_code LIKE ? 
       ORDER BY employee_code DESC 
       LIMIT 1`,
      [`EMP${year}%`]
    );

    let sequence = "001";

    if (rows.length > 0) {
      const lastCode = rows[0].employee_code;
      const lastSequence = parseInt(lastCode.slice(-3));
      const nextSequence = lastSequence + 1;
      sequence = nextSequence.toString().padStart(3, "0");
    }

    return `EMP${year}${sequence}`;
  }

  static async create(employeeData) {
    const { userId, fullName, department, position, phone, hireDate } =
      employeeData;

    const employeeCode = await this.generateEmployeeCode(hireDate);

    const [result] = await pool.query(
      `INSERT INTO employees (user_id, employee_code, full_name, department, position, phone, hire_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, employeeCode, fullName, department, position, phone, hireDate]
    );

    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      result.insertId,
    ]);
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.query(`
      SELECT e.*, u.email, u.role 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.is_active = TRUE 
      ORDER BY e.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT e.*, u.email, u.role 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.id = ? AND e.is_active = TRUE
    `,
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `
      SELECT * FROM employees 
      WHERE user_id = ? AND is_active = TRUE
    `,
      [userId]
    );
    return rows[0];
  }

  static async findByEmployeeCode(employeeCode) {
    const [rows] = await pool.query(
      `
      SELECT * FROM employees 
      WHERE employee_code = ? AND is_active = TRUE
    `,
      [employeeCode]
    );
    return rows[0];
  }

  static async update(id, employeeData) {
    // Build dynamic UPDATE query
    const fields = [];
    const values = [];
    let index = 1;

    if (employeeData.fullName !== undefined) {
      fields.push(`full_name = ?`);
      values.push(employeeData.fullName);
    }
    if (employeeData.department !== undefined) {
      fields.push(`department = ?`);
      values.push(employeeData.department);
    }
    if (employeeData.position !== undefined) {
      fields.push(`position = ?`);
      values.push(employeeData.position);
    }
    if (employeeData.phone !== undefined) {
      fields.push(`phone = ?`);
      values.push(employeeData.phone);
    }
    if (employeeData.hireDate !== undefined) {
      fields.push(`hire_date = ?`);
      values.push(employeeData.hireDate);
    }

    // Jika tidak ada field yang diupdate, return data existing
    if (fields.length === 0) {
      const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
        id,
      ]);
      return rows[0];
    }

    // Add id to values
    values.push(id);

    // Execute update
    await pool.query(
      `UPDATE employees 
     SET ${fields.join(", ")}
     WHERE id = ? AND is_active = TRUE`,
      values
    );

    // Return updated data
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  static async delete(id) {
    await pool.query(
      `
      UPDATE employees 
      SET is_active = FALSE 
      WHERE id = ?`,
      [id]
    );

    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }
}

module.exports = Employee;
