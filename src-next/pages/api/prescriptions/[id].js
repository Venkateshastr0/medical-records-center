const database = require('../../../lib/database');

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Prescription ID is required' });
      }

      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      // Validate status
      const validStatuses = ['Active', 'Completed', 'Discontinued'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      console.log(`Updating prescription ${id} to status: ${status}`);

      // Update prescription status
      const result = await database.run(
        `UPDATE prescriptions 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, id]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Prescription not found' });
      }

      // Get updated prescription
      const prescription = await database.get(
        `SELECT p.*,
                CASE 
                  WHEN pat.first_name IS NOT NULL AND pat.last_name IS NOT NULL 
                  THEN pat.first_name || ' ' || pat.last_name
                  WHEN pat.first_name IS NOT NULL THEN pat.first_name
                  WHEN pat.last_name IS NOT NULL THEN pat.last_name
                  ELSE 'Unknown Patient'
                END as patient_name
         FROM prescriptions p
         LEFT JOIN patients pat ON p.patient_id = pat.patient_id
         WHERE p.id = ?`,
        [id]
      );

      console.log(`Prescription ${id} successfully updated to status: ${status}`);
      
      res.status(200).json({
        message: `Prescription marked as ${status}`,
        prescription
      });

    } catch (error) {
      console.error('Prescription update error:', error);
      res.status(500).json({ error: 'Failed to update prescription', details: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      if (!id) {
        return res.status(400).json({ error: 'Prescription ID is required' });
      }

      const prescription = await database.get(
        `SELECT p.*,
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
         WHERE p.id = ?`,
        [id]
      );

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found' });
      }

      res.status(200).json(prescription);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
