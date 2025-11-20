const pool = require("../config/database");

class FaceEncoding {
  // Save single encoding
  static async create(faceData) {
    const { employeeId, encoding, photoPath } = faceData;

    // Deactivate previous encodings for this employee
    await pool.query(
      "UPDATE face_encodings SET is_active = FALSE WHERE employee_id = ?",
      [employeeId]
    );

    const [result] = await pool.query(
      "INSERT INTO face_encodings (employee_id, encoding, photo_path, photo_number) VALUES (?, ?, ?, ?)",
      [employeeId, JSON.stringify(encoding), photoPath, 1]
    );

    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  // Save multiple encodings (5 photos)
  static async createMultiple(employeeId, encodingsArray, photoPaths = []) {
    // Deactivate old encodings
    await pool.query(
      "UPDATE face_encodings SET is_active = FALSE WHERE employee_id = ?",
      [employeeId]
    );

    // Insert multiple encodings
    const insertedIds = [];
    for (let i = 0; i < encodingsArray.length; i++) {
      const photoPath = photoPaths[i] || null;
      const photoNumber = i + 1;

      const [result] = await pool.query(
        "INSERT INTO face_encodings (employee_id, encoding, photo_path, photo_number) VALUES (?, ?, ?, ?)",
        [employeeId, JSON.stringify(encodingsArray[i]), photoPath, photoNumber]
      );

      insertedIds.push(result.insertId);
    }

    // Return all saved encodings
    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE id IN (?) ORDER BY photo_number",
      [insertedIds]
    );
    return rows;
  }

  // Get all encodings for one employee
  static async findAllByEmployeeId(employeeId) {
    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE employee_id = ? AND is_active = TRUE ORDER BY photo_number",
      [employeeId]
    );
    return rows;
  }

  // Get single encoding by employee (first photo only)
  static async findByEmployeeId(employeeId) {
    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE employee_id = ? AND is_active = TRUE ORDER BY photo_number LIMIT 1",
      [employeeId]
    );
    return rows[0];
  }

  // Get all active encodings (for verification)
  static async findAllActive() {
    const [rows] = await pool.query(`
      SELECT fe.*, e.full_name, e.employee_code
      FROM face_encodings fe
      JOIN employees e ON fe.employee_id = e.id
      WHERE fe.is_active = TRUE AND e.is_active = TRUE
      ORDER BY fe.employee_id, fe.photo_number
    `);
    return rows;
  }

  // Get all active encodings grouped by employee
  static async findAllActiveGrouped() {
    const allEncodings = await this.findAllActive();

    // Group by employee_id
    const grouped = {};
    allEncodings.forEach((enc) => {
      if (!grouped[enc.employee_id]) {
        grouped[enc.employee_id] = {
          employee_id: enc.employee_id,
          employee_code: enc.employee_code,
          full_name: enc.full_name,
          encodings: [],
          photo_count: 0,
        };
      }
      grouped[enc.employee_id].encodings.push(JSON.parse(enc.encoding));
      grouped[enc.employee_id].photo_count++;
    });

    return Object.values(grouped);
  }

  static async update(id, faceData) {
    const { encoding, photoPath } = faceData;

    const fields = [];
    const values = [];

    if (encoding !== undefined) {
      fields.push("encoding = ?");
      values.push(JSON.stringify(encoding));
    }
    if (photoPath !== undefined) {
      fields.push("photo_path = ?");
      values.push(photoPath);
    }

    if (fields.length === 0) {
      const [rows] = await pool.query(
        "SELECT * FROM face_encodings WHERE id = ?",
        [id]
      );
      return rows[0];
    }

    values.push(id);

    await pool.query(
      `UPDATE face_encodings SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async deactivate(id) {
    await pool.query(
      "UPDATE face_encodings SET is_active = FALSE WHERE id = ?",
      [id]
    );

    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async deactivateAllByEmployeeId(employeeId) {
    const [result] = await pool.query(
      "UPDATE face_encodings SET is_active = FALSE WHERE employee_id = ?",
      [employeeId]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [rows] = await pool.query(
      "SELECT * FROM face_encodings WHERE id = ?",
      [id]
    );
    await pool.query("DELETE FROM face_encodings WHERE id = ?", [id]);
    return rows[0];
  }

  static async deleteAllByEmployeeId(employeeId) {
    const [result] = await pool.query(
      "DELETE FROM face_encodings WHERE employee_id = ?",
      [employeeId]
    );
    return result.affectedRows;
  }
}

module.exports = FaceEncoding;
