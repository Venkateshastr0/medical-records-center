const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../utils/audit');
const securityHardening = require('../../utils/security-hardening');
const intrusionDetection = require('../../utils/intrusion-detection');
const zeroTrust = require('../../utils/zero-trust-architecture');

// Enhanced login with security monitoring
router.post('/login', async (req, res) => {
  try {
    const { username, password, mfaCode, biometricData, hardwareKey } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Track login attempts for intrusion detection
    const suspiciousActivity = intrusionDetection.detectSuspiciousLogin(req, false);
    
    if (suspiciousActivity.suspicious) {
      await logAudit(null, 'SUSPICIOUS_LOGIN_ATTEMPT', null, 
        `Suspicious login detected: ${JSON.stringify(suspiciousActivity.anomalies)}`);
      
      return res.status(403).json({
        success: false,
        message: 'Suspicious activity detected. Access denied.',
        riskScore: suspiciousActivity.riskScore,
        anomalies: suspiciousActivity.anomalies
      });
    }
    
    // Get user from database
    const db = require('../db/database');
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM Users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      intrusionDetection.detectSuspiciousLogin(req, false);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      intrusionDetection.detectSuspiciousLogin(req, false);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify MFA if enabled
    if (user.mfa_enabled && mfaCode) {
      const mfaValid = securityHardening.verifyMFA(user.user_id, mfaCode);
      if (!mfaValid.valid) {
        return res.status(401).json({
          success: false,
          message: mfaValid.message
        });
      }
    }
    
    // Verify biometric if provided
    if (biometricData) {
      const biometricValid = securityHardening.verifyBiometric(user.user_id, biometricData);
      if (!biometricValid.valid) {
        return res.status(401).json({
          success: false,
          message: 'Biometric verification failed'
        });
      }
    }
    
    // Verify hardware key if provided
    if (hardwareKey) {
      const hardwareValid = securityHardening.verifyHardwareKey(user.user_id, hardwareKey);
      if (!hardwareValid.valid) {
        return res.status(401).json({
          success: false,
          message: 'Hardware key verification failed'
        });
      }
    }
    
    // Track successful login
    intrusionDetection.detectSuspiciousLogin(req, true);
    
    // Generate zero-trust token
    const zeroTrustVerification = await zeroTrust.verifyRequest(req);
    const token = zeroTrust.generateZeroTrustToken(user.user_id, zeroTrustVerification.verificationResults);
    
    // Create secure session
    const sessionId = securityHardening.generateSessionKey(user.user_id, crypto.randomUUID());
    
    await logAudit(user.user_id, 'LOGIN_SUCCESS', null, `User ${username} logged in successfully`);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      sessionId: sessionId,
      user: {
        id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        organization: user.organization
      },
      trustScore: zeroTrustVerification.trustScore,
      security: {
        mfaVerified: user.mfa_enabled,
        biometricVerified: !!biometricData,
        hardwareKeyVerified: !!hardwareKey
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout with session cleanup
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Cleanup session
    if (sessionId) {
      securityHardening.activeSessions.delete(sessionId);
      securityHardening.encryptionKeys.delete(sessionId);
    }
    
    await logAudit(null, 'LOGOUT', null, 'User logged out');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
