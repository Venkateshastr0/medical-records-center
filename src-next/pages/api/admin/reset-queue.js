const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method === 'POST') {
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
        SELECT appointment_id, doctor_id
        FROM appointments 
        WHERE date(appointment_date) = date('now') 
          AND status != 'Cancelled'
        ORDER BY doctor_id, appointment_date ASC, appointment_id ASC
      `);
      
      // Update queue numbers by doctor
      const appointmentsByDoctor = {};
      todayAppointments.forEach(appt => {
        if (!appointmentsByDoctor[appt.doctor_id]) {
          appointmentsByDoctor[appt.doctor_id] = [];
        }
        appointmentsByDoctor[appt.doctor_id].push(appt.appointment_id);
      });
      
      for (const doctorId in appointmentsByDoctor) {
        const appointments = appointmentsByDoctor[doctorId];
        for (let i = 0; i < appointments.length; i++) {
          await database.run(`
            UPDATE appointments 
            SET queue_number = ? 
            WHERE appointment_id = ?
          `, [i + 1, appointments[i]]);
        }
      }
      
      console.log(`✅ Queue reset completed. Updated ${todayAppointments.length} appointments.`);
      
      res.status(200).json({ 
        success: true, 
        message: 'Daily queue reset completed',
        updatedAppointments: todayAppointments.length
      });
      
    } catch (error) {
      console.error('❌ Queue reset failed:', error);
      res.status(500).json({ error: 'Failed to reset queue: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
