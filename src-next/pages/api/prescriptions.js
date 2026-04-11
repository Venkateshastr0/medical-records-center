const database = require('../../lib/database');

// Helper function to mark patient as processed in queue
async function markPatientProcessed(patientId, doctorId) {
  try {
    // Find the appointment for this patient and doctor today
    const appointment = await database.get(`
      SELECT appointment_id FROM appointments 
      WHERE patient_id = ? 
        AND doctor_id = ? 
        AND date(appointment_date) = date('now')
        AND queue_processed = 0
      ORDER BY appointment_date ASC 
      LIMIT 1
    `, [patientId, doctorId]);
    
    if (appointment) {
      await database.run(`
        UPDATE appointments 
        SET queue_processed = 1, queue_processed_at = datetime('now')
        WHERE appointment_id = ?
      `, [appointment.appointment_id]);
      
      console.log(`✅ Patient marked as processed in queue: ${appointment.appointment_id}`);
    }
  } catch (error) {
    console.error('❌ Failed to mark patient as processed:', error);
    // Don't throw error - prescription should still succeed even if queue update fails
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { patient_id, status, auto_clear_old } = req.query;
      
      // If auto_clear_old is true, mark all prescriptions older than 24hrs as Discontinued
      if (auto_clear_old === 'true') {
        const clearOldSql = `
          UPDATE prescriptions 
          SET status = 'Discontinued', updated_at = CURRENT_TIMESTAMP
          WHERE status = 'Active' 
          AND datetime(prescription_date) < datetime('now', '-24 hours')
        `;
        await database.run(clearOldSql);
        console.log('Auto-cleared prescriptions older than 24 hours');
      }
      
      let sql = `SELECT p.*,
                        CASE 
                          WHEN pat.first_name IS NOT NULL AND pat.last_name IS NOT NULL 
                          THEN pat.first_name || ' ' || pat.last_name
                          WHEN pat.first_name IS NOT NULL THEN pat.first_name
                          WHEN pat.last_name IS NOT NULL THEN pat.last_name
                          ELSE 'Unknown Patient'
                        END as patient_name,
                        CASE 
                          WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
                          THEN u.first_name || ' ' || u.last_name
                          WHEN u.first_name IS NOT NULL THEN u.first_name
                          WHEN u.last_name IS NOT NULL THEN u.last_name
                          ELSE 'Unknown Doctor'
                        END as doctor_name
                 FROM prescriptions p
                 LEFT JOIN patients pat ON p.patient_id = pat.patient_id
                 LEFT JOIN users u ON p.doctor_id = u.id
                 WHERE 1=1`;
      let params = [];
      
      if (patient_id) {
        sql += ' AND p.patient_id = ?';
        params.push(patient_id);
      }
      
      if (status) {
        sql += ' AND p.status = ?';
        params.push(status);
      }
      
      sql += ' ORDER BY p.prescription_date DESC';
      
      const prescriptions = await database.query(sql, params);
      res.status(200).json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        patient_id, 
        doctor_id, 
        medication_name, 
        dosage, 
        frequency, 
        route, 
        duration, 
        instructions
      } = req.body;
      
      // Validate and parse doctor_id to integer
      const parsedDoctorId = parseInt(doctor_id, 10);
      
      console.log('Prescription request body:', req.body);
      console.log('Extracted fields:', { 
        patient_id, 
        doctor_id: parsedDoctorId, 
        medication_name, 
        dosage, 
        frequency, 
        route, 
        duration, 
        instructions
      });
      
      if (!patient_id || !parsedDoctorId || !medication_name) {
        const missingFields = [];
        if (!patient_id) missingFields.push('patient_id');
        if (!parsedDoctorId) missingFields.push('doctor_id');
        if (!medication_name) missingFields.push('medication_name');
        console.log('Missing fields:', missingFields);
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: { patient_id, doctor_id, medication_name }
        });
      }
      
      const prescription_id = 'RX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const prescription_date = new Date().toISOString().split('T')[0];
      
      console.log('Creating prescription:', {
        prescription_id,
        patient_id,
        doctor_id,
        medication_name,
        dosage,
        frequency,
        route,
        duration,
        instructions,
        prescription_date,
        status: 'Active'
      });
      
      await database.run(
        `INSERT INTO prescriptions 
          (prescription_id, patient_id, doctor_id, medication_name, dosage, frequency, route, duration, instructions, prescription_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prescription_id, patient_id, parsedDoctorId, medication_name, dosage, frequency, route, duration, instructions, prescription_date, 'Active']
      );
      
      console.log('Prescription created successfully:', prescription_id);
      
      // Mark patient as processed in queue (remove from queue display)
      await markPatientProcessed(patient_id, parsedDoctorId);
      
      res.status(201).json({ id: prescription_id, message: 'Prescription created successfully' });
    } catch (error) {
      console.error('Prescription creation error:', error);
      res.status(500).json({ error: 'Failed to create prescription', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
