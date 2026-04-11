const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get medical records statistics
    const recordsStats = await database.get(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(DISTINCT doctor_id) as unique_doctors,
        COUNT(CASE WHEN visit_date >= date('now', '-30 days') THEN 1 END) as last_30_days,
        COUNT(CASE WHEN visit_date >= date('now', '-7 days') THEN 1 END) as last_7_days,
        MIN(visit_date) as earliest_record,
        MAX(visit_date) as latest_record
      FROM medical_records
    `);

    // Get records by month (last 12 months)
    const monthlyRecords = await database.query(`
      SELECT 
        strftime('%Y-%m', visit_date) as month,
        COUNT(*) as records_count,
        COUNT(DISTINCT patient_id) as unique_patients
      FROM medical_records 
      WHERE visit_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', visit_date)
      ORDER BY month
    `);

    // Get top diagnosis patterns
    const topDiagnoses = await database.query(`
      SELECT 
        diagnosis_codes,
        COUNT(*) as count
      FROM medical_records 
      WHERE diagnosis_codes IS NOT NULL AND diagnosis_codes != ''
      GROUP BY diagnosis_codes 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get doctor activity
    const doctorActivity = await database.query(`
      SELECT 
        u.first_name || ' ' || u.last_name as doctor_name,
        COUNT(*) as records_count,
        COUNT(DISTINCT mr.patient_id) as unique_patients,
        MAX(mr.visit_date) as last_visit
      FROM medical_records mr
      JOIN users u ON mr.doctor_id = u.id
      GROUP BY mr.doctor_id, u.first_name, u.last_name
      ORDER BY records_count DESC
      LIMIT 10
    `);

    // Get appointment statistics
    const appointmentStats = await database.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'No-Show' THEN 1 END) as no_show,
        COUNT(CASE WHEN appointment_date >= date('now', '-7 days') THEN 1 END) as this_week,
        COUNT(CASE WHEN appointment_date >= date('now', '-30 days') THEN 1 END) as this_month
      FROM appointments
    `);

    // Get appointments by type
    const appointmentTypes = await database.query(`
      SELECT 
        appointment_type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed
      FROM appointments 
      GROUP BY appointment_type 
      ORDER BY count DESC
    `);

    // Get prescription statistics
    const prescriptionStats = await database.get(`
      SELECT 
        COUNT(*) as total_prescriptions,
        COUNT(CASE WHEN status = 'dispensed' THEN 1 END) as dispensed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN urgency = 'high' THEN 1 END) as high_priority
      FROM prescriptions
    `);

    // Get top medications
    const topMedications = await database.query(`
      SELECT 
        medication_name,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'dispensed' THEN 1 END) as dispensed
      FROM prescriptions 
      GROUP BY medication_name 
      ORDER BY count DESC
      LIMIT 10
    `);

    res.status(200).json({
      medical_records: {
        overview: recordsStats,
        monthly_trends: monthlyRecords,
        top_diagnoses: topDiagnoses,
        doctor_activity: doctorActivity
      },
      appointments: {
        overview: appointmentStats,
        by_type: appointmentTypes
      },
      prescriptions: {
        overview: prescriptionStats,
        top_medications: topMedications
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching medical statistics:', error);
    res.status(500).json({ error: 'Failed to fetch medical statistics' });
  }
}
