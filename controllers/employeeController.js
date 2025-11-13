const Employee = require("../models/Employee");
const User = require("../models/User");

const createEmployee = async (req, res) => {
  try {
    const { userId, fullName, department, position, phone, hireDate } =
      req.body;

    // Validasi required fields (tanpa employeeCode)
    if (!userId || !fullName || !hireDate) {
      return res.status(400).json({
        success: false,
        message: "User ID, Full Name, and Hire Date are required",
      });
    }

    // Check if user exists
    const pool = require("../config/database");
    const [userCheck] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already has employee record
    const existingUserEmployee = await Employee.findByUserId(userId);
    if (existingUserEmployee) {
      return res.status(400).json({
        success: false,
        message: "User already has an employee record",
      });
    }

    // Create employee (employeeCode akan auto-generate di model)
    const employee = await Employee.create({
      userId,
      fullName,
      department,
      position,
      phone,
      hireDate,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json({
      success: true,
      message: "Employees retrieved successfully",
      employees,
      count: employees.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee retrieved successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getEmployeeByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const employee = await Employee.findByUserId(user_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee retrieved successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      department,
      position,
      phone,
      hireDate,
      email,
      role,
      password,
    } = req.body;

    // Check if employee exists
    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Prepare employee update data - hanya field yang ada nilainya
    const employeeUpdateData = {};

    if (fullName !== undefined && fullName !== "") {
      employeeUpdateData.fullName = fullName;
    }
    if (department !== undefined && department !== "") {
      employeeUpdateData.department = department;
    }
    if (position !== undefined && position !== "") {
      employeeUpdateData.position = position;
    }
    if (phone !== undefined && phone !== "") {
      employeeUpdateData.phone = phone;
    }
    if (hireDate !== undefined && hireDate !== "") {
      employeeUpdateData.hireDate = hireDate;
    }

    // Update employee hanya jika ada data yang berubah
    if (Object.keys(employeeUpdateData).length > 0) {
      await Employee.update(id, employeeUpdateData);
    }

    // Update user data if provided
    const userId = existingEmployee.user_id;
    const userUpdateData = {};

    // Check email
    if (email !== undefined && email !== "") {
      // Check if email already used by another user
      if (email !== existingEmployee.email) {
        const emailCheck = await User.findByEmail(email);
        if (emailCheck && emailCheck.id !== userId) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
      }
      userUpdateData.email = email;
    }

    // Check role
    if (role !== undefined && role !== "") {
      // Validasi role
      if (!["admin", "hr", "employee"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be: admin, hr, or employee",
        });
      }
      userUpdateData.role = role;
    }

    // Update user jika ada data yang berubah
    if (Object.keys(userUpdateData).length > 0) {
      await User.update(userId, userUpdateData);
    }

    // Update password if provided
    if (password !== undefined && password !== "") {
      // Validasi password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.updatePassword(userId, hashedPassword);
    }

    // Get updated employee with user data
    const updatedEmployee = await Employee.findById(id);

    res.json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.delete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Helper function
const getUserEmailById = async (userId) => {
  const result = await require("../config/database").query(
    "SELECT email FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0]?.email;
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  updateEmployee,
  deleteEmployee,
};
