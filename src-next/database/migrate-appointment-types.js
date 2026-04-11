const database = require('../lib/database');

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');

    // Add extra_data column to appointments table
    try {
      await database.run(`
        ALTER TABLE appointments 
        ADD COLUMN extra_data TEXT
      `);
      console.log('✅ Added extra_data column to appointments table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ extra_data column already exists');
      } else {
        throw error;
      }
    }

    // Update the CHECK constraint for appointment types
    // Since SQLite doesn't support ALTER CONSTRAINT, we need to recreate the table
    console.log('🔄 Updating appointment types constraint...');
    
    // First, create a backup of existing appointments
    const appointments = await database.query('SELECT * FROM appointments');
    console.log(`📋 Backed up ${appointments.length} appointments`);

    // Drop and recreate the appointments table with new schema
    await database.run('DROP TABLE IF EXISTS appointments');
    
    await database.run(`
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id VARCHAR(20) UNIQUE NOT NULL,
        patient_id VARCHAR(20) NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        appointment_type VARCHAR(50) CHECK (appointment_type IN ('Consultation', 'Follow-up', 'Urgent Care', 'Vaccination', 'Procedure')),
        status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show')),
        queue_number INTEGER,
        triage_vitals TEXT,
        notes TEXT,
        extra_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
      )
    `);

    // Restore the appointments with updated appointment types
    for (const appt of appointments) {
      // Map old appointment types to new ones
      let newAppointmentType = appt.appointment_type;
      const typeMapping = {
        'CONSULTATION': 'Consultation',
        'FOLLOW_UP': 'Follow-up',
        'EMERGENCY': 'Urgent Care',
        'SURGERY': 'Procedure',
        'LAB_TEST': 'Procedure',
        'IMAGING': 'Procedure',
        'VACCINATION': 'Vaccination',
        'Routine Checkup': 'Consultation',
        'Follow-up Visit': 'Follow-up',
        'Urgent Care': 'Urgent Care',
        'Specialist Consultation': 'Consultation',
        'Lab Test': 'Procedure',
        'Imaging': 'Procedure',
        'Procedure': 'Procedure',
        'Vaccination': 'Vaccination'
      };
      
      newAppointmentType = typeMapping[appt.appointment_type] || 'Consultation';
      
      await database.run(`
        INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, appointment_date, 
          duration_minutes, appointment_type, status, queue_number, 
          triage_vitals, notes, extra_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appt.appointment_id,
        appt.patient_id,
        appt.doctor_id,
        appt.appointment_date,
        appt.duration_minutes,
        newAppointmentType,
        appt.status,
        appt.queue_number,
        appt.triage_vitals,
        appt.notes,
        appt.extra_data || '{}',
        appt.created_at,
        appt.updated_at
      ]);
    }

    console.log('✅ Database migration completed successfully!');
    console.log(`📊 Restored ${appointments.length} appointments with updated types`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
