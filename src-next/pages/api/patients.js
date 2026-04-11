const database = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      let { page = 1, limit = 10, search = '' } = req.query;

      let pageNum = parseInt(page);
      let limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
      if (isNaN(limitNum) || limitNum > 100) limitNum = 10;

      const offset = (pageNum - 1) * limitNum;

      let baseQuery = `
        FROM patients p
        LEFT JOIN (
          SELECT mr1.*
          FROM medical_records mr1
          INNER JOIN (
            SELECT patient_id, MAX(visit_date) as max_date
            FROM medical_records
            GROUP BY patient_id
          ) mr2
          ON mr1.patient_id = mr2.patient_id 
          AND mr1.visit_date = mr2.max_date
        ) mr ON p.patient_id = mr.patient_id
        WHERE 1=1
      `;

      const params = [];

      if (search) {
        baseQuery += `
          AND (
            LOWER(p.first_name) LIKE LOWER(?) OR
            LOWER(p.last_name) LIKE LOWER(?) OR
            LOWER(p.patient_id) LIKE LOWER(?)
          )
        `;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const countResult = await database.get(
        `SELECT COUNT(*) as total ${baseQuery}`,
        params
      );

      const patients = await database.query(
        `
        SELECT 
          p.*,
          mr.record_id,
          mr.visit_date,
          mr.chief_complaint
        ${baseQuery}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limitNum, offset]
      );

      const today = new Date();

      const processedPatients = patients.map((patient) => {
        let age = null;
        let status = 'New';

        if (patient.date_of_birth) {
          const birthDate = new Date(patient.date_of_birth);
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();

          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }

          age = calculatedAge;
        }

        if (patient.visit_date) {
          const daysSinceVisit = Math.floor(
            (today - new Date(patient.visit_date)) / (24 * 60 * 60 * 1000)
          );

          if (daysSinceVisit <= 7) status = 'Active';
          else if (daysSinceVisit <= 30) status = 'Scheduled';
          else status = 'Inactive';
        }

        return {
          ...patient,
          id: patient.patient_id,
          age,
          status,
          recent_record: patient.record_id
            ? {
                record_id: patient.record_id,
                visit_date: patient.visit_date,
                chief_complaint: patient.chief_complaint
              }
            : null
        };
      });

      const stats = await database.get(`
        SELECT 
          COUNT(*) as total_patients,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_patients,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_patients,
          COUNT(CASE WHEN date_of_birth >= date('now', '-18 years') THEN 1 END) as age_0_18,
          COUNT(CASE WHEN date_of_birth < date('now', '-18 years') AND date_of_birth >= date('now', '-35 years') THEN 1 END) as age_19_35,
          COUNT(CASE WHEN date_of_birth < date('now', '-35 years') AND date_of_birth >= date('now', '-60 years') THEN 1 END) as age_36_60,
          COUNT(CASE WHEN date_of_birth < date('now', '-60 years') THEN 1 END) as age_60_plus,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month
        FROM patients
      `);

      res.status(200).json({
        data: processedPatients,
        stats: {
          total_patients: stats.total_patients,
          total_records: stats.total_patients,
          pending_appointments: 0,
          new_this_month: stats.new_this_month,
          age_0_18: stats.age_0_18,
          age_19_35: stats.age_19_35,
          age_36_60: stats.age_36_60,
          age_60_plus: stats.age_60_plus
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limitNum)
        },
        filters: { search }
      });

    } catch (error) {
      console.error({
        message: 'Error fetching patients',
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to fetch patients'
      });
    }
  }

  // 👉 POST (Create Patient)
  else if (req.method === 'POST') {
    try {
      const data = req.body;

      if (!data.first_name || !data.last_name || !data.date_of_birth || !data.gender) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate unique patient_id
      const patientId = 'PAT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      const result = await database.run(
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
          patientId,
          data.first_name,
          data.last_name,
          data.date_of_birth,
          data.gender,
          data.phone || null,
          data.email || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.zip_code || null,
          data.country || null,
          data.blood_type || null,
          data.allergies || null,
          data.medical_history || null,
          data.emergency_contact_name || null,
          data.emergency_contact_phone || null,
          data.insurance_provider || null,
          data.insurance_policy_number || null
        ]
      );

      res.status(201).json({ success: true, patient_id: patientId });

    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient: ' + error.message });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}