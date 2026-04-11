const database = require('../../../lib/database');

export default async function handler(req, res) {
  const { id } = req.query; // patient_id

  try {
    // GET - Fetch single patient details
    if (req.method === 'GET') {
      const patient = await database.get(
        `SELECT * FROM patients WHERE patient_id = ?`,
        [id]
      );

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Get medical records for this patient
      const medicalRecords = await database.query(
        `SELECT * FROM medical_records WHERE patient_id = ? ORDER BY visit_date DESC`,
        [id]
      );

      // Get appointments for this patient
      const appointments = await database.query(
        `SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC`,
        [id]
      );

      // Get prescriptions for this patient
      const prescriptions = await database.query(
        `SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY prescription_date DESC`,
        [id]
      );

      // Get lab results for this patient
      const labResults = await database.query(
        `SELECT * FROM lab_results WHERE patient_id = ? ORDER BY test_date DESC`,
        [id]
      );

      return res.status(200).json({
        patient: patient,
        medical_records: medicalRecords,
        appointments,
        prescriptions,
        lab_results: labResults
      });
    }

    // PUT - Update patient details
    else if (req.method === 'PUT') {
      const data = req.body;

      // Check if patient exists
      const existing = await database.get(
        `SELECT * FROM patients WHERE patient_id = ?`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Build update query dynamically
      const fields = [];
      const values = [];

      const allowedFields = [
        'first_name', 'last_name', 'date_of_birth', 'gender',
        'phone', 'email', 'address', 'city', 'state', 'zip_code', 'country',
        'blood_type', 'allergies', 'medical_history',
        'emergency_contact_name', 'emergency_contact_phone',
        'insurance_provider', 'insurance_policy_number'
      ];

      allowedFields.forEach(field => {
        if (data.hasOwnProperty(field)) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      fields.push('updated_at = datetime("now")');
      values.push(id);

      const updateSql = `UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ?`;

      await database.run(updateSql, values);

      return res.status(200).json({ success: true, message: 'Patient updated successfully', patient_id: id });
    }

    // DELETE - Delete patient
    else if (req.method === 'DELETE') {
      const existing = await database.get(
        `SELECT * FROM patients WHERE patient_id = ?`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Delete related records first (cascade delete)
      await database.run(`DELETE FROM medical_records WHERE patient_id = ?`, [id]);
      await database.run(`DELETE FROM appointments WHERE patient_id = ?`, [id]);
      await database.run(`DELETE FROM prescriptions WHERE patient_id = ?`, [id]);
      await database.run(`DELETE FROM lab_results WHERE patient_id = ?`, [id]);

      // Delete patient
      await database.run(`DELETE FROM patients WHERE patient_id = ?`, [id]);

      return res.status(200).json({ success: true, message: 'Patient deleted successfully' });
    }

    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Patient API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
