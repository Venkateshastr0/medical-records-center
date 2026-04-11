const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'src-next', 'database', 'medical_records.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database:', dbPath);

db.serialize(() => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'", (err, row) => {
        if (!row) {
            console.log('Table "patients" does not exist.');
            process.exit(0);
        }
        
        db.get("SELECT COUNT(*) as count FROM patients", (err, row) => {
            console.log('Total Patients:', row ? row.count : 'Error');
        });
        
        db.get("SELECT COUNT(*) as count FROM medical_records", (err, row) => {
            console.log('Total Medical Records:', row ? row.count : 'Error');
        });

        db.get("SELECT COUNT(*) as count FROM appointments", (err, row) => {
            console.log('Total Appointments:', row ? row.count : 'Error');
            db.close();
        });
    });
});
