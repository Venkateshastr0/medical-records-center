const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database file path
const dbPath = path.join(__dirname, 'medical_records.db');

// Initialize pharmacy tables
async function initPharmacyTables() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database.');

      // Read the SQL file
      const sqlPath = path.join(__dirname, 'create-pharmacy-tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Execute the SQL
      db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing pharmacy SQL:', err.message);
          reject(err);
          return;
        }

        console.log('✅ Pharmacy tables created successfully!');

        // Verify tables were created
        db.all(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('medications', 'stock_transactions')",
          (err, rows) => {
            if (err) {
              console.error('Error verifying tables:', err);
              reject(err);
              return;
            }

            console.log(`✅ Verified: ${rows.length} pharmacy tables exist`);
            rows.forEach(row => console.log(`   • ${row.name}`));

            // Check sample data
            db.get('SELECT COUNT(*) as count FROM medications', (err, row) => {
              if (err) {
                console.error('Error checking medications:', err);
                reject(err);
                return;
              }

              console.log(`✅ Medications table has ${row.count} records`);

              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err);
                  reject(err);
                  return;
                }
                console.log('Database connection closed.');
                resolve();
              });
            });
          }
        );
      });
    });
  });
}

// Run the initialization
if (require.main === module) {
  initPharmacyTables()
    .then(() => {
      console.log('\n🎉 Pharmacy setup complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Setup failed:', err);
      process.exit(1);
    });
}

module.exports = { initPharmacyTables };
