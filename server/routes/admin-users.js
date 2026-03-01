const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ErrorHandler = require('../utils/error-handler');
const { logAudit } = require('../utils/audit');

// Get all users with pagination, search, and filtering
router.get('/', async (req, res) => {
  try {
    const db = require('../db/database');
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ` AND (username LIKE ? OR email LIKE ? OR name LIKE ?)`;
      params.push(`%${search}%`);
    }
    
    if (role) {
      whereClause += ` AND role = ?`;
      params.push(role);
    }
    
    if (status) {
      whereClause += ` AND status = ?`;
      params.push(status);
    }
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM Users WHERE ${whereClause}`;
    const totalResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
    
    // Get users with pagination
    const usersQuery = `
      SELECT user_id, username, name, email, role, status, created_at, last_login 
      FROM Users 
      WHERE ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const users = await new Promise((resolve, reject) => {
      db.all(usersQuery, [...params, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalResult,
        totalPages: Math.ceil(totalResult / limit)
      }
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get users');
    ErrorHandler.apiError(res, error);
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const db = require('../db/database');
    const userId = req.params.id;
    
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id, username, name, email, role, status, created_at, last_login FROM Users WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json(ErrorHandler.createApiError('User not found'));
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get user by ID');
    ErrorHandler.apiError(res, error);
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const db = require('../db/database');
    const { username, password, name, email, role } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json(ErrorHandler.createApiError('All fields are required'));
    }
    
    // Validate email format
    if (!ErrorHandler.validateEmail(email)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid email format'));
    }
    
    // Validate password strength
    if (!ErrorHandler.validatePassword(password)) {
      return res.status(400).json(ErrorHandler.createApiError('Password does not meet security requirements'));
    }
    
    // Validate role
    const validRoles = ['Admin', 'Doctor', 'Insurance', 'Lawyer', 'Developer', 'Team Lead'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid role'));
    }
    
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM Users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existingUser) {
      return res.status(409).json(ErrorHandler.createApiError('User already exists'));
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Users (username, password_hash, name, email, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, name, email, role, 'pending', new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Log audit
    await logAudit(null, 'CREATE_USER', null, `New user created: ${username}`);
    
    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        username,
        name,
        email,
        role,
        status: 'pending'
      }
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Create user');
    ErrorHandler.apiError(res, error);
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const db = require('../db/database');
    const userId = req.params.id;
    const { name, email, role, status } = req.body;
    
    // Validate required fields
    if (!name || !email || !role || !status) {
      return res.status(400).json(ErrorHandler.createApiError('Name, email, role, and status are required'));
    }
    
    // Validate role
    const validRoles = ['Admin', 'Doctor', 'Insurance', 'Lawyer', 'Developer', 'Team Lead'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid role'));
    }
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid status'));
    }
    
    // Update user
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE Users SET name = ?, email = ?, role = ?, status = ?, updated_at = ? WHERE user_id = ?',
        [name, email, role, status, new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Log audit
    await logAudit(userId, 'UPDATE_USER', userId, `User updated: ${name}`);
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Update user');
    ErrorHandler.apiError(res, error);
  }
});

// Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const db = require('../db/database');
    const userId = req.params.id;
    
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM Users WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json(ErrorHandler.createApiError('User not found'));
    }
    
    // Soft delete (update status to suspended)
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE Users SET status = ?, updated_at = ? WHERE user_id = ?',
        ['suspended', new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Log audit
    await logAudit(userId, 'DELETE_USER', userId, `User suspended: ${userId}`);
    
    res.json({
      success: true,
      message: 'User suspended successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Delete user');
    ErrorHandler.apiError(res, error);
  }
});

// Approve user registration
router.post('/:id/approve', async (req, res) => {
  try {
    const db = require('../db/database');
    const userId = req.params.id;
    
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id, username, name, email, role FROM Users WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json(ErrorHandler.createApiError('User not found'));
    }
    
    // Update user status to approved
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE Users SET status = ?, approved_by = ?, approved_at = ? WHERE user_id = ?',
        ['approved', req.user.id, new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Update registration
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE UserRegistrations SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE user_id = ?',
        ['approved', req.user.id, new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Log audit
    await logAudit(userId, 'APPROVE_USER', userId, `User approved: ${user.username}`);
    
    res.json({
      success: true,
      message: 'User approved successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Approve user');
    ErrorHandler.apiError(res, error);
  }
});

// Reject user registration
router.post('/:id/reject', async (req, res) => {
  try {
    const db = require('../db/database');
    const userId = req.params.id;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json(ErrorHandler.createApiError('Rejection reason is required'));
    }
    
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id, username, name, email, role FROM Users WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json(ErrorHandler.createApiError('User not found'));
    }
    
    // Update user status to rejected
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE Users SET status = ?, updated_at = ? WHERE user_id = ?',
        ['rejected', new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Update registration
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE UserRegistrations SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = ? WHERE user_id = ?',
        ['rejected', rejectionReason, req.user.id, new Date().toISOString(), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Log audit
    await logAudit(userId, 'REJECT_USER', userId, `User rejected: ${user.username} - ${rejectionReason}`);
    
    res.json({
      success: true,
      message: 'User rejected successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Reject user');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
