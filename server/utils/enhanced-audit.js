const db = require("../db/database");
const crypto = require('crypto');
const fs = require('fs').promises;

class EnhancedAuditSystem {
  constructor() {
    this.auditQueue = [];
    this.complianceQueue = [];
    this.securityQueue = [];
    this.batchSize = 100;
    this.batchTimeout = 5000; // 5 seconds
    this.encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || 'audit-encryption-key-2024';
    this.complianceStandards = ['HIPAA', 'GDPR', 'SOX', 'PCI-DSS'];
    this.retentionPolicies = new Map();
    this.initializeRetentionPolicies();
  }

  // Initialize retention policies
  initializeRetentionPolicies() {
    this.retentionPolicies.set('HIPAA', {
      medicalRecords: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
      auditLogs: 6 * 365 * 24 * 60 * 60 * 1000,       // 6 years
      accessLogs: 6 * 365 * 24 * 60 * 60 * 1000,        // 6 years
      securityEvents: 6 * 365 * 24 * 60 * 60 * 1000     // 6 years
    });
    
    this.retentionPolicies.set('GDPR', {
      personalData: 7 * 365 * 24 * 60 * 60 * 1000,    // 7 years
      auditLogs: 7 * 365 * 24 * 60 * 60 * 1000,        // 7 years
      consentRecords: 7 * 365 * 24 * 60 * 60 * 1000,    // 7 years
      accessLogs: 2 * 365 * 24 * 60 * 60 * 1000        // 2 years
    });
  }

  // Enhanced audit logging with comprehensive tracking
  async logAudit(event) {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: event.userId || null,
      action: event.action,
      resourceType: event.resourceType || null,
      resourceId: event.resourceId || null,
      details: this.encryptSensitiveData(event.details),
      
      // Security context
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      deviceFingerprint: event.deviceFingerprint || null,
      sessionId: event.sessionId || null,
      trustScore: event.trustScore || null,
      verificationMethod: event.verificationMethod || null,
      
      // Data context
      oldValues: event.oldValues ? this.encryptSensitiveData(event.oldValues) : null,
      newValues: event.newValues ? this.encryptSensitiveData(event.newValues) : null,
      dataHash: this.generateDataHash(event),
      
      // Compliance context
      complianceEvent: event.complianceEvent || null,
      hipaaEventType: event.hipaaEventType || null,
      retentionRequired: event.retentionRequired !== false,
      
      // System context
      server: event.server || 'unknown',
      endpoint: event.endpoint || null,
      method: event.method || null,
      statusCode: event.statusCode || null,
      responseTime: event.responseTime || null,
      
      // Risk assessment
      riskLevel: this.assessRiskLevel(event),
      severity: this.assessSeverity(event),
      category: this.categorizeEvent(event),
      
      // Processing metadata
      processed: false,
      batchId: null,
      archived: false,
      retentionExpires: this.calculateRetentionExpiry(event)
    };

    // Add to appropriate queue
    if (event.complianceEvent || event.hipaaEventType) {
      this.complianceQueue.push(auditEntry);
    } else if (event.securityEvent || event.riskLevel === 'HIGH') {
      this.securityQueue.push(auditEntry);
    } else {
      this.auditQueue.push(auditEntry);
    }

    // Process batch if needed
    if (this.auditQueue.length >= this.batchSize) {
      await this.processAuditBatch();
    }

    return auditEntry.id;
  }

  // Process audit batch
  async processAuditBatch() {
    if (this.auditQueue.length === 0) return;

    const batch = this.auditQueue.splice(0, this.batchSize);
    const batchId = crypto.randomUUID();

    try {
      // Insert batch into database
      await this.insertAuditBatch(batch, batchId);
      
      // Write to secure log files
      await this.writeToSecureLogs(batch, batchId);
      
      // Update batch metadata
      batch.forEach(entry => {
        entry.batchId = batchId;
        entry.processed = true;
      });

      console.log(`✅ Processed audit batch ${batchId} with ${batch.length} entries`);
    } catch (error) {
      console.error('❌ Error processing audit batch:', error);
      // Re-queue failed entries
      this.auditQueue.unshift(...batch);
    }
  }

  // Insert audit batch into database
  async insertAuditBatch(batch, batchId) {
    return new Promise((resolve, reject) => {
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
      const values = batch.map(entry => [
        entry.id,
        entry.timestamp,
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.details,
        entry.ipAddress,
        entry.userAgent,
        entry.deviceFingerprint,
        entry.sessionId,
        entry.trustScore,
        entry.verificationMethod,
        entry.oldValues,
        entry.newValues,
        entry.dataHash,
        entry.complianceEvent,
        entry.hipaaEventType,
        entry.retentionRequired,
        entry.server,
        entry.endpoint,
        entry.method,
        entry.statusCode,
        entry.responseTime,
        entry.riskLevel,
        entry.severity,
        entry.category,
        entry.processed,
        entry.batchId,
        entry.archived,
        entry.retentionExpires
      ]);

      const query = `
        INSERT INTO AuditLogs (
          id, timestamp, user_id, action, resource_type, resource_id, details,
          ip_address, user_agent, device_fingerprint, session_id, trust_score,
          verification_method, old_values, new_values, data_hash, compliance_event,
          hipaa_event_type, retention_required, server, endpoint, method,
          status_code, response_time, risk_level, severity, category, processed,
          batch_id, archived, retention_expires
        ) VALUES ${placeholders}
      `;

      db.run(query, values.flat(), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Write to secure log files
  async writeToSecureLogs(batch, batchId) {
    try {
      const logDir = './secure-logs/audit';
      await fs.mkdir(logDir, { recursive: true });
      
      const logFile = `${logDir}/audit-batch-${batchId}.json`;
      const logData = {
        batchId: batchId,
        timestamp: new Date().toISOString(),
        count: batch.length,
        entries: batch
      };
      
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
      console.log(`✅ Audit batch ${batchId} written to secure log file`);
    } catch (error) {
      console.error('❌ Error writing to secure log file:', error);
    }
  }

  // HIPAA compliance logging
  async logHIPAAEvent(event) {
    const hipaaEvent = {
      ...event,
      complianceEvent: 'HIPAA',
      hipaaEventType: event.eventType || 'UNKNOWN',
      retentionRequired: true,
      category: 'HIPAA_COMPLIANCE'
    };

    return await this.logAudit(hipaaEvent);
  }

  // GDPR compliance logging
  async logGDPREvent(event) {
    const gdprEvent = {
      ...event,
      complianceEvent: 'GDPR',
      retentionRequired: true,
      category: 'GDPR_COMPLIANCE'
    };

    return await this.logAudit(gdprEvent);
  }

  // Security event logging
  async logSecurityEvent(event) {
    const securityEvent = {
      ...event,
      securityEvent: true,
      riskLevel: 'HIGH',
      category: 'SECURITY',
      severity: 'HIGH'
    };

    return await this.logAudit(securityEvent);
  }

  // Data access logging
  async logDataAccess(userId, action, resourceType, resourceId, context = {}) {
    const accessEvent = {
      userId: userId,
      action: action,
      resourceType: resourceType,
      resourceId: resourceId,
      details: context.details || null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
      sessionId: context.sessionId,
      trustScore: context.trustScore,
      verificationMethod: context.verificationMethod,
      oldValues: context.oldValues,
      newValues: context.newValues,
      category: 'DATA_ACCESS',
      riskLevel: this.assessDataAccessRisk(action, resourceType),
      severity: this.assessDataAccessSeverity(action, resourceType)
    };

    return await this.logAudit(accessEvent);
  }

  // System operation logging
  async logSystemOperation(operation, details, context = {}) {
    const systemEvent = {
      userId: context.userId || null,
      action: operation,
      resourceType: 'SYSTEM',
      resourceId: context.resourceId || null,
      details: details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      server: context.server || 'unknown',
      endpoint: context.endpoint,
      method: context.method,
      statusCode: context.statusCode,
      responseTime: context.responseTime,
      category: 'SYSTEM_OPERATION',
      riskLevel: 'LOW',
      severity: 'LOW'
    };

    return await this.logAudit(systemEvent);
  }

  // Encrypt sensitive data in audit logs
  encryptSensitiveData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'name', 'email', 'phone', 'address', 'ssn', 'diagnosis',
      'treatment', 'prescription', 'allergies', 'medical_history'
    ];

    const encrypted = { ...data };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encryptedValue = cipher.update(encrypted[field], 'utf8', 'hex');
        encryptedValue += cipher.final('hex');
        encrypted[field] = encryptedValue;
      }
    }

    return JSON.stringify(encrypted);
  }

  // Generate data hash for integrity verification
  generateDataHash(event) {
    const dataToHash = {
      userId: event.userId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      timestamp: event.timestamp
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }

  // Assess risk level
  assessRiskLevel(event) {
    const riskFactors = {
      highRiskActions: ['DELETE', 'DROP', 'TRUNCATE', 'EXPORT', 'DOWNLOAD'],
      highRiskResources: ['PATIENTS', 'RECORDS', 'USERS', 'SYSTEM'],
      highRiskCategories: ['SECURITY', 'HIPAA_COMPLIANCE', 'GDPR_COMPLIANCE'],
      highRiskRoles: ['Admin', 'Developer'],
      untrustedNetwork: !event.trustScore || event.trustScore < 50,
      unusualAccess: event.riskLevel === 'HIGH'
    };

    let riskScore = 0;

    // Action-based risk
    if (riskFactors.highRiskActions.includes(event.action)) {
      riskScore += 30;
    }

    // Resource-based risk
    if (riskFactors.highRiskResources.includes(event.resourceType)) {
      riskScore += 25;
    }

    // Category-based risk
    if (riskFactors.highRiskCategories.includes(event.category)) {
      riskScore += 20;
    }

    // Network-based risk
    if (riskFactors.untrustedNetwork) {
      riskScore += 15;
    }

    // Access pattern risk
    if (riskFactors.unusualAccess) {
      riskScore += 10;
    }

    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  }

  // Assess severity
  assessSeverity(event) {
    const severityMap = {
      'SECURITY': 'HIGH',
      'HIPAA_COMPLIANCE': 'HIGH',
      'GDPR_COMPLIANCE': 'HIGH',
      'DATA_ACCESS': 'MEDIUM',
      'SYSTEM_OPERATION': 'LOW',
      'AUTHENTICATION': 'MEDIUM',
      'AUTHORIZATION': 'MEDIUM'
    };

    return severityMap[event.category] || 'LOW';
  }

  // Categorize event
  categorizeEvent(event) {
    if (event.complianceEvent) {
      return `${event.complianceEvent}_COMPLIANCE`;
    }

    if (event.securityEvent) {
      return 'SECURITY';
    }

    if (event.action.includes('LOGIN') || event.action.includes('LOGOUT')) {
      return 'AUTHENTICATION';
    }

    if (event.action.includes('CREATE') || event.action.includes('UPDATE') || event.action.includes('DELETE')) {
      return 'AUTHORIZATION';
    }

    if (event.resourceType === 'SYSTEM') {
      return 'SYSTEM_OPERATION';
    }

    return 'DATA_ACCESS';
  }

  // Assess data access risk
  assessDataAccessRisk(action, resourceType) {
    const highRiskActions = ['DELETE', 'EXPORT', 'DOWNLOAD', 'VIEW_ALL'];
    const highRiskResources = ['PATIENTS', 'RECORDS', 'USERS'];

    if (highRiskActions.includes(action) && highRiskResources.includes(resourceType)) {
      return 'HIGH';
    }

    if (highRiskActions.includes(action) || highRiskResources.includes(resourceType)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  // Assess data access severity
  assessDataAccessSeverity(action, resourceType) {
    const severityMap = {
      'DELETE': 'HIGH',
      'EXPORT': 'HIGH',
      'DOWNLOAD': 'HIGH',
      'CREATE': 'MEDIUM',
      'UPDATE': 'MEDIUM',
      'VIEW': 'LOW'
    };

    return severityMap[action] || 'LOW';
  }

  // Calculate retention expiry
  calculateRetentionExpiry(event) {
    if (!event.retentionRequired) {
      return null;
    }

    let retentionPeriod = 2 * 365 * 24 * 60 * 60 * 1000; // Default 2 years

    // HIPAA retention
    if (event.complianceEvent === 'HIPAA') {
      const hipaaPolicy = this.retentionPolicies.get('HIPAA');
      if (hipaaPolicy[event.resourceType]) {
        retentionPeriod = hipaaPolicy[event.resourceType];
      }
    }

    // GDPR retention
    if (event.complianceEvent === 'GDPR') {
      const gdprPolicy = this.retentionPolicies.get('GDPR');
      if (gdprPolicy[event.resourceType]) {
        retentionPeriod = gdprPolicy[event.resourceType];
      }
    }

    return new Date(Date.now() + retentionPeriod).toISOString();
  }

  // Get audit trail for resource
  async getAuditTrail(resourceType, resourceId, limit = 100) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM AuditLogs 
        WHERE resource_type = ? AND resource_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `, [resourceType, resourceId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get user activity
  async getUserActivity(userId, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM AuditLogs 
        WHERE user_id = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
      `, [userId, startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get compliance report
  async getComplianceReport(standard, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          category,
          COUNT(*) as count,
          risk_level,
          severity,
          DATE(timestamp) as date
        FROM AuditLogs 
        WHERE compliance_event = ? AND timestamp BETWEEN ? AND ?
        GROUP BY category, risk_level, severity, DATE(timestamp)
        ORDER BY date DESC
      `, [standard, startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Cleanup expired audit logs
  async cleanupExpiredLogs() {
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM AuditLogs 
        WHERE retention_expires IS NOT NULL AND retention_expires < ?
      `, [now], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Start batch processing
  startBatchProcessing() {
    setInterval(() => {
      if (this.auditQueue.length > 0) {
        this.processAuditBatch();
      }
    }, this.batchTimeout);
  }

  // Get audit statistics
  async getAuditStatistics() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT resource_type) as resource_types,
          COUNT(DISTINCT category) as categories,
          COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_events,
          COUNT(CASE WHEN compliance_event IS NOT NULL THEN 1 END) as compliance_events,
          COUNT(CASE WHEN security_event = 1 THEN 1 END) as security_events
        FROM AuditLogs
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
  }
}

module.exports = new EnhancedAuditSystem();
