const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'medical_records.db');
const sqlFilePath = path.resolve(__dirname, 'births_deaths.sql');

console.log('Adding births/deaths tables and data to src-next database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  // Create BIRTHS table
  console.log('Creating BIRTHS table...');
  db.run(`CREATE TABLE IF NOT EXISTS births (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    birth_id VARCHAR(20) UNIQUE NOT NULL,
    mother_patient_id VARCHAR(20) NOT NULL,
    newborn_patient_id VARCHAR(20) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    birth_date DATE NOT NULL,
    birth_time TIME,
    newborn_gender VARCHAR(10),
    birth_weight VARCHAR(50),
    apgar_score VARCHAR(50),
    delivery_type VARCHAR(100),
    complication VARCHAR(200),
    gestation_weeks INTEGER,
    attending_doctor_id VARCHAR(20),
    ward VARCHAR(100),
    newborn_condition VARCHAR(200),
    nicu_admission VARCHAR(10),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating births table:', err.message);
    else console.log('✅ BIRTHS table created');
  });

  // Create DEATHS table
  console.log('Creating DEATHS table...');
  db.run(`CREATE TABLE IF NOT EXISTS deaths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    death_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    death_date DATE NOT NULL,
    death_time TIME,
    cause_of_death VARCHAR(200) NOT NULL,
    icd10_cause_code VARCHAR(20),
    secondary_condition VARCHAR(200),
    manner_of_death VARCHAR(50),
    place_of_death VARCHAR(100),
    attending_doctor_id VARCHAR(20),
    death_certificate_number VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating deaths table:', err.message);
    else console.log('✅ DEATHS table created');
  });
});

// Read and import data
setTimeout(() => {
  console.log('\nReading births_deaths.sql file...');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Extract INSERT statements
  const lines = sqlContent.split('\n');
  const statements = lines
    .map(s => s.trim())
    .filter(s => s.startsWith('INSERT INTO') && (s.includes('BIRTHS') || s.includes('DEATHS')));
  
  console.log(`Found ${statements.length} INSERT statements`);
  
  let completed = 0;
  let errors = 0;
  
  function runNext(index) {
    if (index >= statements.length) {
      console.log(`\n✅ Import complete!`);
      console.log(`   Successful: ${completed}`);
      console.log(`   Errors: ${errors}`);
      
      // Verify counts
      db.get('SELECT COUNT(*) as births FROM births', (err, row) => {
        if (!err) console.log(`   Total births: ${row.births}`);
      });
      
      db.get('SELECT COUNT(*) as deaths FROM deaths', (err, row) => {
        if (!err) console.log(`   Total deaths: ${row.deaths}`);
        db.close();
      });
      return;
    }
    
    const statement = statements[index];
    db.run(statement, (err) => {
      if (err) {
        if (!err.message.includes('UNIQUE constraint failed')) {
          errors++;
        }
      } else {
        completed++;
      }
      
      if ((completed + errors) % 10 === 0) {
        process.stdout.write(`\r   Progress: ${completed + errors}/${statements.length}`);
      }
      
      runNext(index + 1);
    });
  }
  
  console.log('Starting data import...');
  runNext(0);
}, 1000);
