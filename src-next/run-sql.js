const database = require('./lib/database');

// Get SQL query from command line arguments
const sqlQuery = process.argv.slice(2).join(' ');

if (!sqlQuery) {
  console.log('Usage: node run-sql.js "SELECT * FROM users"');
  console.log('Examples:');
  console.log('  node run-sql.js "SELECT * FROM users"');
  console.log('  node run-sql.js "UPDATE users SET role = \'doctor\' WHERE id = 1"');
  console.log('  node run-sql.js "DELETE FROM users WHERE id = 5"');
  process.exit(0);
}

async function executeSql() {
  try {
    console.log('Executing SQL:', sqlQuery);
    
    // For SELECT queries and PRAGMA queries
    if (sqlQuery.trim().toUpperCase().startsWith('SELECT') || sqlQuery.trim().toUpperCase().startsWith('PRAGMA')) {
      const results = await database.query(sqlQuery);
      console.log('\nResults:');
      console.table(results);
    } 
    // For UPDATE, INSERT, DELETE, ALTER queries
    else if (sqlQuery.trim().toUpperCase().match(/^(UPDATE|INSERT|DELETE|ALTER|CREATE|DROP|PRAGMA)/)) {
      const result = await database.run(sqlQuery);
      console.log('\nQuery executed successfully!');
      console.log('Changes made:', result.changes);
      if (result.id) console.log('Last insert ID:', result.id);
    }
    else {
      console.log('Unknown query type. Use SELECT, INSERT, UPDATE, or DELETE');
    }
    
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    process.exit(1);
  }
}

executeSql();
