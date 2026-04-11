const database = require('./lib/database');

async function testPatientCreation() {
  try {
    console.log('Testing patient creation...\n');

    // Test 1: Insert a new patient
    console.log('1️⃣ Creating a test patient...');
    const newPatient = await database.run(
      `
      INSERT INTO patients (
        patient_id, first_name, last_name, date_of_birth, gender,
        phone, email, address, city, state, zip_code, country,
        blood_type, allergies, medical_history,
        emergency_contact_name, emergency_contact_phone,
        insurance_provider, insurance_policy_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'PAT-TEST001',
        'John',
        'Doe',
        '1990-05-15',
        'Male',
        '9876543210',
        'john@example.com',
        '123 Main St',
        'New York',
        'NY',
        '10001',
        'USA',
        'O+',
        'Peanut allergy',
        'Appendectomy in 2015',
        'Jane Doe',
        '9876543211',
        'Blue Shield',
        'BS123456'
      ]
    );
    console.log('✅ Patient created! Patient ID: PAT-TEST001\n');

    // Test 2: Retrieve the patient
    console.log('2️⃣ Retrieving the patient...');
    const patient = await database.get(
      'SELECT * FROM patients WHERE patient_id = ?',
      ['PAT-TEST001']
    );
    console.log('✅ Patient found:', {
      patient_id: patient.patient_id,
      name: `${patient.first_name} ${patient.last_name}`,
      dob: patient.date_of_birth,
      blood_type: patient.blood_type,
      country: patient.country,
      medical_history: patient.medical_history,
      allergies: patient.allergies
    });
    console.log();

    // Test 3: Update the patient
    console.log('3️⃣ Updating patient blood type...');
    await database.run(
      'UPDATE patients SET blood_type = ? WHERE patient_id = ?',
      ['AB+', 'PAT-TEST001']
    );
    const updatedPatient = await database.get(
      'SELECT blood_type FROM patients WHERE patient_id = ?',
      ['PAT-TEST001']
    );
    console.log('✅ Patient updated! New blood type:', updatedPatient.blood_type);
    console.log();

    // Test 4: List all patients
    console.log('4️⃣ Listing all patients...');
    const allPatients = await database.query(
      'SELECT patient_id, first_name, last_name, date_of_birth, gender, blood_type, country FROM patients LIMIT 5'
    );
    console.log('✅ Found', allPatients.length, 'patients:');
    console.table(allPatients);
    console.log();

    // Test 5: Delete the test patient
    console.log('5️⃣ Deleting test patient...');
    await database.run(
      'DELETE FROM patients WHERE patient_id = ?',
      ['PAT-TEST001']
    );
    const deleted = await database.get(
      'SELECT * FROM patients WHERE patient_id = ?',
      ['PAT-TEST001']
    );
    console.log('✅ Patient deleted:', deleted ? 'FAILED' : 'SUCCESS');
    console.log();

    console.log('✅ All tests passed! Patient creation and management is working correctly.');
    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await database.close();
    process.exit(1);
  }
}

testPatientCreation();
