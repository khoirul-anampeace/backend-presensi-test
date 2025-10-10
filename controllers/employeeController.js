const Employee = require('../models/Employee');
const User = require('../models/User');

const createEmployee = async (req, res) => {
  try {
    const { 
      userId, 
      fullName, 
      department, 
      position, 
      phone, 
      hireDate 
    } = req.body;

    // Validasi required fields (tanpa employeeCode)
    if (!userId || !fullName || !hireDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Full Name, and Hire Date are required'
      });
    }

    // Check if user exists
    const userCheck = await require('../config/database').query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has employee record
    const existingUserEmployee = await Employee.findByUserId(userId);
    if (existingUserEmployee) {
      return res.status(400).json({
        success: false,
        message: 'User already has an employee record'
      });
    }

    // Create employee (employeeCode akan auto-generate di model)
    const employee = await Employee.create({
      userId,
      fullName,
      department,
      position,
      phone,
      hireDate
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json({
      success: true,
      message: 'Employees retrieved successfully',
      employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee retrieved successfully',
      employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee retrieved successfully',
      employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, department, position, phone, hireDate } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full Name is required'
      });
    }

    const employee = await Employee.update(id, {
      fullName,
      department,
      position,
      phone,
      hireDate
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function
const getUserEmailById = async (userId) => {
  const result = await require('../config/database').query(
    'SELECT email FROM users WHERE id = $1', 
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
  deleteEmployee
};