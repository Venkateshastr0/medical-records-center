const database = require('../../../lib/database');

// Valid appointment types
const appointmentTypes = [
  "Consultation",
  "Follow-up", 
  "Urgent Care",
  "Vaccination",
  "Procedure"
];

// Context-specific field validation rules
const validationRules = {
  "Consultation": {
    required: ["reason_for_visit"],
    optional: ["notes"]
  },
  "Follow-up": {
    required: ["previous_visit_id"],
    optional: ["progress_notes", "last_prescription"]
  },
  "Urgent Care": {
    required: ["urgency_description"],
    optional: ["severity_level"]
  },
  "Vaccination": {
    required: ["vaccine_name", "dose_number"],
    optional: ["notes"]
  },
  "Procedure": {
    required: ["procedure_name"],
    optional: ["preparation_instructions", "notes"]
  }
};

function validateAppointmentData(appointment_type, extra_data = {}) {
  const rules = validationRules[appointment_type];
  if (!rules) {
    throw new Error(`No validation rules found for appointment type: ${appointment_type}`);
  }

  const errors = [];
  
  // Check required fields
  for (const field of rules.required) {
    if (!extra_data[field] || extra_data[field].toString().trim() === '') {
      errors.push(`${field} is required for ${appointment_type} appointments`);
    }
  }

  // Validate field formats
  if (appointment_type === "Follow-up" && extra_data.previous_visit_id) {
    const visitId = extra_data.previous_visit_id;
    if (isNaN(visitId) || parseInt(visitId) <= 0) {
      errors.push("Previous visit ID must be a positive number");
    }
  }

  if (appointment_type === "Vaccination" && extra_data.dose_number) {
    const doseNum = extra_data.dose_number;
    if (isNaN(doseNum) || parseInt(doseNum) < 1) {
      errors.push("Dose number must be a positive number");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return true;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { date, status, doctor_id } = req.query;
      let sql = `
        SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, u.first_name || ' ' || u.last_name as doctor_name,
               ROW_NUMBER() OVER (PARTITION BY a.doctor_id, date(a.appointment_date) 
                                 ORDER BY a.appointment_date ASC, a.appointment_id ASC) as display_queue_number
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.id
        WHERE 1=1
      `;
      let params = [];

      if (doctor_id) {
        sql += ' AND a.doctor_id = ?';
        params.push(doctor_id);
      }

      if (date) {
        sql += ' AND date(a.appointment_date) = date(?)';
        params.push(date);
      } else {
        // Default to today's and future appointments
        sql += ' AND date(a.appointment_date) >= date(\'now\')';
      }

      // Only show unprocessed patients in queue (exclude those who got prescriptions)
      if (doctor_id) {
        sql += ' AND (a.queue_processed = 0 OR a.queue_processed IS NULL)';
      }

      sql += ' ORDER BY a.appointment_date ASC, a.queue_number ASC';

      const appointments = await database.query(sql, params);

      // Parse triage_vitals and extra_data if they exist
      const formatted = appointments.map(a => ({
        ...a,
        triage_vitals: a.triage_vitals ? JSON.parse(a.triage_vitals) : null,
        extra_data: a.extra_data ? JSON.parse(a.extra_data) : {},
        // Use display_queue_number for unprocessed patients, original queue_number for others
        queue_number: (doctor_id && (a.queue_processed === 0 || a.queue_processed === null)) ? a.display_queue_number : a.queue_number
      }));

      return res.status(200).json({ data: formatted });

    } else if (req.method === 'POST') {
      const { 
        patient_id, 
        doctor_id, 
        appointment_date, 
        triage_vitals, 
        appointment_type, 
        duration_minutes, 
        notes,
        extra_data = {}
      } = req.body;

      // Validate required fields
      if (!patient_id || !doctor_id || !appointment_date) {
        return res.status(400).json({ error: 'Missing required fields: patient_id, doctor_id, appointment_date' });
      }

      // Validate and normalize appointment type
      if (!appointment_type) {
        return res.status(400).json({ error: 'Appointment type is required' });
      }

      const normalizedType = appointment_type.trim();
      if (!appointmentTypes.includes(normalizedType)) {
        return res.status(400).json({ 
          error: `Invalid appointment type: ${normalizedType}. Valid types are: ${appointmentTypes.join(', ')}` 
        });
      }

      // Validate context-specific fields
      try {
        validateAppointmentData(normalizedType, extra_data);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }

      // Verify patient exists
      const patient = await database.get('SELECT * FROM patients WHERE patient_id = ?', [patient_id]);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Verify doctor exists
      const doctor = await database.get('SELECT * FROM users WHERE id = ? AND role = ?', [doctor_id, 'doctor']);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found or invalid role' });
      }

      // Calculate Queue Number for the same doctor on the appointment date
      const queueResult = await database.get(
        'SELECT COUNT(*) as count FROM appointments WHERE date(appointment_date) = date(?) AND doctor_id = ? AND status != ?',
        [appointment_date, doctor_id, 'Cancelled']
      );
      const queue_number = (queueResult?.count || 0) + 1;

      const appointment_id = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Prepare extra_data JSON
      const cleanExtraData = {};
      
      // Only include fields that are defined in validation rules
      const allowedFields = [
        ...(validationRules[normalizedType]?.required || []),
        ...(validationRules[normalizedType]?.optional || [])
      ];
      
      for (const field of allowedFields) {
        if (extra_data[field] !== undefined && extra_data[field] !== null) {
          cleanExtraData[field] = extra_data[field];
        }
      }

      // Insert appointment
      await database.run(
        `INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, appointment_date, 
          queue_number, triage_vitals, status, appointment_type, duration_minutes, notes, extra_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          queue_number,
          JSON.stringify(triage_vitals || {}),
          'Scheduled',
          normalizedType,
          duration_minutes || 30,
          notes || '',
          JSON.stringify(cleanExtraData)
        ]
      );

      return res.status(201).json({ 
        success: true,
        message: 'Appointment scheduled successfully',
        appointment_id,
        queue_number,
        appointment_type: normalizedType,
        extra_data: cleanExtraData
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Appointments API Error:', error);
    return res.status(500).json({ error: 'Failed to process appointment: ' + error.message });
  }
}
