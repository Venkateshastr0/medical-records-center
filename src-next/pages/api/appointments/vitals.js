const database = require('../../../lib/database');

export default async function handler(req, res) {
  try {
    const { appointmentId } = req.query;
    const { method } = req;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    if (method === 'PUT') {
      const { triage_vitals } = req.body;
      
      if (!triage_vitals) {
        return res.status(400).json({ error: 'Vitals data is required' });
      }

      // Validate vital signs data
      const validVitals = {};
      const allowedFields = ['bp', 'sugar', 'weight', 'temp', 'height', 'heart_rate', 'oxygen_saturation'];
      
      for (const field of allowedFields) {
        if (triage_vitals[field] !== undefined && triage_vitals[field] !== null) {
          validVitals[field] = triage_vitals[field];
        }
      }

      // Update the appointment's triage_vitals
      await database.run(
        'UPDATE appointments SET triage_vitals = ?, updated_at = datetime(\'now\') WHERE appointment_id = ?',
        [JSON.stringify(validVitals), appointmentId]
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Vital signs updated successfully',
        triage_vitals: validVitals
      });

    } else if (method === 'GET') {
      // Get current vital signs for an appointment
      const appointment = await database.get(
        'SELECT triage_vitals FROM appointments WHERE appointment_id = ?',
        [appointmentId]
      );

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const triage_vitals = appointment.triage_vitals ? JSON.parse(appointment.triage_vitals) : {};

      return res.status(200).json({ 
        success: true,
        triage_vitals
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Vitals API Error:', error);
    return res.status(500).json({ error: 'Failed to process vital signs: ' + error.message });
  }
}
