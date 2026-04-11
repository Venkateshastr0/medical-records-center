const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    const testQuery = await database.get('SELECT 1 as test');
    
    // Test births table
    const birthsTest = await database.get('SELECT COUNT(*) as count FROM births');
    
    // Test deaths table
    const deathsTest = await database.get('SELECT COUNT(*) as count FROM deaths');
    
    // Test patients table
    const patientsTest = await database.get('SELECT COUNT(*) as count FROM patients');
    
    // Test users table
    const usersTest = await database.get('SELECT COUNT(*) as count FROM users');

    res.status(200).json({
      database_connection: 'OK',
      tables: {
        births: birthsTest.count,
        deaths: deathsTest.count,
        patients: patientsTest.count,
        users: usersTest.count
      },
      test_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      database_connection: 'FAILED',
      error: error.message 
    });
  }
}
