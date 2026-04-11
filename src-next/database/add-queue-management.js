const database = require('../lib/database');

async function addQueueManagementFields() {
  try {
    console.log('🔄 Adding queue management fields...');

    // Add queue_processed column to appointments table
    try {
      await database.run(`
        ALTER TABLE appointments 
        ADD COLUMN queue_processed BOOLEAN DEFAULT 0
      `);
      console.log('✅ Added queue_processed column to appointments table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ queue_processed column already exists');
      } else {
        throw error;
      }
    }

    // Add queue_processed_at column to track when patient was processed
    try {
      await database.run(`
        ALTER TABLE appointments 
        ADD COLUMN queue_processed_at DATETIME
      `);
      console.log('✅ Added queue_processed_at column to appointments table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ queue_processed_at column already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Queue management fields added successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to reset queue numbers at midnight
async function resetDailyQueue() {
  try {
    console.log('🔄 Resetting daily queue numbers...');
    
    // Reset queue_processed flag for all appointments (for new day)
    await database.run(`
      UPDATE appointments 
      SET queue_processed = 0, queue_processed_at = NULL 
      WHERE date(appointment_date) = date('now')
    `);
    
    // Recalculate queue numbers for today's appointments
    const todayAppointments = await database.query(`
      SELECT appointment_id, doctor_id, patient_id, appointment_date,
             ROW_NUMBER() OVER (PARTITION BY doctor_id, date(appointment_date) 
                               ORDER BY appointment_date ASC, appointment_id ASC) as new_queue_number
      FROM appointments 
      WHERE date(appointment_date) = date('now') 
        AND status != 'Cancelled'
    `);
    
    // Update queue numbers
    for (const appt of todayAppointments) {
      await database.run(`
        UPDATE appointments 
        SET queue_number = ? 
        WHERE appointment_id = ?
      `, [appt.new_queue_number, appt.appointment_id]);
    }
    
    console.log(`✅ Queue reset completed. Updated ${todayAppointments.length} appointments.`);
    
  } catch (error) {
    console.error('❌ Queue reset failed:', error);
    throw error;
  }
}

// Function to mark patient as processed (when prescription is transmitted)
async function markPatientProcessed(appointmentId) {
  try {
    await database.run(`
      UPDATE appointments 
      SET queue_processed = 1, queue_processed_at = datetime('now')
      WHERE appointment_id = ?
    `, [appointmentId]);
    
    console.log(`✅ Patient marked as processed: ${appointmentId}`);
  } catch (error) {
    console.error('❌ Failed to mark patient as processed:', error);
    throw error;
  }
}

// Function to get current queue (excluding processed patients)
async function getCurrentQueue(doctorId) {
  try {
    const queue = await database.query(`
      SELECT a.*, p.first_name || ' ' || p.last_name as patient_name,
             ROW_NUMBER() OVER (ORDER BY a.appointment_date ASC, a.appointment_id ASC) as display_queue_number
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = ? 
        AND date(a.appointment_date) = date('now')
        AND a.status != 'Cancelled'
        AND a.queue_processed = 0
      ORDER BY a.appointment_date ASC, a.appointment_id ASC
    `, [doctorId]);
    
    return queue;
  } catch (error) {
    console.error('❌ Failed to get current queue:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addQueueManagementFields()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  addQueueManagementFields, 
  resetDailyQueue, 
  markPatientProcessed, 
  getCurrentQueue 
};
