const pool = require('../config/database');

class Employee {
  static async create(employeeData) {
    const { 
      userId, 
      employeeCode, 
      fullName, 
      department, 
      position, 
      phone, 
      hireDate 
    } = employeeData;
    
    const result = await pool.query(
      `INSERT INTO employees (user_id, employee_code, full_name, department, position, phone, hire_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, employeeCode, fullName, department, position, phone, hireDate]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(`
      SELECT e.*, u.email, u.role 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.is_active = true 
      ORDER BY e.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT e.*, u.email, u.role 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.id = $1 AND e.is_active = true
    `, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(`
      SELECT * FROM employees 
      WHERE user_id = $1 AND is_active = true
    `, [userId]);
    return result.rows[0];
  }

  static async findByEmployeeCode(employeeCode) {
    const result = await pool.query(`
      SELECT * FROM employees 
      WHERE employee_code = $1 AND is_active = true
    `, [employeeCode]);
    return result.rows[0];
  }

  static async update(id, employeeData) {
    const { fullName, department, position, phone, hireDate } = employeeData;
    const result = await pool.query(`
      UPDATE employees 
      SET full_name = $2, department = $3, position = $4, phone = $5, hire_date = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true 
      RETURNING *`,
      [id, fullName, department, position, phone, hireDate]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Soft delete
    const result = await pool.query(`
      UPDATE employees 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Employee;