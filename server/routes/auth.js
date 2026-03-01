const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const fieldEncryption = require('../utils/field-encryption');
const hipaaCompliance = require('../utils/hipaa-compliance');
const ErrorHandler = require('../utils/error-handler');
const NotificationManager = require('../utils/notifications');
const { authenticateUser } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

// Global notification manager instance
const notificationManager = require('../utils/notifications');

// Initialize notification manager with server (will be called from main server)
function initializeNotifications(server) {
  notificationManager.initialize(server);
}

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per window
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 reset requests per hour
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Login endpoint with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Log login attempt
    await hipaaCompliance.logHIPAAEvent({
      userId: username,
      eventType: 'LOGIN',
      resourceType: 'user_accounts',
      action: 'ATTEMPT',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const user = await authenticateUser(username, password);

    if (!user) {
      // Log failed login
      await hipaaCompliance.logHIPAAEvent({
        userId: username,
        eventType: 'LOGIN',
        resourceType: 'user_accounts',
        action: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: 'Invalid credentials'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      await hipaaCompliance.logHIPAAEvent({
        userId: user.user_id,
        eventType: 'LOGIN',
        resourceType: 'user_accounts',
        action: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: `User status: ${user.status}`
      });

      return res.status(403).json({
        success: false,
        message: 'Account not approved'
      });
    }

    // Generate session token
    const sessionToken = fieldEncryption.generateApiKey(user.user_id, '8h');

    await logAudit(user.user_id, 'LOGIN', null, 'User logged in via API');

    // Log successful login
    await hipaaCompliance.logHIPAAEvent({
      userId: user.user_id,
      eventType: 'LOGIN',
      resourceType: 'user_accounts',
      action: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send notification to admins about successful login
    if (user.role === 'Admin' || user.role === 'Developer') {
      notificationManager.sendToAllAdmins('USER_LOGIN', {
        message: `Admin/Developer login: ${user.name} (${user.username})`,
        severity: 'info',
        data: {
          userId: user.user_id,
          username: user.username,
          role: user.role,
          loginTime: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      token: sessionToken
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Login authentication');
    ErrorHandler.apiError(res, error);
  }
});

// Forgot password endpoint
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!ErrorHandler.validateEmail(email)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid email format'));
    }

    if (!email || email.trim().length === 0) {
      return res.status(400).json(ErrorHandler.createApiError('Email cannot be empty'));
    }

    // Log password reset request
    await hipaaCompliance.logHIPAAEvent({
      userId: email,
      eventType: 'PASSWORD_RESET',
      resourceType: 'user_accounts',
      action: 'REQUEST',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const db = require('../db/database');
    
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT user_id FROM Users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, password reset instructions have been sent'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date(Date.now() + 3600000); // 1 hour expiry

    // Store reset token
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO PasswordResets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.user_id, resetToken, expiryTime.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Send email (in production, this would use nodemailer)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      resetToken: resetToken // For development/testing
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Password reset request');
    ErrorHandler.apiError(res, error);
  }
});

// Validate token endpoint
router.post('/validate-token', (req, res) => {
  try {
    const { token } = req.body;
    const { email } = req.body;
    
    if (!ErrorHandler.validateEmail(email)) {
      return res.status(400).json(ErrorHandler.createApiError('Invalid email format'));
    }

    if (!token) {
      return res.status(400).json(ErrorHandler.createApiError('Token is required'));
    }

    const decoded = fieldEncryption.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      message: 'Token validated successfully',
      user: decoded
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || token.trim().length === 0) {
      return res.status(400).json(ErrorHandler.createApiError('Token is required'));
    }

    if (!newPassword || newPassword.trim().length < 8) {
      return res.status(400).json(ErrorHandler.createApiError('Password must be at least 8 characters'));
    }

    if (!ErrorHandler.validatePassword(newPassword)) {
      return res.status(400).json(ErrorHandler.createApiError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'));
    }

    // Validate token and check expiry
    const db = require('../db/database');
    const reset = await new Promise((resolve, reject) => {
      db.get(
        'SELECT pr.user_id, pr.expires_at FROM PasswordResets pr JOIN Users u ON pr.user_id = u.user_id WHERE pr.token = ? AND pr.used_at IS NULL AND pr.expires_at > datetime("now")',
        [token],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!reset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE Users SET password_hash = ?, updated_at = ? WHERE user_id = ?',
        [hashedPassword, new Date().toISOString(), reset.user_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Mark token as used
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE PasswordResets SET used_at = ? WHERE token = ?',
        [new Date().toISOString(), token],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log password reset completion
    await hipaaCompliance.logHIPAAEvent({
      userId: reset.user_id,
      eventType: 'PASSWORD_RESET',
      resourceType: 'user_accounts',
      action: 'COMPLETE',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // In a real application, you would invalidate the session token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
module.exports.initializeNotifications = initializeNotifications;
