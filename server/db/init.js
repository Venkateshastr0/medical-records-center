const db = require("./database");

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
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
          access_level TEXT DEFAULT 'basic'
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Patients (
          patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          age INTEGER,
          gender TEXT,
          contact TEXT,
          medical_history TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Records (
          record_id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER,
          type TEXT,
          encrypted_path TEXT,
          created_by INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
          FOREIGN KEY (created_by) REFERENCES Users(user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS AuditLogs (
          log_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT,
          resource_id INTEGER,
          details TEXT,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
      `);

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
          rejection_reason TEXT
        )
      `);

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
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Conversations (
          conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant1_id INTEGER,
          participant2_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (participant1_id) REFERENCES Users(user_id),
          FOREIGN KEY (participant2_id) REFERENCES Users(user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS Messages (
          message_id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER,
          sender_id INTEGER,
          content TEXT,
          file_path TEXT,
          message_type TEXT DEFAULT 'text',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES Conversations(conversation_id),
          FOREIGN KEY (sender_id) REFERENCES Users(user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS AccessPermissions (
          permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          resource_type TEXT,
          resource_id INTEGER,
          permission_level TEXT,
          granted_by INTEGER,
          granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT,
          FOREIGN KEY (user_id) REFERENCES Users(user_id),
          FOREIGN KEY (granted_by) REFERENCES Users(user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS AnalysisResults (
          result_id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER,
          analysis_type TEXT,
          result_data TEXT,
          confidence_score REAL,
          ai_model TEXT,
          created_by INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
          FOREIGN KEY (created_by) REFERENCES Users(user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS PasswordResets (
          reset_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          used_at TEXT,
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
      `);

      console.log("✅ Tables initialized");
      
      // Create indexes for better performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON Users(status);
        CREATE INDEX IF NOT EXISTS idx_patients_name ON Patients(name);
        CREATE INDEX IF NOT EXISTS idx_patients_created_at ON Patients(created_at);
        CREATE INDEX IF NOT EXISTS idx_records_patient_id ON Records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_records_created_at ON Records(created_at);
        CREATE INDEX IF NOT EXISTS idx_records_created_by ON Records(created_by);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON Messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON Messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON Messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLogs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_user_id ON AuditLogs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLogs(action);
        CREATE INDEX IF NOT EXISTS idx_registrations_email ON UserRegistrations(email);
        CREATE INDEX IF NOT EXISTS idx_registrations_status ON UserRegistrations(status);
        CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at ON UserRegistrations(submitted_at);
        CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON Conversations(participant1_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON Conversations(participant2_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON Conversations(created_at);
        CREATE INDEX IF NOT EXISTS idx_analysisresults_patient_id ON AnalysisResults(patient_id);
        CREATE INDEX IF NOT EXISTS idx_analysisresults_created_at ON AnalysisResults(created_at);
      `);
      
      resolve();
    });
  });
}

module.exports = { initDatabase };
