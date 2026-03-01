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

      // Enhanced Patients table with field-level encryption
      db.run(`
        CREATE TABLE IF NOT EXISTS Patients (
          patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
          
          -- Basic info (encrypted)
          name_encrypted TEXT,
          name_key_id TEXT,
          age INTEGER,
          gender TEXT,
          date_of_birth TEXT,
          
          -- Contact info (encrypted)
          phone_encrypted TEXT,
          phone_key_id TEXT,
          email_encrypted TEXT,
          email_key_id TEXT,
          address_encrypted TEXT,
          address_key_id TEXT,
          
          -- Medical info (encrypted)
          blood_group_encrypted TEXT,
          blood_group_key_id TEXT,
          allergies_encrypted TEXT,
          allergies_key_id TEXT,
          medical_history_encrypted TEXT,
          medical_history_key_id TEXT,
          
          -- Emergency contact (encrypted)
          emergency_contact_encrypted TEXT,
          emergency_contact_key_id TEXT,
          emergency_phone_encrypted TEXT,
          emergency_phone_key_id TEXT,
          emergency_relation_encrypted TEXT,
          emergency_relation_key_id TEXT,
          
          -- Administrative fields
          status TEXT DEFAULT 'Active',
          registered_by INTEGER,
          registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          -- Security fields
          access_count INTEGER DEFAULT 0,
          last_access TEXT,
          data_hash TEXT,
          encryption_version TEXT DEFAULT '1.0',
          
          FOREIGN KEY (registered_by) REFERENCES Users(user_id)
        )
      `);

      // Enhanced Records table with comprehensive encryption
      db.run(`
        CREATE TABLE IF NOT EXISTS Records (
          record_id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER,
          
          -- Record metadata
          type TEXT,
          severity TEXT,
          urgency TEXT,
          
          -- Medical data (encrypted)
          diagnosis_encrypted TEXT,
          diagnosis_key_id TEXT,
          treatment_encrypted TEXT,
          treatment_key_id TEXT,
          prescription_encrypted TEXT,
          prescription_key_id TEXT,
          notes_encrypted TEXT,
          notes_key_id TEXT,
          symptoms_encrypted TEXT,
          symptoms_key_id TEXT,
          vital_signs_encrypted TEXT,
          vital_signs_key_id TEXT,
          
          -- Administrative fields
          created_by INTEGER,
          updated_by INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          
          -- Workflow fields
          status TEXT DEFAULT 'Draft',
          assigned_to INTEGER,
          reviewed_by INTEGER,
          reviewed_at TEXT,
          approved_by INTEGER,
          approved_at TEXT,
          
          -- External reporting
          report_to TEXT,
          report_sent_at TEXT,
          report_status TEXT,
          
          -- Security fields
          access_count INTEGER DEFAULT 0,
          last_access TEXT,
          data_hash TEXT,
          encryption_version TEXT DEFAULT '1.0',
          compliance_flag TEXT DEFAULT 'HIPAA',
          
          FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
          FOREIGN KEY (created_by) REFERENCES Users(user_id),
          FOREIGN KEY (updated_by) REFERENCES Users(user_id),
          FOREIGN KEY (assigned_to) REFERENCES Users(user_id),
          FOREIGN KEY (reviewed_by) REFERENCES Users(user_id),
          FOREIGN KEY (approved_by) REFERENCES Users(user_id)
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

      // UserRegistrations table with enhanced security
      db.run(`
        CREATE TABLE IF NOT EXISTS UserRegistrations (
          registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          ip_address TEXT,
          role TEXT NOT NULL,
          organization TEXT,
          business_license TEXT,
          contact_person TEXT,
          status TEXT DEFAULT 'pending',
          submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
          reviewed_by INTEGER,
          reviewed_at TEXT,
          rejection_reason TEXT,
          
          -- Security fields
          verification_token TEXT,
          verification_expires TEXT,
          verified_at TEXT,
          security_questions_encrypted TEXT,
          security_answers_encrypted TEXT,
          
          -- Compliance fields
          compliance_check TEXT,
          background_check TEXT,
          risk_score REAL DEFAULT 0
        )
      `);

      // Organizations table with security fields
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

      console.log("✅ Enhanced tables initialized with field-level encryption");
      
      // Create indexes for better performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON Users(status);
        CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON Users(mfa_enabled);
        CREATE INDEX IF NOT EXISTS idx_users_account_locked ON Users(account_locked);
        
        CREATE INDEX IF NOT EXISTS idx_patients_status ON Patients(status);
        CREATE INDEX IF NOT EXISTS idx_patients_registered_by ON Patients(registered_by);
        CREATE INDEX IF NOT EXISTS idx_patients_created_at ON Patients(created_at);
        CREATE INDEX IF NOT EXISTS idx_patients_encryption_version ON Patients(encryption_version);
        
        CREATE INDEX IF NOT EXISTS idx_records_patient_id ON Records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_records_created_by ON Records(created_by);
        CREATE INDEX IF NOT EXISTS idx_records_status ON Records(status);
        CREATE INDEX IF NOT EXISTS idx_records_type ON Records(type);
        CREATE INDEX IF NOT EXISTS idx_records_created_at ON Records(created_at);
        CREATE INDEX IF NOT EXISTS idx_records_encryption_version ON Records(encryption_version);
        
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLogs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_user_id ON AuditLogs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLogs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_ip_address ON AuditLogs(ip_address);
        CREATE INDEX IF NOT EXISTS idx_audit_compliance_event ON AuditLogs(compliance_event);
        
        CREATE INDEX IF NOT EXISTS idx_personal_storage_user_id ON PersonalStorage(user_id);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_assigned_to ON PersonalStorage(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_status ON PersonalStorage(status);
        CREATE INDEX IF NOT EXISTS idx_personal_storage_created_at ON PersonalStorage(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_processed_data_processed_by ON ProcessedData(processed_by);
        CREATE INDEX IF NOT EXISTS idx_processed_data_status ON ProcessedData(processing_status);
        CREATE INDEX IF NOT EXISTS idx_processed_data_created_at ON ProcessedData(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON SecurityEvents(event_type);
        CREATE INDEX IF NOT EXISTS idx_security_events_severity ON SecurityEvents(severity);
        CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON SecurityEvents(ip_address);
        CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON SecurityEvents(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_session_management_user_id ON SessionManagement(user_id);
        CREATE INDEX IF NOT EXISTS idx_session_management_device_fingerprint ON SessionManagement(device_fingerprint);
        CREATE INDEX IF NOT EXISTS idx_session_management_ip_address ON SessionManagement(ip_address);
        CREATE INDEX IF NOT EXISTS idx_session_management_expires_at ON SessionManagement(expires_at);
      `);
      
      resolve();
    });
  });
}

module.exports = { initDatabase };
