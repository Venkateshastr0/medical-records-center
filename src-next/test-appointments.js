const database = require('./lib/database');

async function testAppointmentFlow() {
  try {
    console.log('Testing appointment workflow...\n');

    // First, ensure we have a patient and doctor
    console.log('1️⃣ Setting up test data...');

    // Get or create a test patient
    let patient = await database.get(
      'SELECT * FROM patients WHERE patient_id = ?',
      ['PAT-APPT-TEST']
    );

    if (!patient) {
      await database.run(
        `INSERT INTO patients (
          patient_id, first_name, last_name, date_of_birth, gender, phone, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['PAT-APPT-TEST', 'Test', 'Patient', '1990-01-01', 'Male', '9999999999', 'test@patient.com']
      );
      console.log('   ✓ Created test patient: PAT-APPT-TEST');
    } else {
      console.log('   ✓ Using existing patient: PAT-APPT-TEST');
    }

    // Get or create a test doctor
    let doctor = await database.get(
      'SELECT * FROM users WHERE username = ? AND role = ?',
      ['doctor_demo', 'doctor']
    );

    if (!doctor) {
      const doctorId = await database.run(
        `INSERT INTO users (
          username, email, password_hash, first_name, last_name, role, is_approved, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['doctor_demo', 'doctor@test.com', 'hash123', 'Demo', 'Doctor', 'doctor', 1, 1]
      );
      doctor = { id: doctorId.id };
      console.log('   ✓ Created test doctor');
    } else {
      console.log('   ✓ Using existing doctor:', doctor.first_name, doctor.last_name);
    }

    console.log();

    // Test 1: Create appointment
    console.log('2️⃣ Creating appointment...');
    const appointmentId = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
    const dateString = appointmentDate.toISOString().split('T')[0];

    // First, count existing appointments for queue number
    const queueResult = await database.get(
      'SELECT COUNT(*) as count FROM appointments WHERE date(appointment_date) = ? AND doctor_id = ? AND status != ?',
      [dateString, doctor.id, 'Cancelled']
    );
    const queueNumber = (queueResult?.count || 0) + 1;

    await database.run(
      `INSERT INTO appointments (
        appointment_id, patient_id, doctor_id, appointment_date, queue_number, 
        status, appointment_type, duration_minutes, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentId,
        'PAT-APPT-TEST',
        doctor.id,
        appointmentDate.toISOString(),
        queueNumber,
        'Scheduled',
        'Routine Checkup',
        30,
        'Initial consultation'
      ]
    );
    console.log('   ✓ Appointment created:', appointmentId);
    console.log('   ✓ Queue number:', queueNumber);
    console.log();

    // Test 2: Retrieve appointments for the doctor
    console.log('3️⃣ Retrieving appointments for doctor...');
    const appointments = await database.query(
      `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ? AND date(a.appointment_date) = ?
       ORDER BY a.queue_number ASC`,
      [doctor.id, dateString]
    );

    console.log(`   ✓ Found ${appointments.length} appointment(s):`);
    appointments.forEach(apt => {
      console.log(`     - ${apt.patient_name} (Queue: ${apt.queue_number}) - ${apt.appointment_type}`);
    });
    console.log();

    // Test 3: Update appointment status
    console.log('4️⃣ Updating appointment status to Confirmed...');
    await database.run(
      'UPDATE appointments SET status = ?, updated_at = datetime("now") WHERE appointment_id = ?',
      ['Confirmed', appointmentId]
    );

    const updated = await database.get(
      'SELECT * FROM appointments WHERE appointment_id = ?',
      [appointmentId]
    );
    console.log('   ✓ Status updated:', updated.status);
    console.log();

    // Test 4: List all upcoming appointments
    console.log('5️⃣ Listing all upcoming appointments (next 7 days)...');
    const nextWeek = new Date(new Date().getTime() + 7*24*60*60*1000).toISOString().split('T')[0];
    const upcoming = await database.query(
      `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, u.first_name || ' ' || u.last_name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN users u ON a.doctor_id = u.id
       WHERE date(a.appointment_date) >= date('now') 
       AND date(a.appointment_date) <= date(?)
       AND a.status != 'Cancelled'
       ORDER BY a.appointment_date ASC
       LIMIT 10`,
      [nextWeek]
    );

    console.log(`   ✓ Found ${upcoming.length} upcoming appointment(s):`);
    console.table(upcoming.map(a => ({
      appointment_id: a.appointment_id,
      patient: a.patient_name,
      doctor: a.doctor_name,
      date: a.appointment_date.split('T')[0],
      time: a.appointment_date.split('T')[1]?.substring(0, 5),
      queue: a.queue_number,
      status: a.status,
      type: a.appointment_type
    })));
    console.log();

    // Test 5: Clean up
    console.log('6️⃣ Cleaning up test data...');
    await database.run(
      'DELETE FROM appointments WHERE appointment_id = ?',
      [appointmentId]
    );
    console.log('   ✓ Test appointment deleted');
    console.log();

    console.log('✅ All appointment tests passed! Appointments are working correctly.');
    await database.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    await database.close();
    process.exit(1);
  }
}

testAppointmentFlow();
