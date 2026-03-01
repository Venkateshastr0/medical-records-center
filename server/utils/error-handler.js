// Comprehensive Error Handling Utility
class ErrorHandler {
  static logError(error, context = '', userId = null) {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      context,
      userId,
      message: error.message || error,
      stack: error.stack,
      level: this.getErrorLevel(error)
    };

    // Log to console
    console.error(`[${timestamp}] ${errorData.level.toUpperCase()}: ${context} - ${errorData.message}`, errorData);

    // Log to file (in production)
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logFile = path.join(__dirname, '../../logs/errors.log');
      
      fs.appendFile(logFile, JSON.stringify(errorData) + '\n')
        .catch(err => console.error('Failed to write error log:', err));
    }

    // Send to monitoring service (if configured)
    if (process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 1.0,
      });
      
      Sentry.captureException(error, {
        tags: { context, userId },
        extra: { context }
      });
    }
  }

  static apiError(res, error, statusCode = 500, context = '') {
    const errorResponse = {
      success: false,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.stack
    };

    res.status(statusCode).json(errorResponse);
    
    // Log the error
    this.logError(error, context);
  }

  static getErrorLevel(error) {
    if (error.name === 'ValidationError') return 'WARN';
    if (error.name === 'UnauthorizedError') return 'ERROR';
    if (error.name === 'DatabaseError') return 'CRITICAL';
    if (error.name === 'AuthenticationError') return 'ERROR';
    return 'ERROR';
  }

  static async withDatabase(operation, callback) {
    const db = require('../db/database');
    
    try {
      return await callback(db);
    } catch (error) {
      this.logError(error, `Database operation: ${operation}`);
      throw error;
    }
  }

  static async withTransaction(operations) {
    const db = require('../db/database');
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        try {
          // Execute operations sequentially
          const executeOperations = async () => {
            for (const operation of operations) {
              await operation(db);
            }
          };
          
          executeOperations()
            .then(() => {
              db.run('COMMIT');
              resolve();
            })
            .catch((err) => {
              db.run('ROLLBACK');
              reject(err);
            });
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*>?/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }

  static validatePassword(password) {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),_+=\-\[\]{}|\\:"'<>,.?]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  static createApiError(message, statusCode = 500, details = null) {
    return {
      success: false,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static createSuccessResponse(data, message = 'Operation successful') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ErrorHandler();
