const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'medical_records.db');

console.log('Adding more sample users to database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Additional sample users
const additionalUsers = [
  ['receptionist', 'receptionist@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Alice', 'Wilson', 'receptionist'],
  ['pharmacy', 'pharmacy@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Robert', 'Brown', 'pharmacy'],
  ['doctor2', 'doctor2@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Emily', 'Davis', 'doctor'],
  ['nurse2', 'nurse2@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Michael', 'Miller', 'nurse'],
  ['staff1', 'staff1@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Jennifer', 'Garcia', 'staff'],
  ['staff2', 'staff2@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'William', 'Martinez', 'staff'],
  ['doctor3', 'doctor3@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Linda', 'Anderson', 'doctor'],
  ['nurse3', 'nurse3@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'James', 'Taylor', 'nurse'],
  ['receptionist2', 'receptionist2@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Patricia', 'Thomas', 'receptionist'],
  ['pharmacy2', 'pharmacy2@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'David', 'Jackson', 'pharmacy']
];

db.serialize(() => {
  console.log('Inserting additional users...');
  
  additionalUsers.forEach((user, index) => {
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, user, (err) => {
      if (err) {
        console.error(`Error inserting user ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Added user: ${user[0]} (${user[5]})`);
      }
    });
  });
  
  // Verify total users after insertion
  setTimeout(() => {
    db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
      if (!err) {
        console.log(`\n✅ Total users in database: ${row.total}`);
        
        // Show user breakdown by role
        db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC', (err, rows) => {
          if (!err) {
            console.log('\n📊 Users by role:');
            rows.forEach(row => {
              console.log(`   ${row.role}: ${row.count}`);
            });
          }
          db.close();
        });
      } else {
        console.error('Error counting users:', err.message);
        db.close();
      }
    });
  }, 2000);
});
