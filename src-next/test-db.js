const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'medical_records.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }

  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      console.log('Tables:', tables.map(t => t.name).join(', '));
    }

    // Check medications count
    db.get('SELECT COUNT(*) as count FROM medications', (err, row) => {
      if (err) {
        console.error('Error querying medications:', err.message);
      } else {
        console.log('Medications count:', row?.count || 0);
      }

      // Check prescriptions count
      db.get('SELECT COUNT(*) as count FROM prescriptions', (err, row) => {
        if (err) {
          console.error('Error querying prescriptions:', err.message);
        } else {
          console.log('Prescriptions count:', row?.count || 0);
        }

        // Show first medication
        db.get('SELECT * FROM medications LIMIT 1', (err, row) => {
          if (err) {
            console.error('Error fetching sample medication:', err.message);
          } else {
            console.log('Sample medication:', row);
          }

          db.close();
        });
      });
    });
  });
});
