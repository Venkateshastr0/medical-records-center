const crypto = require('crypto');
const fs = require('fs').promises;

class IntrusionDetectionSystem {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.blockedIPs = new Map();
    this.anomalyThreshold = 5;
    this.securityEvents = [];
    this.realTimeAlerts = [];
  }

  // Detect suspicious login patterns
  detectSuspiciousLogin(req, success) {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const timestamp = Date.now();
    
    // Track login attempts per IP
    const ipAttempts = this.suspiciousPatterns.get(ip) || {
      count: 0,
      failedAttempts: 0,
      lastAttempt: 0,
      userAgents: new Set(),
      timeWindow: []
    };

    ipAttempts.count++;
    ipAttempts.lastAttempt = timestamp;
    ipAttempts.userAgents.add(userAgent);
    ipAttempts.timeWindow.push(timestamp);

    // Keep only last hour of attempts
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    ipAttempts.timeWindow = ipAttempts.timeWindow.filter(t => t > oneHourAgo);

    if (!success) {
      ipAttempts.failedAttempts++;
    }

    // Detect anomalies
    const anomalies = this.detectAnomalies(ip, ipAttempts, req);
    
    this.suspiciousPatterns.set(ip, ipAttempts);

    if (anomalies.length > 0) {
      this.handleSuspiciousActivity(ip, anomalies, req);
    }

    return {
      suspicious: anomalies.length > 0,
      anomalies: anomalies,
      riskScore: this.calculateRiskScore(ipAttempts)
    };
  }

  // Detect various anomalies
  detectAnomalies(ip, attempts, req) {
    const anomalies = [];
    const now = Date.now();

    // 1. High frequency attempts
    if (attempts.timeWindow.length > 10) {
      anomalies.push({
        type: 'HIGH_FREQUENCY_ATTEMPTS',
        severity: 'HIGH',
        description: 'More than 10 login attempts in 1 hour',
        count: attempts.timeWindow.length
      });
    }

    // 2. Multiple user agents (possible automation)
    if (attempts.userAgents.size > 3) {
      anomalies.push({
        type: 'MULTIPLE_USER_AGENTS',
        severity: 'MEDIUM',
        description: 'Multiple user agents from same IP',
        userAgents: Array.from(attempts.userAgents)
      });
    }

    // 3. High failure rate
    const failureRate = attempts.failedAttempts / attempts.count;
    if (failureRate > 0.7 && attempts.count > 5) {
      anomalies.push({
        type: 'HIGH_FAILURE_RATE',
        severity: 'HIGH',
        description: 'High login failure rate',
        failureRate: (failureRate * 100).toFixed(2) + '%'
      });
    }

    // 4. Unusual timing patterns
    const timeGaps = this.calculateTimeGaps(attempts.timeWindow);
    if (timeGaps.some(gap => gap < 1000)) { // Less than 1 second
      anomalies.push({
        type: 'RAPID_SUCCESSIVE_ATTEMPTS',
        severity: 'HIGH',
        description: 'Rapid successive login attempts (automation suspected)',
        minGap: Math.min(...timeGaps) + 'ms'
      });
    }

    // 5. Geographic anomalies (if location data available)
    const geoAnomaly = this.detectGeographicAnomaly(ip, req);
    if (geoAnomaly) {
      anomalies.push(geoAnomaly);
    }

    // 6. Device fingerprint anomalies
    const deviceAnomaly = this.detectDeviceAnomaly(req);
    if (deviceAnomaly) {
      anomalies.push(deviceAnomaly);
    }

    return anomalies;
  }

  // Calculate risk score
  calculateRiskScore(attempts) {
    let score = 0;
    
    // Base score from attempt count
    score += Math.min(attempts.count * 2, 20);
    
    // Failure rate penalty
    const failureRate = attempts.failedAttempts / attempts.count;
    score += failureRate * 30;
    
    // Multiple user agents penalty
    score += (attempts.userAgents.size - 1) * 10;
    
    // Time frequency penalty
    const recentAttempts = attempts.timeWindow.filter(t => Date.now() - t < 300000).length; // Last 5 minutes
    score += recentAttempts * 5;
    
    return Math.min(score, 100);
  }

  // Handle suspicious activity
  handleSuspiciousActivity(ip, anomalies, req) {
    const riskScore = this.calculateRiskScore(this.suspiciousPatterns.get(ip));
    
    // Log security event
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: 'SUSPICIOUS_ACTIVITY',
      ip: ip,
      userAgent: req.get('User-Agent'),
      anomalies: anomalies,
      riskScore: riskScore,
      endpoint: req.path,
      method: req.method
    };

    this.securityEvents.push(securityEvent);
    this.writeSecurityLog(securityEvent);

    // Take action based on risk score
    if (riskScore >= 80) {
      this.blockIP(ip, 'HIGH_RISK_DETECTED', 24 * 60 * 60 * 1000); // 24 hours
      this.sendCriticalAlert(securityEvent);
    } else if (riskScore >= 60) {
      this.blockIP(ip, 'MEDIUM_RISK_DETECTED', 60 * 60 * 1000); // 1 hour
      this.sendWarningAlert(securityEvent);
    } else {
      this.sendInfoAlert(securityEvent);
    }
  }

  // Block IP address
  blockIP(ip, reason, duration) {
    const blockedUntil = Date.now() + duration;
    
    this.blockedIPs.set(ip, {
      blockedAt: Date.now(),
      blockedUntil: blockedUntil,
      reason: reason,
      duration: duration
    });

    const event = {
      timestamp: new Date().toISOString(),
      type: 'IP_BLOCKED',
      ip: ip,
      reason: reason,
      blockedUntil: new Date(blockedUntil).toISOString()
    };

    this.securityEvents.push(event);
    this.writeSecurityLog(event);
  }

  // Check if IP is blocked
  isIPBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;

    if (Date.now() > blockInfo.blockedUntil) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  // Detect database access anomalies
  detectDatabaseAnomalies(query, userId, ip) {
    const anomalies = [];
    
    // 1. Unusual query patterns
    if (this.isSuspiciousQuery(query)) {
      anomalies.push({
        type: 'SUSPICIOUS_QUERY',
        severity: 'HIGH',
        description: 'Potentially malicious database query detected',
        query: this.sanitizeQuery(query)
      });
    }

    // 2. High volume data access
    if (this.isHighVolumeAccess(query)) {
      anomalies.push({
        type: 'HIGH_VOLUME_ACCESS',
        severity: 'MEDIUM',
        description: 'High volume data access detected'
      });
    }

    // 3. Unusual access patterns
    const accessPattern = this.getAccessPattern(userId);
    if (this.isUnusualAccessPattern(query, accessPattern)) {
      anomalies.push({
        type: 'UNUSUAL_ACCESS_PATTERN',
        severity: 'MEDIUM',
        description: 'Unusual data access pattern for user'
      });
    }

    return anomalies;
  }

  // Detect file system access anomalies
  detectFileSystemAnomalies(filePath, action, userId) {
    const anomalies = [];
    
    // 1. Sensitive file access
    if (this.isSensitiveFile(filePath)) {
      anomalies.push({
        type: 'SENSITIVE_FILE_ACCESS',
        severity: 'HIGH',
        description: 'Access to sensitive file detected',
        file: filePath,
        action: action
      });
    }

    // 2. Unusual file operations
    if (this.isUnusualFileOperation(filePath, action, userId)) {
      anomalies.push({
        type: 'UNUSUAL_FILE_OPERATION',
        severity: 'MEDIUM',
        description: 'Unusual file operation detected',
        file: filePath,
        action: action
      });
    }

    return anomalies;
  }

  // Real-time monitoring middleware
  realTimeMonitoring(req, res, next) {
    const ip = req.ip;
    
    // Check if IP is blocked
    if (this.isIPBlocked(ip)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. IP address is blocked due to suspicious activity.',
        blockedUntil: this.blockedIPs.get(ip).blockedUntil
      });
    }

    // Monitor request patterns
    this.monitorRequest(req);

    // Continue processing
    next();
  }

  // Monitor individual requests
  monitorRequest(req) {
    const ip = req.ip;
    const endpoint = req.path;
    const method = req.method;
    const timestamp = Date.now();

    // Track request patterns
    const patternKey = `${ip}-${endpoint}`;
    const pattern = this.suspiciousPatterns.get(patternKey) || {
      requests: [],
      lastAccess: 0
    };

    pattern.requests.push(timestamp);
    pattern.lastAccess = timestamp;

    // Keep only last hour of requests
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    pattern.requests = pattern.requests.filter(t => t > oneHourAgo);

    // Detect request anomalies
    if (pattern.requests.length > 100) {
      this.handleSuspiciousActivity(ip, [{
        type: 'HIGH_REQUEST_FREQUENCY',
        severity: 'MEDIUM',
        description: 'High request frequency detected',
        count: pattern.requests.length,
        endpoint: endpoint
      }], req);
    }

    this.suspiciousPatterns.set(patternKey, pattern);
  }

  // Helper methods
  calculateTimeGaps(timestamps) {
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i-1]);
    }
    return gaps;
  }

  detectGeographicAnomaly(ip, req) {
    // In production, integrate with IP geolocation services
    return null;
  }

  detectDeviceAnomaly(req) {
    const fingerprint = this.generateDeviceFingerprint(req);
    // Track device fingerprints and detect anomalies
    return null;
  }

  generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    return crypto.createHash('sha256')
      .update(`${userAgent}-${acceptLanguage}-${acceptEncoding}`)
      .digest('hex');
  }

  isSuspiciousQuery(query) {
    const suspiciousPatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /truncate\s+table/i,
      /exec\s*\(/i,
      /union\s+select/i,
      /insert\s+into/i,
      /update\s+set/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(query));
  }

  isHighVolumeAccess(query) {
    // Check for SELECT * or large LIMIT clauses
    return /select\s+\*/i.test(query) && /limit\s+\d+/i.test(query);
  }

  isSensitiveFile(filePath) {
    const sensitivePaths = [
      '/etc/passwd',
      '/etc/shadow',
      './database/',
      './config/',
      './private/',
      './secure-logs/'
    ];

    return sensitivePaths.some(path => filePath.includes(path));
  }

  isUnusualFileOperation(filePath, action, userId) {
    // Track normal file access patterns per user
    return false; // Simplified for demo
  }

  sanitizeQuery(query) {
    return query.replace(/[^\s\w\*\-\+\=\(\)\[\],\.]/g, '*');
  }

  getAccessPattern(userId) {
    // Return user's normal access pattern
    return {};
  }

  isUnusualAccessPattern(query, pattern) {
    return false; // Simplified for demo
  }

  async writeSecurityLog(event) {
    try {
      const logFile = './secure-logs/intrusion-events.log';
      await fs.mkdir('./secure-logs', { recursive: true });
      
      const logEntry = JSON.stringify(event) + '\n';
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write intrusion log:', error);
    }
  }

  sendCriticalAlert(event) {
    console.log('🚨 CRITICAL SECURITY ALERT:', event);
  }

  sendWarningAlert(event) {
    console.log('⚠️ SECURITY WARNING:', event);
  }

  sendInfoAlert(event) {
    console.log('ℹ️ SECURITY INFO:', event);
  }

  // Get security dashboard data
  getSecurityDashboard() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousPatterns: this.suspiciousPatterns.size,
      securityEvents: this.securityEvents.length,
      recentEvents: this.securityEvents.slice(-10),
      highRiskIPs: this.getHighRiskIPs()
    };
  }

  getHighRiskIPs() {
    const highRiskIPs = [];
    
    for (const [ip, attempts] of this.suspiciousPatterns.entries()) {
      const riskScore = this.calculateRiskScore(attempts);
      if (riskScore >= 60) {
        highRiskIPs.push({
          ip: ip,
          riskScore: riskScore,
          attempts: attempts.count,
          failures: attempts.failedAttempts,
          lastActivity: new Date(attempts.lastAttempt).toISOString()
        });
      }
    }

    return highRiskIPs.sort((a, b) => b.riskScore - a.riskScore);
  }
}

module.exports = new IntrusionDetectionSystem();
