const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class ZeroTrustArchitecture {
  constructor() {
    this.trustPolicies = new Map();
    this.deviceTrust = new Map();
    this.userTrust = new Map();
    this.networkTrust = new Map();
    this.sessionTrust = new Map();
    this.minTrustScore = 70;
    this.jwtSecret = process.env.JWT_SECRET || 'zero-trust-secret-2024';
  }

  // Zero Trust: Never Trust, Always Verify
  async verifyRequest(req) {
    const verificationResults = {
      user: await this.verifyUser(req),
      device: await this.verifyDevice(req),
      network: await this.verifyNetwork(req),
      session: await this.verifySession(req),
      permissions: await this.verifyPermissions(req),
      behavior: await this.verifyBehavior(req)
    };

    const overallTrust = this.calculateOverallTrust(verificationResults);
    
    return {
      trusted: overallTrust >= this.minTrustScore,
      trustScore: overallTrust,
      verificationResults: verificationResults,
      recommendations: this.getSecurityRecommendations(verificationResults)
    };
  }

  // Verify user identity with multiple factors
  async verifyUser(req) {
    const userId = req.user?.id;
    if (!userId) {
      return { verified: false, reason: 'No user identity' };
    }

    const userTrustData = this.userTrust.get(userId) || {
      mfaEnabled: false,
      biometricEnabled: false,
      hardwareKeyEnabled: false,
      lastVerification: 0,
      verificationScore: 0
    };

    // Check if MFA verification is recent
    const mfaValid = Date.now() - userTrustData.lastVerification < (15 * 60 * 1000); // 15 minutes
    
    let verificationScore = 50; // Base score for authenticated user
    
    if (userTrustData.mfaEnabled && mfaValid) {
      verificationScore += 25;
    }
    
    if (userTrustData.biometricEnabled) {
      verificationScore += 15;
    }
    
    if (userTrustData.hardwareKeyEnabled) {
      verificationScore += 10;
    }

    return {
      verified: verificationScore >= 70,
      score: verificationScore,
      mfaEnabled: userTrustData.mfaEnabled,
      mfaValid: mfaValid,
      biometricEnabled: userTrustData.biometricEnabled,
      hardwareKeyEnabled: userTrustData.hardwareKeyEnabled
    };
  }

  // Verify device trust
  async verifyDevice(req) {
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    const userId = req.user?.id;
    
    if (!userId) {
      return { verified: false, reason: 'No user context' };
    }

    const deviceKey = `${userId}-${deviceFingerprint}`;
    const deviceData = this.deviceTrust.get(deviceKey) || {
      firstSeen: Date.now(),
      lastSeen: 0,
      trustScore: 0,
      securityPosture: 'unknown',
      compromised: false
    };

    // Check if device is compromised
    if (deviceData.compromised) {
      return { verified: false, reason: 'Device compromised' };
    }

    // Update last seen
    deviceData.lastSeen = Date.now();

    // Calculate device trust score
    let trustScore = 30; // Base score for unknown device

    if (Date.now() - deviceData.firstSeen > (30 * 24 * 60 * 60 * 1000)) { // 30 days
      trustScore += 20; // Established device
    }

    if (deviceData.securityPosture === 'secure') {
      trustScore += 30;
    } else if (deviceData.securityPosture === 'warning') {
      trustScore += 10;
    }

    // Check device security posture
    const securityCheck = await this.checkDeviceSecurity(req);
    deviceData.securityPosture = securityCheck.posture;
    trustScore += securityCheck.score;

    this.deviceTrust.set(deviceKey, deviceData);

    return {
      verified: trustScore >= 60,
      score: trustScore,
      deviceFingerprint: deviceFingerprint,
      securityPosture: deviceData.securityPosture,
      firstSeen: deviceData.firstSeen,
      established: Date.now() - deviceData.firstSeen > (30 * 24 * 60 * 60 * 1000)
    };
  }

  // Verify network trust
  async verifyNetwork(req) {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    const networkData = this.networkTrust.get(ip) || {
      firstSeen: Date.now(),
      lastSeen: 0,
      trustScore: 0,
      reputation: 'unknown',
      geolocation: null,
      vpnDetected: false
    };

    // Check network reputation
    const reputationCheck = await this.checkNetworkReputation(ip);
    networkData.reputation = reputationCheck.reputation;
    networkData.vpnDetected = reputationCheck.vpnDetected;

    // Calculate network trust score
    let trustScore = 20; // Base score for unknown network

    if (reputationCheck.reputation === 'trusted') {
      trustScore += 40;
    } else if (reputationCheck.reputation === 'suspicious') {
      trustScore -= 20;
    } else if (reputationCheck.reputation === 'malicious') {
      trustScore -= 40;
    }

    if (networkData.vpnDetected) {
      trustScore -= 10; // VPN reduces trust score
    }

    // Check if network is in trusted range
    if (this.isTrustedNetwork(ip)) {
      trustScore += 30;
    }

    networkData.lastSeen = Date.now();
    this.networkTrust.set(ip, networkData);

    return {
      verified: trustScore >= 50,
      score: trustScore,
      reputation: networkData.reputation,
      vpnDetected: networkData.vpnDetected,
      trustedNetwork: this.isTrustedNetwork(ip)
    };
  }

  // Verify session integrity
  async verifySession(req) {
    const sessionId = req.session?.id;
    const userId = req.user?.id;
    
    if (!sessionId || !userId) {
      return { verified: false, reason: 'No valid session' };
    }

    const sessionData = this.sessionTrust.get(sessionId) || {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      trustScore: 0,
      anomalies: [],
      ipAddress: req.ip,
      deviceFingerprint: this.generateDeviceFingerprint(req)
    };

    // Check for session anomalies
    const anomalies = this.detectSessionAnomalies(req, sessionData);
    sessionData.anomalies = anomalies;

    // Calculate session trust score
    let trustScore = 40; // Base score for valid session

    // Check session age
    const sessionAge = Date.now() - sessionData.createdAt;
    if (sessionAge > (8 * 60 * 60 * 1000)) { // 8 hours
      trustScore -= 20; // Long sessions are less trusted
    }

    // Check for IP changes
    if (sessionData.ipAddress !== req.ip) {
      trustScore -= 30;
      anomalies.push({
        type: 'IP_CHANGE',
        severity: 'HIGH',
        description: 'Session IP address changed'
      });
    }

    // Check for device changes
    const currentFingerprint = this.generateDeviceFingerprint(req);
    if (sessionData.deviceFingerprint !== currentFingerprint) {
      trustScore -= 20;
      anomalies.push({
        type: 'DEVICE_CHANGE',
        severity: 'MEDIUM',
        description: 'Session device fingerprint changed'
      });
    }

    // Check for rapid activity
    const activityGap = Date.now() - sessionData.lastActivity;
    if (activityGap < 1000) { // Less than 1 second
      trustScore -= 10;
      anomalies.push({
        type: 'RAPID_ACTIVITY',
        severity: 'LOW',
        description: 'Rapid session activity detected'
      });
    }

    sessionData.lastActivity = Date.now();
    sessionData.trustScore = trustScore;
    this.sessionTrust.set(sessionId, sessionData);

    return {
      verified: trustScore >= 60,
      score: trustScore,
      sessionAge: sessionAge,
      anomalies: anomalies,
      ipChanged: sessionData.ipAddress !== req.ip,
      deviceChanged: sessionData.deviceFingerprint !== currentFingerprint
    };
  }

  // Verify permissions based on context
  async verifyPermissions(req) {
    const userId = req.user?.id;
    const role = req.user?.role;
    const endpoint = req.path;
    const method = req.method;
    
    if (!userId || !role) {
      return { verified: false, reason: 'No user context' };
    }

    // Check role-based permissions
    const hasPermission = this.checkRolePermission(role, endpoint, method);
    
    // Check contextual permissions
    const contextualCheck = this.checkContextualPermissions(req);
    
    // Check time-based restrictions
    const timeRestriction = this.checkTimeRestrictions(role, req);

    let permissionScore = 50; // Base score
    
    if (hasPermission) {
      permissionScore += 30;
    }
    
    if (contextualCheck.allowed) {
      permissionScore += 20;
    }
    
    if (timeRestriction.allowed) {
      permissionScore += 10;
    }

    return {
      verified: permissionScore >= 70,
      score: permissionScore,
      hasPermission: hasPermission,
      contextualAllowed: contextualCheck.allowed,
      timeAllowed: timeRestriction.allowed,
      restrictions: {
        contextual: contextualCheck.reason,
        time: timeRestriction.reason
      }
    };
  }

  // Verify behavior patterns
  async verifyBehavior(req) {
    const userId = req.user?.id;
    const ip = req.ip;
    const endpoint = req.path;
    const timestamp = Date.now();
    
    if (!userId) {
      return { verified: false, reason: 'No user context' };
    }

    // Track user behavior patterns
    const behaviorKey = `${userId}-${ip}`;
    const behaviorData = this.userTrust.get(behaviorKey) || {
      endpoints: new Map(),
      requestTimes: [],
      unusualPatterns: [],
      baselineEstablished: false
    };

    // Track endpoint access
    const endpointCount = behaviorData.endpoints.get(endpoint) || 0;
    behaviorData.endpoints.set(endpoint, endpointCount + 1);

    // Track request timing
    behaviorData.requestTimes.push(timestamp);
    
    // Keep only last hour of requests
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    behaviorData.requestTimes = behaviorData.requestTimes.filter(t => t > oneHourAgo);

    // Detect behavioral anomalies
    const anomalies = this.detectBehaviorAnomalies(behaviorData, req);
    
    let behaviorScore = 60; // Base score
    
    if (anomalies.length === 0) {
      behaviorScore += 20;
    } else {
      behaviorScore -= anomalies.length * 10;
    }

    // Check if baseline is established
    if (behaviorData.requestTimes.length > 50) {
      behaviorData.baselineEstablished = true;
      behaviorScore += 10;
    }

    this.userTrust.set(behaviorKey, behaviorData);

    return {
      verified: behaviorScore >= 50,
      score: behaviorScore,
      anomalies: anomalies,
      baselineEstablished: behaviorData.baselineEstablished,
      requestFrequency: behaviorData.requestTimes.length
    };
  }

  // Calculate overall trust score
  calculateOverallTrust(verificationResults) {
    const weights = {
      user: 0.25,
      device: 0.20,
      network: 0.15,
      session: 0.20,
      permissions: 0.15,
      behavior: 0.05
    };

    let overallScore = 0;
    
    for (const [component, result] of Object.entries(verificationResults)) {
      const weight = weights[component] || 0;
      const score = result.score || 0;
      overallScore += score * weight;
    }

    return Math.round(overallScore);
  }

  // Get security recommendations
  getSecurityRecommendations(verificationResults) {
    const recommendations = [];

    if (!verificationResults.user.verified) {
      recommendations.push({
        priority: 'HIGH',
        type: 'USER_VERIFICATION',
        message: 'Enable multi-factor authentication for enhanced security'
      });
    }

    if (!verificationResults.device.verified) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'DEVICE_SECURITY',
        message: 'Ensure device security software is up to date'
      });
    }

    if (!verificationResults.network.verified) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'NETWORK_SECURITY',
        message: 'Use trusted network connections for accessing sensitive data'
      });
    }

    if (!verificationResults.session.verified) {
      recommendations.push({
        priority: 'HIGH',
        type: 'SESSION_SECURITY',
        message: 'Session integrity compromised, please re-authenticate'
      });
    }

    if (!verificationResults.permissions.verified) {
      recommendations.push({
        priority: 'HIGH',
        type: 'PERMISSION_SECURITY',
        message: 'Insufficient permissions for requested operation'
      });
    }

    if (!verificationResults.behavior.verified) {
      recommendations.push({
        priority: 'LOW',
        type: 'BEHAVIOR_ANALYSIS',
        message: 'Unusual activity pattern detected, please verify your identity'
      });
    }

    return recommendations;
  }

  // Helper methods
  generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    return crypto.createHash('sha256')
      .update(`${userAgent}-${acceptLanguage}-${acceptEncoding}`)
      .digest('hex');
  }

  async checkDeviceSecurity(req) {
    // In production, implement actual device security checks
    return {
      posture: 'secure',
      score: 20
    };
  }

  async checkNetworkReputation(ip) {
    // In production, integrate with threat intelligence feeds
    return {
      reputation: 'unknown',
      vpnDetected: false
    };
  }

  isTrustedNetwork(ip) {
    // In production, configure trusted network ranges
    const trustedRanges = [
      '127.0.0.1',
      '192.168.',
      '10.'
    ];

    return trustedRanges.some(range => ip.startsWith(range));
  }

  detectSessionAnomalies(req, sessionData) {
    return sessionData.anomalies || [];
  }

  checkRolePermission(role, endpoint, method) {
    const permissions = {
      'Doctor': ['/api/medical', '/api/patients'],
      'Hospital Reception': ['/api/reception', '/api/patients'],
      'Admin': ['/api/admin', '/api/sip'],
      'Team Lead': ['/api/sip/tl'],
      'Analyst': ['/api/sip/analyst'],
      'Production': ['/api/sip/main']
    };

    const userPermissions = permissions[role] || [];
    return userPermissions.some(perm => endpoint.startsWith(perm));
  }

  checkContextualPermissions(req) {
    // Implement contextual permission checks
    return {
      allowed: true,
      reason: null
    };
  }

  checkTimeRestrictions(role, req) {
    // Implement time-based restrictions
    const currentHour = new Date().getHours();
    
    // Restrict certain roles during off-hours
    if (role === 'Analyst' && (currentHour < 9 || currentHour > 17)) {
      return {
        allowed: false,
        reason: 'Access restricted to business hours (9 AM - 5 PM)'
      };
    }

    return {
      allowed: true,
      reason: null
    };
  }

  detectBehaviorAnomalies(behaviorData, req) {
    const anomalies = [];
    
    // Check for unusual endpoint access
    const endpointCounts = Array.from(behaviorData.endpoints.values());
    const avgAccess = endpointCounts.reduce((a, b) => a + b, 0) / endpointCounts.length;
    
    for (const [endpoint, count] of behaviorData.endpoints.entries()) {
      if (count > avgAccess * 3) {
        anomalies.push({
          type: 'UNUSUAL_ENDPOINT_ACCESS',
          severity: 'MEDIUM',
          description: `Unusual access frequency to ${endpoint}`,
          count: count,
          average: avgAccess
        });
      }
    }

    return anomalies;
  }

  // Generate zero-trust token
  generateZeroTrustToken(userId, verificationResults) {
    const payload = {
      userId: userId,
      trustScore: this.calculateOverallTrust(verificationResults),
      verificationResults: verificationResults,
      timestamp: Date.now(),
      expires: Date.now() + (15 * 60 * 1000) // 15 minutes
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  // Verify zero-trust token
  verifyZeroTrustToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new ZeroTrustArchitecture();
