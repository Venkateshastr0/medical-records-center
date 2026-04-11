const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get comprehensive patient statistics
    const patientStats = await database.get(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_patients,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_patients,
        COUNT(CASE WHEN date_of_birth >= date('now', '-18 years') THEN 1 END) as pediatric_patients,
        COUNT(CASE WHEN date_of_birth < date('now', '-65 years') THEN 1 END) as elderly_patients,
        COUNT(CASE WHEN blood_type IS NOT NULL THEN 1 END) as patients_with_blood_type,
        COUNT(CASE WHEN allergies IS NOT NULL AND allergies != '' THEN 1 END) as patients_with_allergies,
        COUNT(CASE WHEN insurance_provider IS NOT NULL AND insurance_provider != '' THEN 1 END) as patients_with_insurance,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_this_week,
        COUNT(CASE WHEN created_at >= date('now', '-1 days') THEN 1 END) as new_today
      FROM patients
    `);

    // Get recent registrations (last 30 days)
    const recentRegistrations = await database.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM patients 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Get blood type distribution
    const bloodTypeDistribution = await database.query(`
      SELECT 
        blood_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patients WHERE blood_type IS NOT NULL), 2) as percentage
      FROM patients 
      WHERE blood_type IS NOT NULL
      GROUP BY blood_type 
      ORDER BY count DESC
    `);

    // Get age distribution
    const ageDistribution = await database.query(`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(date_of_birth) / 365.25 < 1 THEN 'Infant (<1)'
          WHEN julianday('now') - julianday(date_of_birth) / 365.25 < 18 THEN 'Child (1-17)'
          WHEN julianday('now') - julianday(date_of_birth) / 365.25 < 40 THEN 'Adult (18-39)'
          WHEN julianday('now') - julianday(date_of_birth) / 365.25 < 65 THEN 'Middle Age (40-64)'
          ELSE 'Elderly (65+)'
        END as age_group,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patients), 2) as percentage
      FROM patients 
      GROUP BY age_group 
      ORDER BY 
        CASE age_group
          WHEN 'Infant (<1)' THEN 1
          WHEN 'Child (1-17)' THEN 2
          WHEN 'Adult (18-39)' THEN 3
          WHEN 'Middle Age (40-64)' THEN 4
          WHEN 'Elderly (65+)' THEN 5
        END
    `);

    // Get top cities
    const topCities = await database.query(`
      SELECT 
        city,
        COUNT(*) as count
      FROM patients 
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get insurance providers
    const insuranceProviders = await database.query(`
      SELECT 
        insurance_provider,
        COUNT(*) as count
      FROM patients 
      WHERE insurance_provider IS NOT NULL AND insurance_provider != ''
      GROUP BY insurance_provider 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get patients with recent activity
    const recentActivity = await database.get(`
      SELECT 
        COUNT(DISTINCT p.patient_id) as patients_with_recent_visits
      FROM patients p
      JOIN medical_records mr ON p.patient_id = mr.patient_id
      WHERE mr.visit_date >= date('now', '-30 days')
    `);

    // Get patients without recent visits
    const inactivePatients = await database.get(`
      SELECT 
        COUNT(DISTINCT p.patient_id) as inactive_patients
      FROM patients p
      LEFT JOIN medical_records mr ON p.patient_id = mr.patient_id
      WHERE (mr.visit_date < date('now', '-1 year') OR mr.visit_date IS NULL)
        AND p.created_at < date('now', '-1 year')
    `);

    res.status(200).json({
      overview: patientStats,
      recent_registrations: recentRegistrations,
      demographics: {
        blood_types: bloodTypeDistribution,
        age_groups: ageDistribution,
        cities: topCities
      },
      insurance: insuranceProviders,
      activity: {
        with_recent_visits: recentActivity.patients_with_recent_visits,
        inactive_patients: inactivePatients.inactive_patients
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching patient overview:', error);
    res.status(500).json({ error: 'Failed to fetch patient overview' });
  }
}
