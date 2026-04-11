const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { q, doctor_id } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    let queuePatient = null;
    
    // Check if query is just a queue number (e.g., '1', '2') and we have a doctor_id
    if (/^\d{1,3}$/.test(q) && doctor_id) {
       const apptSql = `
         SELECT p.patient_id, p.id, p.first_name, p.last_name, p.phone, p.date_of_birth, p.gender, 'QUEUE #' || a.queue_number as context
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE date(a.appointment_date) = date('now')
         AND a.doctor_id = ?
         AND a.queue_number = ?
         LIMIT 1
       `;
       const queueResult = await database.query(apptSql, [doctor_id, parseInt(q)]);
       if (queueResult && queueResult.length > 0) {
           queuePatient = queueResult[0];
       }
    }

    const sql = `
      SELECT patient_id, id, first_name, last_name, phone, date_of_birth, gender 
      FROM patients 
      WHERE first_name LIKE ? 
         OR last_name LIKE ? 
         OR phone LIKE ? 
         OR patient_id LIKE ?
      LIMIT 10
    `;
    const params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
    const patients = await database.query(sql, params);
    
    // If we matched a queue number, inject it to the top of the search results
    if (queuePatient) {
       // Remove duplicates
       const filtered = patients.filter(p => p.id !== queuePatient.id);
       res.status(200).json([queuePatient, ...filtered]);
    } else {
       res.status(200).json(patients);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
