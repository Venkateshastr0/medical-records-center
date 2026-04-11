const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'medical_records.db');

// Initialize database
function initializeDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database.');
  });

  // Read and execute schema
  const fs = require('fs');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Run initialization
if (require.main === module) {
  initializeDatabase();
}
  const saltRounds = 10;
  
  // Default users to create
  const defaultUsers = [
    {
      username: 'admin',
      email: 'admin@medicalrecords.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    },
    {
      username: 'doctor',
      email: 'doctor@medicalrecords.com',
      password: 'doctor123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'doctor'
    },
    {
      username: 'nurse',
      email: 'nurse@medicalrecords.com',
      password: 'nurse123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'nurse'
    },
    {
      username: 'receptionist',
      email: 'reception@medicalrecords.com',
      password: 'recept123',
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'receptionist'
    },
    {
      username: 'pharmacy',
      email: 'pharmacy@medicalrecords.com',
      password: 'pharm123',
      firstName: 'James',
      lastName: 'Wilson',
      role: 'pharmacy'
    }
  ];

  let completed = 0;
  defaultUsers.forEach(user => {
    bcrypt.hash(user.password, saltRounds, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err.message);
        return;
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users 
        (username, email, password_hash, first_name, last_name, role) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        user.username,
        user.email,
        hash,
        user.firstName,
        user.lastName,
        user.role
      ], (err) => {
        if (err) {
          console.error('Error inserting user:', err.message);
        } else {
          console.log(`Default user '${user.username}' (${user.role}) created successfully.`);
        }
        
        completed++;
        if (completed === defaultUsers.length) {
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('Database setup completed successfully.');
            }
          });
        }
      });

      stmt.finalize();
    });
  });
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
