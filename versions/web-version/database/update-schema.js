const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.resolve(__dirname, 'medical_records.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

console.log('Database path:', dbPath);
console.log('Schema path:', schemaPath);

// Read schema file
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

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

// Split schema into statements and execute
const statements = schemaContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);

let completed = 0;
let errors = 0;

function runNext(index) {
  if (index >= statements.length) {
    console.log(`\n✅ Schema update complete!`);
    console.log(`   Successful: ${completed}`);
    console.log(`   Errors: ${errors}`);
    db.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
    return;
  }

  const statement = statements[index] + ';';
  
  db.run(statement, (err) => {
    if (err) {
      // Ignore "already exists" errors
      if (err.message.includes('already exists')) {
        completed++;
      } else {
        console.error(`Error executing statement ${index + 1}:`, err.message.substring(0, 100));
        errors++;
      }
    } else {
      completed++;
    }
    
    if ((completed + errors) % 5 === 0) {
      process.stdout.write(`\r   Progress: ${completed + errors}/${statements.length}`);
    }
    
    runNext(index + 1);
  });
}

console.log('Starting schema update...');
runNext(0);
