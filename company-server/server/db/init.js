const db = require("./database");

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enhanced Users table with security fields
      db.run(`
        CREATE TABLE IF NOT EXISTS Users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          username TEXT UNIQUE,
          password_hash TEXT,
          role TEXT,
          email TEXT,
          phone TEXT,
          organization TEXT,
          status TEXT DEFAULT 'pending',
          approved_by INTEGER,
          approved_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          last_login TEXT,
          access_level TEXT DEFAULT 'basic',
          
          -- Security fields
          mfa_enabled BOOLEAN DEFAULT 0,
          mfa_secret TEXT,
          biometric_enabled BOOLEAN DEFAULT 0,
          biometric_template TEXT,
          hardware_key_enabled BOOLEAN DEFAULT 0,
          hardware_key_id TEXT,
          device_trust_score REAL DEFAULT 0,
          last_security_check TEXT,
          failed_login_attempts INTEGER DEFAULT 0,
          account_locked BOOLEAN DEFAULT 0,
          lockout_expires TEXT,
          
          -- Encryption fields
          email_encrypted TEXT,
          phone_encrypted TEXT,
          encryption_key_id TEXT,
          
          -- Audit fields
          created_ip TEXT,
          last_login_ip TEXT,
          session_count INTEGER DEFAULT 0
        )
      `);

      // Enhanced Organizations table
      db.run(`
        CREATE TABLE IF NOT EXISTS Organizations (
          org_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          type TEXT,
          license_number TEXT,
          contact_email TEXT,
          contact_phone TEXT,
          address TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          -- Security fields
          security_level TEXT DEFAULT 'standard',
          compliance_level TEXT DEFAULT 'basic',
          audit_required BOOLEAN DEFAULT 1,
          data_retention_days INTEGER DEFAULT 2555,
          
          -- Encryption fields
          contact_email_encrypted TEXT,
          contact_phone_encrypted TEXT,
          address_encrypted TEXT
        )
      `);

      // Personal Storage table for SIP communication
      db.run(`
        CREATE TABLE IF NOT EXISTS PersonalStorage (
          storage_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          storage_type TEXT,
          file_name TEXT,
          file_path TEXT,
          file_size INTEGER,
          file_hash TEXT,
          
          -- Data fields (encrypted)
          data_encrypted TEXT,
          data_key_id TEXT,
          metadata_encrypted TEXT,
          metadata_key_id TEXT,
          
          -- Workflow fields
          assigned_from INTEGER,
          assigned_to INTEGER,
          assignment_notes TEXT,
          status TEXT DEFAULT 'received',
          
          -- Security fields
          access_count INTEGER DEFAULT 0,
          last_access TEXT,
          encryption_version TEXT DEFAULT '1.0',
          compliance_flag TEXT DEFAULT 'HIPAA',
          
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT,
          
          FOREIGN KEY (user_id) REFERENCES Users(user_id),
          FOREIGN KEY (assigned_from) REFERENCES Users(user_id),
          FOREIGN KEY (assigned_to) REFERENCES Users(user_id)
        )
      `);

      // ProcessedData table for main server
      db.run(`
        CREATE TABLE IF NOT EXISTS ProcessedData (
          data_id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_storage_id INTEGER,
          
          -- Data fields (encrypted)
          processed_data_encrypted TEXT,
          processed_data_key_id TEXT,
          summary_encrypted TEXT,
          summary_key_id TEXT,
          
          -- Processing fields
          processed_by INTEGER,
          processing_type TEXT,
          processing_status TEXT DEFAULT 'pending',
          quality_score REAL,
          
          -- Compliance fields
          compliance_check TEXT,
          hipaa_deidentified BOOLEAN DEFAULT 0,
          retention_required BOOLEAN DEFAULT 1,
          
          -- Security fields
          access_count INTEGER DEFAULT 0,
          last_access TEXT,
          data_hash TEXT,
          encryption_version TEXT DEFAULT '1.0',
          
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (original_storage_id) REFERENCES PersonalStorage(storage_id),
          FOREIGN KEY (processed_by) REFERENCES Users(user_id)
        )
      `);

      // Enhanced AuditLogs table with security tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS AuditLogs (
          log_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT,
          resource_type TEXT,
          resource_id INTEGER,
          details TEXT,
          
          -- Security fields
          ip_address TEXT,
          user_agent TEXT,
          device_fingerprint TEXT,
          session_id TEXT,
          trust_score REAL,
          verification_method TEXT,
          
          -- Data fields
          old_values_encrypted TEXT,
          new_values_encrypted TEXT,
          data_hash TEXT,
          
          -- Compliance fields
          compliance_event TEXT,
          hipaa_event_type TEXT,
          retention_required BOOLEAN DEFAULT 1,
          
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
      `);

      // SecurityEvents table for intrusion detection
      db.run(`
        CREATE TABLE IF NOT EXISTS SecurityEvents (
          event_id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT,
          severity TEXT,
          ip_address TEXT,
          user_agent TEXT,
          device_fingerprint TEXT,
          user_id INTEGER,
          
          -- Event details
          details_encrypted TEXT,
          details_key_id TEXT,
          threat_level TEXT,
          response_taken TEXT,
          
          -- Resolution fields
          resolved BOOLEAN DEFAULT 0,
          resolved_by INTEGER,
          resolved_at TEXT,
          resolution_notes TEXT,
          
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (user_id) REFERENCES Users(user_id),
          FOREIGN KEY (resolved_by) REFERENCES Users(user_id)
        )
      `);

      // SessionManagement table for zero trust
      db.run(`
        CREATE TABLE IF NOT EXISTS SessionManagement (
          session_id TEXT PRIMARY KEY,
          user_id INTEGER,
          device_fingerprint TEXT,
          ip_address TEXT,
          trust_score REAL DEFAULT 0,
          
          -- Session security
          mfa_verified BOOLEAN DEFAULT 0,
          biometric_verified BOOLEAN DEFAULT 0,
          hardware_key_verified BOOLEAN DEFAULT 0,
          
          -- Session tracking
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT,
          activity_count INTEGER DEFAULT 0,
          
          -- Security flags
          suspicious_activity BOOLEAN DEFAULT 0,
          security_alerts INTEGER DEFAULT 0,
          
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
      `);

      // TeamManagement table for TL assignments
      db.run(`
        CREATE TABLE IF NOT EXISTS TeamManagement (
          team_id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_lead_id INTEGER,
          team_name TEXT,
          department TEXT,
          
          -- Team members
          members_encrypted TEXT,
          members_key_id TEXT,
          
          -- Administrative
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active',
          
          FOREIGN KEY (team_lead_id) REFERENCES Users(user_id)
        )
      `);

      // AssignmentTracking table for workflow
      db.run(`
        CREATE TABLE IF NOT EXISTS AssignmentTracking (
          assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
          storage_id INTEGER,
          assigned_by INTEGER,
          assigned_to INTEGER,
          assignment_type TEXT,
          
          -- Assignment details
          notes_encrypted TEXT,
          notes_key_id TEXT,
          priority TEXT DEFAULT 'medium',
          deadline TEXT,
          
          -- Status tracking
          status TEXT DEFAULT 'assigned',
          accepted_at TEXT,
          started_at TEXT,
          completed_at TEXT,
          
          -- Quality control
          quality_score REAL,
          review_notes TEXT,
          approved_by INTEGER,
          approved_at TEXT,
          
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (storage_id) REFERENCES PersonalStorage(storage_id),
          FOREIGN KEY (assigned_by) REFERENCES Users(user_id),
          FOREIGN KEY (assigned_to) REFERENCES Users(user_id),
          FOREIGN KEY (approved_by) REFERENCES Users(user_id)
        )
      `);

      console.log("✅ Enhanced company tables initialized with field-level encryption");
      
      // Create indexes for better performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON Users(status);
        CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON Users(mfa_enabled);
        CREATE INDEX IF NOT EXISTS idx_users_account_locked ON Users(account_locked);
        
        CREATE INDEX IF NOT EXISTS idx_personal_storage_user_id ON PersonalStorage(user_id);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_assigned_to ON PersonalStorage(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_status ON PersonalStorage(status);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_created_at ON PersonalStorage(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_processed_data_processed_by ON ProcessedData(processed_by);
        CREATE INDEX IF NOT EXISTS idx_processed_data_status ON ProcessedData(processing_status);
        CREATE INDEX IF NOT EXISTS idx_processed_data_created_at ON ProcessedData(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLogs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_user_id ON AuditLogs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLogs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_ip_address ON AuditLogs(ip_address);
        CREATE INDEX IF NOT EXISTS idx_audit_compliance_event ON AuditLogs(compliance_event);
        
        CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON SecurityEvents(event_type);
        CREATE INDEX IF NOT EXISTS idx_security_events_severity ON SecurityEvents(severity);
        CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON SecurityEvents(ip_address);
        CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON SecurityEvents(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_session_management_user_id ON SessionManagement(user_id);
        CREATE INDEX IF NOT EXISTS idx_session_management_device_fingerprint ON SessionManagement(device_fingerprint);
        CREATE INDEX IF NOT EXISTS idx_session_management_ip_address ON SessionManagement(ip_address);
        CREATE INDEX IF NOT EXISTS idx_session_management_expires_at ON SessionManagement(expires_at);
        
        CREATE INDEX IF NOT EXISTS idx_team_management_team_lead_id ON TeamManagement(team_lead_id);
        CREATE INDEX IF NOT EXISTS idx_team_management_status ON TeamManagement(status);
        
        CREATE INDEX IF NOT EXISTS idx_assignment_tracking_storage_id ON AssignmentTracking(storage_id);
        CREATE INDEX IF NOT EXISTS idx_assignment_tracking_assigned_to ON AssignmentTracking(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_assignment_tracking_status ON AssignmentTracking(status);
        CREATE INDEX IF NOT EXISTS idx_assignment_tracking_created_at ON AssignmentTracking(created_at);
      `);
      
      resolve();
    });
  });
}

module.exports = { initDatabase };
