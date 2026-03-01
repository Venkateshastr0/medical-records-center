const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs').promises;

class SecurityHardening {
  constructor() {
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
    this.maxLoginAttempts = 3;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.failedAttempts = new Map();
    this.activeSessions = new Map();
    this.encryptionKeys = new Map();
    this.auditLog = [];
  }

  // Generate session-specific encryption key
  generateSessionKey(userId, sessionId) {
    const keyMaterial = `${userId}-${sessionId}-${Date.now()}`;
    const key = crypto.scryptSync(keyMaterial, 'salt', 32);
    this.encryptionKeys.set(sessionId, key);
    return key.toString('hex');
  }

  // Encrypt sensitive data with session key
  encryptSessionData(data, sessionId) {
    const key = this.encryptionKeys.get(sessionId);
    if (!key) throw new Error('Session key not found');
    
    const cipher = crypto.createCipher('aes-256-gcm', key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return {
      encrypted: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt session data
  decryptSessionData(encryptedData, authTag, sessionId) {
    const key = this.encryptionKeys.get(sessionId);
    if (!key) throw new Error('Session key not found');
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Advanced rate limiting with user tracking
  createAdvancedRateLimit(options = {}) {
    const limiter = rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 10, // limit each IP to 10 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use IP + User ID if available
        return req.ip + (req.user ? `-${req.user.id}` : '');
      },
      handler: (req, res) => {
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          userId: req.user?.id,
          endpoint: req.path,
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Your IP has been temporarily blocked.',
          blockedUntil: new Date(Date.now + options.windowMs).toISOString()
        });
      }
    });

    return limiter;
  }

  // Session timeout and cleanup
  enforceSessionTimeout(req, res, next) {
    const sessionId = req.session?.id;
    const userId = req.user?.id;

    if (!sessionId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    // Check session age
    const sessionAge = Date.now() - sessionData.createdAt;
    if (sessionAge > this.sessionTimeout) {
      this.activeSessions.delete(sessionId);
      this.encryptionKeys.delete(sessionId);
      
      this.logSecurityEvent('SESSION_TIMEOUT', {
        userId: userId,
        sessionId: sessionId,
        sessionAge: sessionAge
      });

      return res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity'
      });
    }

    // Update last activity
    sessionData.lastActivity = Date.now();
    this.activeSessions.set(sessionId, sessionData);

    next();
  }

  // Device fingerprinting
  generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const ip = req.ip;
    
    const fingerprint = crypto.createHash('sha256')
      .update(`${userAgent}-${acceptLanguage}-${acceptEncoding}-${ip}`)
      .digest('hex');
    
    return fingerprint;
  }

  // Multi-factor authentication verification
  verifyMFA(userId, providedOTP) {
    // In production, integrate with authenticator apps or SMS
    const storedOTP = this.getStoredOTP(userId);
    
    if (!storedOTP) {
      return { valid: false, message: 'OTP expired' };
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedOTP),
      Buffer.from(storedOTP)
    );

    if (isValid) {
      this.clearStoredOTP(userId);
    }

    return { valid: isValid };
  }

  // Biometric authentication simulation
  verifyBiometric(userId, biometricData) {
    // In production, integrate with actual biometric systems
    const storedBiometric = this.getStoredBiometric(userId);
    
    if (!storedBiometric) {
      return { valid: false, message: 'Biometric data not found' };
    }

    // Simulate biometric verification
    const isValid = this.compareBiometricData(biometricData, storedBiometric);
    
    return { valid: isValid };
  }

  // Hardware security key verification
  verifyHardwareKey(userId, keyData) {
    // In production, integrate with FIDO2/WebAuthn
    const storedKey = this.getStoredHardwareKey(userId);
    
    if (!storedKey) {
      return { valid: false, message: 'Hardware key not registered' };
    }

    const isValid = this.verifyHardwareKeySignature(keyData, storedKey);
    
    return { valid: isValid };
  }

  // Advanced login attempt tracking
  trackLoginAttempt(req, success) {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const fingerprint = this.generateDeviceFingerprint(req);
    
    const attemptKey = `${ip}-${fingerprint}`;
    const attempts = this.failedAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };

    if (!success) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      this.failedAttempts.set(attemptKey, attempts);

      // Lockout if max attempts exceeded
      if (attempts.count >= this.maxLoginAttempts) {
        this.logSecurityEvent('BRUTE_FORCE_DETECTED', {
          ip: ip,
          fingerprint: fingerprint,
          userAgent: userAgent,
          attempts: attempts.count
        });

        return {
          locked: true,
          lockoutDuration: this.lockoutDuration,
          message: 'Account locked due to too many failed attempts'
        };
      }
    } else {
      // Clear failed attempts on successful login
      this.failedAttempts.delete(attemptKey);
    }

    return { locked: false };
  }

  // Database connection encryption
  encryptDatabaseConnection(connectionConfig) {
    // Implement database connection encryption
    const encryptedConfig = {
      ...connectionConfig,
      password: this.encryptField(connectionConfig.password),
      ssl: {
        rejectUnauthorized: true,
        cert: this.getDatabaseCert(),
        key: this.getDatabaseKey()
      }
    };

    return encryptedConfig;
  }

  // Field-level encryption for sensitive data
  encryptField(data, fieldKey = null) {
    const key = fieldKey || crypto.randomBytes(32);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      authTag: authTag.toString('hex'),
      key: fieldKey ? null : key.toString('hex')
    };
  }

  // Decrypt field
  decryptField(encryptedData, authTag, key) {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Security event logging
  logSecurityEvent(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType: eventType,
      details: details,
      severity: this.getEventSeverity(eventType)
    };

    this.auditLog.push(event);

    // Write to secure log file
    this.writeToSecureLog(event);

    // Alert for critical events
    if (event.severity === 'CRITICAL') {
      this.sendSecurityAlert(event);
    }
  }

  // Get event severity
  getEventSeverity(eventType) {
    const severityMap = {
      'BRUTE_FORCE_DETECTED': 'CRITICAL',
      'UNAUTHORIZED_ACCESS': 'HIGH',
      'SESSION_TIMEOUT': 'MEDIUM',
      'RATE_LIMIT_EXCEEDED': 'MEDIUM',
      'DATA_BREACH_ATTEMPT': 'CRITICAL',
      'SUSPICIOUS_ACTIVITY': 'HIGH'
    };

    return severityMap[eventType] || 'LOW';
  }

  // Write to secure log file
  async writeToSecureLog(event) {
    try {
      const logFile = './secure-logs/security-events.log';
      await fs.mkdir('./secure-logs', { recursive: true });
      
      const logEntry = JSON.stringify(event) + '\n';
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to secure log:', error);
    }
  }

  // Send security alert
  sendSecurityAlert(event) {
    // In production, integrate with security monitoring systems
    console.log('🚨 SECURITY ALERT:', {
      event: event.eventType,
      timestamp: event.timestamp,
      details: event.details
    });
  }

  // Session cleanup
  cleanupExpiredSessions() {
    const now = Date.now();
    
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      if (now - sessionData.lastActivity > this.sessionTimeout) {
        this.activeSessions.delete(sessionId);
        this.encryptionKeys.delete(sessionId);
        
        this.logSecurityEvent('SESSION_CLEANUP', {
          sessionId: sessionId,
          userId: sessionData.userId,
          expiredAt: new Date(now).toISOString()
        });
      }
    }
  }

  // Get security status
  getSecurityStatus() {
    return {
      activeSessions: this.activeSessions.size,
      failedAttempts: this.failedAttempts.size,
      encryptionKeys: this.encryptionKeys.size,
      auditLogEntries: this.auditLog.length,
      lastCleanup: new Date().toISOString()
    };
  }

  // Helper methods (simplified for demo)
  getStoredOTP(userId) { return null; }
  clearStoredOTP(userId) { return true; }
  getStoredBiometric(userId) { return null; }
  compareBiometricData(data1, data2) { return false; }
  getStoredHardwareKey(userId) { return null; }
  verifyHardwareKeySignature(data1, data2) { return false; }
  getDatabaseCert() { return ''; }
  getDatabaseKey() { return ''; }
}

module.exports = new SecurityHardening();
