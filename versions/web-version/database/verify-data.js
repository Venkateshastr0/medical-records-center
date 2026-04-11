const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'medical_records.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

// Check births count
db.get('SELECT COUNT(*) as count FROM births', (err, row) => {
  if (err) {
    console.error('Error querying births:', err.message);
  } else {
    console.log('✅ Births table:', row.count, 'records');
  }
});

// Check deaths count
db.get('SELECT COUNT(*) as count FROM deaths', (err, row) => {
  if (err) {
    console.error('Error querying deaths:', err.message);
  } else {
    console.log('✅ Deaths table:', row.count, 'records');
  }
});

// Show sample birth record
db.get('SELECT birth_id, mother_name, birth_date, newborn_gender FROM births LIMIT 1', (err, row) => {
  if (err) {
    console.error('Error querying sample birth:', err.message);
  } else if (row) {
    console.log('\n📋 Sample Birth Record:');
    console.log('   ID:', row.birth_id);
    console.log('   Mother:', row.mother_name);
    console.log('   Date:', row.birth_date);
    console.log('   Gender:', row.newborn_gender);
  }
});

// Show sample death record
db.get('SELECT death_id, patient_id, death_date, cause_of_death FROM deaths LIMIT 1', (err, row) => {
  if (err) {
    console.error('Error querying sample death:', err.message);
  } else if (row) {
    console.log('\n📋 Sample Death Record:');
    console.log('   ID:', row.death_id);
    console.log('   Patient:', row.patient_id);
    console.log('   Date:', row.death_date);
    console.log('   Cause:', row.cause_of_death);
  }
  
  db.close();
});
