const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.resolve(__dirname, 'medical_records.db');
const sqlFilePath = path.resolve(__dirname, 'births_deaths.sql');

console.log('Database path:', dbPath);
console.log('SQL file path:', sqlFilePath);

// Read SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Parse INSERT statements
const insertStatements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s.startsWith('INSERT INTO'));

console.log(`Found ${insertStatements.length} INSERT statements`);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Execute INSERT statements
let completed = 0;
let errors = 0;

function runNext(index) {
  if (index >= insertStatements.length) {
    console.log(`\n✅ Import complete!`);
    console.log(`   Successful: ${completed}`);
    console.log(`   Errors: ${errors}`);
    db.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
    return;
  }

  const statement = insertStatements[index] + ';';
  
  db.run(statement, (err) => {
    if (err) {
      console.error(`Error executing statement ${index + 1}:`, err.message);
      errors++;
    } else {
      completed++;
      if (completed % 10 === 0) {
        process.stdout.write(`\r   Progress: ${completed}/${insertStatements.length}`);
      }
    }
    runNext(index + 1);
  });
}

// Start import
console.log('\nStarting data import...');
runNext(0);
