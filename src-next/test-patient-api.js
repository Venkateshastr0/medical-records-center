const database = require('./lib/database');

(async () => {
  try {
    console.log('Testing patient database...');
    
    // Check if patients exist
    const patients = await database.query('SELECT * FROM patients LIMIT 5');
    console.log('Patients in DB:', patients.length);
    
    if (patients.length > 0) {
      console.log('First patient:', patients[0]);
      
      // Test getting patient by ID
      const patient = await database.get('SELECT * FROM patients WHERE patient_id = ?', [patients[0].patient_id]);
      console.log('Patient by ID:', patient);
      
      // Test getting patient by regular ID
      const patientById = await database.get('SELECT * FROM patients WHERE id = ?', [patients[0].id]);
      console.log('Patient by regular ID:', patientById);
    } else {
      console.log('No patients found in database');
    }
    
  } catch (error) {
    console.error('DB Error:', error);
  } finally {
    await database.close();
  }
})();
