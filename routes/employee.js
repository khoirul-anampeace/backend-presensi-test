const express = require('express');
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All employee routes require authentication
router.use(authenticateToken);

// GET all employees (Admin & HR dapat akses)
router.get('/', getAllEmployees);

// GET employee by ID
router.get('/:id', getEmployeeById);

// Admin only routes
router.post('/', requireAdmin, createEmployee);        // Create employee
router.put('/:id', requireAdmin, updateEmployee);     // Update employee  
router.delete('/:id', requireAdmin, deleteEmployee);  // Delete employee

module.exports = router;