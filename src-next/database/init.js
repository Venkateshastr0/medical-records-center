const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database file path
const dbPath = path.join(process.cwd(), 'database', 'medical_records.db');

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

  db.serialize(() => {
    // Drop existing table to ensure schema updates (like role constraints) are applied
    db.run("DROP TABLE IF EXISTS users", (err) => {
      if (err) console.error('Error dropping users table:', err.message);
    });

    db.exec(schema, (err) => {
      if (err) {
        console.error('Error executing schema:', err.message);
      } else {
        console.log('Database schema created successfully.');
        // Create hashed passwords for default users
        createDefaultUsers(db);
      }
    });
  });
}

// Create default users with hashed passwords
function createDefaultUsers(db) {
  const saltRounds = 10;
  
  // Default users to create
  const defaultUsers = [
    {
      username: 'venkatesh',
      email: 'astroieant997@gmail.com',
      password: 'Hentailover0714',
      firstName: 'Venkatesh',
      lastName: 'M',
      role: 'admin'
    },
    {
      username: 'doctor_demo',
      email: 'doctor@medicalrecords.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'doctor'
    },
    {
      username: 'nurse_demo',
      email: 'nurse@medicalrecords.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'nurse'
    },
    {
      username: 'pharmacy_demo',
      email: 'pharmacy@demo.com',
      password: 'password123',
      firstName: 'Pharmacy',
      lastName: 'Demo',
      role: 'pharmacist'
    }
  ];

  let createdCount = 0;
  defaultUsers.forEach(user => {
    bcrypt.hash(user.password, saltRounds, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err.message);
        createdCount++;
        if (createdCount === defaultUsers.length) closeDatabase(db);
        return;
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users 
        (username, email, password_hash, first_name, last_name, role, is_approved) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        user.username,
        user.email,
        hash,
        user.firstName,
        user.lastName,
        user.role,
        1 // Default users are pre-approved
      ], (err) => {
        if (err) {
          console.error('Error inserting user:', err.message);
        } else {
          console.log(`Default user '${user.username}' created successfully.`);
        }
        createdCount++;
        if (createdCount === defaultUsers.length) closeDatabase(db);
      });

      stmt.finalize();
    });
  });
}

function closeDatabase(db) {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
