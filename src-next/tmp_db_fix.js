const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'medical_records.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Adding missing columns to users table...');

  // Helper to add column if it doesn't exist
  const addColumn = (colName, colDef) => {
    db.run(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column ${colName} already exists.`);
        } else {
          console.error(`Error adding column ${colName}:`, err.message);
        }
      } else {
        console.log(`Column ${colName} added successfully.`);
      }
    });
  };

  addColumn('profile_photo', 'TEXT');
  addColumn('department', 'VARCHAR(100)');
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database update finished.');
    }
  });
});
