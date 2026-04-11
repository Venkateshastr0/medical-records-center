const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'medical_records.db');
const sqlFilePath = path.resolve(__dirname, 'births_deaths.sql');

console.log('Database path:', dbPath);
console.log('SQL file path:', sqlFilePath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database\n');
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

// Read and parse SQL file
setTimeout(() => {
  console.log('\nReading SQL file...');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Extract only BIRTHS and DEATHS INSERT statements
  const lines = sqlContent.split('\n');
  const birthStatements = [];
  const deathStatements = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO BIRTHS')) {
      birthStatements.push(trimmed);
    } else if (trimmed.startsWith('INSERT INTO DEATHS')) {
      deathStatements.push(trimmed);
    }
  }
  
  console.log(`Found ${birthStatements.length} birth records`);
  console.log(`Found ${deathStatements.length} death records\n`);
  
  // Import births
  console.log('Importing birth records...');
  let birthCount = 0;
  let birthErrors = 0;
  
  db.serialize(() => {
    birthStatements.forEach((stmt) => {
      db.run(stmt, (err) => {
        if (err) {
          if (!err.message.includes('UNIQUE constraint failed')) {
            birthErrors++;
          }
        } else {
          birthCount++;
        }
      });
    });
    
    // Import deaths after births
    console.log('Importing death records...');
    let deathCount = 0;
    let deathErrors = 0;
    
    deathStatements.forEach((stmt) => {
      db.run(stmt, (err) => {
        if (err) {
          if (!err.message.includes('UNIQUE constraint failed')) {
            deathErrors++;
          }
        } else {
          deathCount++;
        }
      });
    });
    
    // Show results
    setTimeout(() => {
      console.log('\n✅ Import complete!');
      console.log(`   Births: ${birthCount} imported (${birthErrors} errors)`);
      console.log(`   Deaths: ${deathCount} imported (${deathErrors} errors)`);
      
      // Verify
      db.get('SELECT COUNT(*) as count FROM births', (err, row) => {
        if (!err) console.log(`   Total births in DB: ${row.count}`);
      });
      
      db.get('SELECT COUNT(*) as count FROM deaths', (err, row) => {
        if (!err) console.log(`   Total deaths in DB: ${row.count}`);
        db.close();
      });
    }, 2000);
  });
}, 1000);
