const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get overall patient statistics
    const patientStats = await database.get(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_patients,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_patients,
        COUNT(CASE WHEN date_of_birth >= date('now', '-18 years') THEN 1 END) as pediatric_patients,
        COUNT(CASE WHEN date_of_birth < date('now', '-65 years') THEN 1 END) as elderly_patients,
        COUNT(CASE WHEN blood_type IS NOT NULL THEN 1 END) as patients_with_blood_type,
        COUNT(CASE WHEN allergies IS NOT NULL AND allergies != '' THEN 1 END) as patients_with_allergies,
        AVG(julianday('now') - julianday(date_of_birth)) / 365.25 as avg_age
      FROM patients
    `);

    // Get patients by blood type
    const bloodTypes = await database.query(`
      SELECT 
        blood_type,
        COUNT(*) as count
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
        COUNT(*) as count
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

    // Get recent patient registrations (last 6 months)
    const recentRegistrations = await database.query(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as new_patients
      FROM patients 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);

    // Get patients with insurance
    const insuranceStats = await database.get(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN insurance_provider IS NOT NULL AND insurance_provider != '' THEN 1 END) as patients_with_insurance,
        COUNT(CASE WHEN insurance_policy_number IS NOT NULL AND insurance_policy_number != '' THEN 1 END) as patients_with_policy_number
      FROM patients
    `);

    // Get top insurance providers
    const topProviders = await database.query(`
      SELECT 
        insurance_provider,
        COUNT(*) as count
      FROM patients 
      WHERE insurance_provider IS NOT NULL AND insurance_provider != ''
      GROUP BY insurance_provider 
      ORDER BY count DESC
      LIMIT 10
    `);

    res.status(200).json({
      overview: patientStats,
      demographics: {
        blood_types: bloodTypes,
        age_distribution: ageDistribution
      },
      insurance: {
        ...insuranceStats,
        top_providers: topProviders
      },
      trends: {
        recent_registrations: recentRegistrations
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    res.status(500).json({ error: 'Failed to fetch patient statistics' });
  }
}
