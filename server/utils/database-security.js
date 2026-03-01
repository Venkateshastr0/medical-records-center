const crypto = require('crypto');
const fs = require('fs').promises;

class DatabaseSecurity {
  constructor() {
    this.encryptionKeys = new Map();
    this.fieldEncryptionMap = new Map();
    this.queryAuditLog = [];
    this.accessPatterns = new Map();
    this.encryptionKeyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  // Initialize field-level encryption mapping
  initializeFieldEncryption() {
    this.fieldEncryptionMap.set('Patients.name', 'HIGH');
    this.fieldEncryptionMap.set('Patients.phone', 'HIGH');
    this.fieldEncryptionMap.set('Patients.email', 'HIGH');
    this.fieldEncryptionMap.set('Patients.address', 'HIGH');
    this.fieldEncryptionMap.set('Patients.medical_history', 'HIGH');
    this.fieldEncryptionMap.set('Patients.allergies', 'HIGH');
    this.fieldEncryptionMap.set('Patients.emergency_contact', 'HIGH');
    this.fieldEncryptionMap.set('Records.diagnosis', 'HIGH');
    this.fieldEncryptionMap.set('Records.treatment', 'HIGH');
    this.fieldEncryptionMap.set('Records.prescription', 'HIGH');
    this.fieldEncryptionMap.set('Records.notes', 'HIGH');
    this.fieldEncryptionMap.set('Users.email', 'MEDIUM');
    this.fieldEncryptionMap.set('Users.phone', 'MEDIUM');
  }

  // Generate encryption key for field
  generateFieldKey(tableName, fieldName, userId) {
    const keyMaterial = `${tableName}-${fieldName}-${userId}-${Date.now()}`;
    const key = crypto.scryptSync(keyMaterial, 'database-salt', 32);
    
    const keyId = crypto.createHash('sha256')
      .update(keyMaterial)
      .digest('hex');
    
    this.encryptionKeys.set(keyId, key);
    
    return {
      keyId: keyId,
      key: key.toString('hex')
    };
  }

  // Encrypt field value
  encryptField(tableName, fieldName, value, userId) {
    const sensitivity = this.fieldEncryptionMap.get(`${tableName}.${fieldName}`) || 'LOW';
    
    if (sensitivity === 'LOW') {
      return {
        encrypted: false,
        value: value
      };
    }

    const { keyId, key } = this.generateFieldKey(tableName, fieldName, userId);
    
    const cipher = crypto.createCipher('aes-256-gcm', key);
    let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: true,
      keyId: keyId,
      encrypted: encrypted,
      authTag: authTag.toString('hex'),
      sensitivity: sensitivity
    };
  }

  // Decrypt field value
  decryptField(encryptedData, keyId) {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error('Encryption key not found');
    }

    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Secure database query with audit logging
  async secureQuery(db, query, params, userId, ip) {
    const queryId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Log query attempt
    this.logQueryAttempt({
      queryId: queryId,
      userId: userId,
      ip: ip,
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      timestamp: new Date().toISOString()
    });

    // Validate query for security
    const validation = this.validateQuery(query, params, userId);
    if (!validation.valid) {
      this.logSecurityViolation({
        queryId: queryId,
        userId: userId,
        ip: ip,
        violation: validation.reason,
        query: this.sanitizeQuery(query)
      });
      
      throw new Error(`Query validation failed: ${validation.reason}`);
    }

    // Execute query with monitoring
    try {
      const result = await this.executeMonitoredQuery(db, query, params, userId, queryId);
      
      const executionTime = Date.now() - startTime;
      
      // Log successful query
      this.logQuerySuccess({
        queryId: queryId,
        userId: userId,
        ip: ip,
        executionTime: executionTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log query failure
      this.logQueryFailure({
        queryId: queryId,
        userId: userId,
        ip: ip,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  // Validate query for security violations
  validateQuery(query, params, userId) {
    const suspiciousPatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /truncate\s+table/i,
      /exec\s*\(/i,
      /union\s+select/i,
      /insert\s+into/i,
      /update\s+set/i,
      /create\s+table/i,
      /alter\s+table/i
    ];

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        return {
          valid: false,
          reason: `Suspicious SQL pattern detected: ${pattern.source}`
        };
      }
    }

    // Check for data exfiltration patterns
    const exfiltrationPatterns = [
      /select\s+\*.*from.*patients/i,
      /select.*password/i,
      /select.*secret/i,
      /select.*key/i
    ];

    for (const pattern of exfiltrationPatterns) {
      if (pattern.test(query)) {
        return {
          valid: false,
          reason: `Potential data exfiltration pattern detected`
        };
      }
    }

    // Check query complexity
    const complexity = this.analyzeQueryComplexity(query);
    if (complexity.score > 80) {
      return {
        valid: false,
        reason: `Query complexity too high: ${complexity.score}`
      };
    }

    // Check access patterns
    const accessPattern = this.analyzeAccessPattern(query, userId);
    if (accessPattern.unusual) {
      return {
        valid: false,
        reason: `Unusual access pattern detected`
      };
    }

    return {
      valid: true,
      complexity: complexity,
      accessPattern: accessPattern
    };
  }

  // Analyze query complexity
  analyzeQueryComplexity(query) {
    let score = 0;
    
    // Count JOIN operations
    const joins = (query.match(/join/gi) || []).length;
    score += joins * 10;
    
    // Count subqueries
    const subqueries = (query.match(/\(.*select.*\)/gi) || []).length;
    score += subqueries * 15;
    
    // Count aggregate functions
    const aggregates = (query.match(/(count|sum|avg|max|min)\s*\(/gi) || []).length;
    score += aggregates * 5;
    
    // Check query length
    score += Math.min(query.length / 100, 20);

    return {
      score: Math.min(score, 100),
      joins: joins,
      subqueries: subqueries,
      aggregates: aggregates,
      length: query.length
    };
  }

  // Analyze access patterns
  analyzeAccessPattern(query, userId) {
    const patternKey = `${userId}-${new Date().getHours()}`;
    const pattern = this.accessPatterns.get(patternKey) || {
      queries: [],
      tables: new Set(),
      operations: new Set(),
      lastReset: Date.now()
    };

    // Extract table names
    const tableMatches = query.match(/from\s+(\w+)|join\s+(\w+)/gi) || [];
    const tables = tableMatches.map(match => match.split(/\s+/)[1]);
    
    // Extract operations
    const operation = query.trim().split(/\s+/)[0].toLowerCase();
    
    pattern.queries.push({
      query: this.sanitizeQuery(query),
      timestamp: Date.now(),
      tables: tables,
      operation: operation
    });

    tables.forEach(table => pattern.tables.add(table));
    pattern.operations.add(operation);

    // Check for unusual patterns
    const unusualPatterns = [];
    
    // Too many queries in short time
    if (pattern.queries.length > 50) {
      unusualPatterns.push('High query frequency');
    }
    
    // Accessing unusual table combinations
    if (pattern.tables.size > 5) {
      unusualPatterns.push('Unusual table access pattern');
    }
    
    // Unusual operations
    if (pattern.operations.has('delete') || pattern.operations.has('drop')) {
      unusualPatterns.push('Destructive operations detected');
    }

    this.accessPatterns.set(patternKey, pattern);

    return {
      unusual: unusualPatterns.length > 0,
      patterns: unusualPatterns,
      queryCount: pattern.queries.length,
      tables: Array.from(pattern.tables),
      operations: Array.from(pattern.operations)
    };
  }

  // Execute monitored query
  async executeMonitoredQuery(db, query, params, userId, queryId) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Monitor query execution
      const monitor = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > 30000) { // 30 seconds timeout
          clearInterval(monitor);
          reject(new Error('Query timeout'));
        }
      }, 5000);

      // Execute query
      if (query.trim().toLowerCase().startsWith('select')) {
        db.all(query, params, (err, rows) => {
          clearInterval(monitor);
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else {
        db.run(query, params, function(err) {
          clearInterval(monitor);
          if (err) {
            reject(err);
          } else {
            resolve({ 
              affectedRows: this.changes,
              insertId: this.lastID 
            });
          }
        });
      }
    });
  }

  // Database connection encryption
  encryptDatabaseConnection(config) {
    const encryptedConfig = {
      ...config,
      host: this.encryptField('connection', 'host', config.host, 'system'),
      database: this.encryptField('connection', 'database', config.database, 'system'),
      username: this.encryptField('connection', 'username', config.username, 'system'),
      password: this.encryptField('connection', 'password', config.password, 'system'),
      ssl: {
        rejectUnauthorized: true,
        cert: this.getDatabaseCertificate(),
        key: this.getDatabaseKey(),
        ca: this.getCACertificate()
      }
    };

    return encryptedConfig;
  }

  // Row-level security
  applyRowLevelSecurity(userId, role, query) {
    const securityPolicies = {
      'Doctor': `patient_id IN (SELECT patient_id FROM DoctorPatients WHERE doctor_id = ${userId})`,
      'Hospital Reception': `created_by = ${userId}`,
      'Team Lead': `assigned_to = ${userId}`,
      'Analyst': `analyst_id = ${userId}`,
      'Admin': '1=1', // Full access
      'Production': 'status = "approved"'
    };

    const policy = securityPolicies[role];
    if (!policy) {
      return query; // No policy applied
    }

    // Add WHERE clause for row-level security
    if (query.toLowerCase().includes('where')) {
      return query.replace(/where/i, `WHERE ${policy} AND`);
    } else {
      return query.replace(/from\s+(\w+)/i, `FROM $1 WHERE ${policy}`);
    }
  }

  // Column-level security
  applyColumnLevelSecurity(userId, role, query) {
    const columnPolicies = {
      'Doctor': ['patient_id', 'name', 'diagnosis', 'treatment', 'prescription'],
      'Hospital Reception': ['patient_id', 'name', 'phone', 'email', 'registration_date'],
      'Team Lead': ['patient_id', 'name', 'status', 'assigned_to'],
      'Analyst': ['patient_id', 'name', 'processed_data'],
      'Admin': ['*'], // Full access
      'Production': ['patient_id', 'name', 'status', 'processed_data']
    };

    const allowedColumns = columnPolicies[role];
    if (!allowedColumns || allowedColumns.includes('*')) {
      return query; // No column restriction
    }

    // Replace SELECT * with allowed columns
    const selectPattern = /select\s+\*\s+from/i;
    if (selectPattern.test(query)) {
      return query.replace(selectPattern, `SELECT ${allowedColumns.join(', ')} FROM`);
    }

    return query;
  }

  // Audit logging methods
  logQueryAttempt(queryData) {
    this.queryAuditLog.push({
      type: 'QUERY_ATTEMPT',
      ...queryData
    });
    this.writeAuditLog('QUERY_ATTEMPT', queryData);
  }

  logQuerySuccess(queryData) {
    this.queryAuditLog.push({
      type: 'QUERY_SUCCESS',
      ...queryData
    });
    this.writeAuditLog('QUERY_SUCCESS', queryData);
  }

  logQueryFailure(queryData) {
    this.queryAuditLog.push({
      type: 'QUERY_FAILURE',
      ...queryData
    });
    this.writeAuditLog('QUERY_FAILURE', queryData);
  }

  logSecurityViolation(violationData) {
    this.queryAuditLog.push({
      type: 'SECURITY_VIOLATION',
      ...violationData
    });
    this.writeAuditLog('SECURITY_VIOLATION', violationData);
  }

  async writeAuditLog(type, data) {
    try {
      const logFile = './secure-logs/database-security.log';
      await fs.mkdir('./secure-logs', { recursive: true });
      
      const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        type: type,
        data: data
      }) + '\n';
      
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write database security log:', error);
    }
  }

  // Helper methods
  sanitizeQuery(query) {
    return query.replace(/['"]/g, '').replace(/\s+/g, ' ').trim();
  }

  sanitizeParams(params) {
    if (!params) return null;
    
    if (Array.isArray(params)) {
      return params.map(p => typeof p === 'string' ? p.replace(/['"]/g, '') : p);
    }
    
    return params;
  }

  getDatabaseCertificate() {
    // In production, load actual database certificate
    return '';
  }

  getDatabaseKey() {
    // In production, load actual database key
    return '';
  }

  getCACertificate() {
    // In production, load actual CA certificate
    return '';
  }

  // Key rotation
  rotateEncryptionKeys() {
    const now = Date.now();
    
    for (const [keyId, key] of this.encryptionKeys.entries()) {
      const keyAge = now - parseInt(keyId.split('-').pop());
      
      if (keyAge > this.encryptionKeyRotationInterval) {
        // Generate new key and re-encrypt data
        this.reencryptDataWithNewKey(keyId);
      }
    }
  }

  reencryptDataWithNewKey(oldKeyId) {
    // Implement key rotation logic
    console.log(`Rotating encryption key: ${oldKeyId}`);
  }

  // Get security dashboard
  getSecurityDashboard() {
    return {
      encryptedFields: this.fieldEncryptionMap.size,
      activeKeys: this.encryptionKeys.size,
      queryAttempts: this.queryAuditLog.filter(log => log.type === 'QUERY_ATTEMPT').length,
      securityViolations: this.queryAuditLog.filter(log => log.type === 'SECURITY_VIOLATION').length,
      accessPatterns: this.accessPatterns.size,
      lastKeyRotation: new Date().toISOString()
    };
  }
}

module.exports = new DatabaseSecurity();
