const FaceEncoding = require("../models/FaceEncoding");

// Get all active face encodings (for verification)
const getAllActiveEncodings = async (req, res) => {
  try {
    const encodings = await FaceEncoding.findAllActive();

    // Parse JSON encoding
    const parsedEncodings = encodings.map((enc) => ({
      id: enc.id,
      employee_id: enc.employee_id,
      employee_code: enc.employee_code,
      full_name: enc.full_name,
      encoding: JSON.parse(enc.encoding),
      photo_number: enc.photo_number,
    }));

    res.json({
      success: true,
      count: parsedEncodings.length,
      encodings: parsedEncodings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all active encodings grouped by employee
const getAllActiveEncodingsGrouped = async (req, res) => {
  try {
    const grouped = await FaceEncoding.findAllActiveGrouped();

    res.json({
      success: true,
      count: grouped.length,
      employees: grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get face encodings by employee ID
const getEncodingsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const encodings = await FaceEncoding.findAllByEmployeeId(employeeId);

    if (encodings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No face encodings found for this employee",
      });
    }

    // Parse JSON encoding
    const parsedEncodings = encodings.map((enc) => ({
      id: enc.id,
      employee_id: enc.employee_id,
      encoding: JSON.parse(enc.encoding),
      photo_path: enc.photo_path,
      photo_number: enc.photo_number,
      created_at: enc.created_at,
    }));

    res.json({
      success: true,
      count: parsedEncodings.length,
      encodings: parsedEncodings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update face encoding
const updateFaceEncoding = async (req, res) => {
  try {
    const { id } = req.params;
    const { encoding, photoPath } = req.body;

    const updated = await FaceEncoding.update(id, { encoding, photoPath });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Face encoding not found",
      });
    }

    res.json({
      success: true,
      message: "Face encoding updated successfully",
      encoding: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete face encoding
const deleteFaceEncoding = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await FaceEncoding.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Face encoding not found",
      });
    }

    res.json({
      success: true,
      message: "Face encoding deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete all face encodings for an employee
const deleteAllEncodingsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const count = await FaceEncoding.deleteAllByEmployeeId(employeeId);

    res.json({
      success: true,
      message: `${count} face encoding(s) deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllActiveEncodings,
  getAllActiveEncodingsGrouped,
  getEncodingsByEmployeeId,
  updateFaceEncoding,
  deleteFaceEncoding,
  deleteAllEncodingsByEmployee,
};
