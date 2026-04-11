const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get births statistics
    const birthsStats = await database.get(`
      SELECT 
        COUNT(*) as total_births,
        COUNT(CASE WHEN newborn_gender = 'Male' THEN 1 END) as male_births,
        COUNT(CASE WHEN newborn_gender = 'Female' THEN 1 END) as female_births,
        COUNT(CASE WHEN nicu_admission = 'Yes' THEN 1 END) as nicu_admissions,
        COUNT(CASE WHEN delivery_type LIKE '%LSCS%' THEN 1 END) as c_section_births,
        COUNT(CASE WHEN delivery_type LIKE '%Vaginal%' THEN 1 END) as vaginal_births,
        AVG(gestation_weeks) as avg_gestation_weeks,
        MIN(birth_date) as earliest_birth,
        MAX(birth_date) as latest_birth
      FROM births
    `);

    // Get deaths statistics
    const deathsStats = await database.get(`
      SELECT 
        COUNT(*) as total_deaths,
        COUNT(DISTINCT manner_of_death) as unique_manners,
        COUNT(CASE WHEN manner_of_death = 'Natural' THEN 1 END) as natural_deaths,
        COUNT(CASE WHEN manner_of_death = 'Accidental' THEN 1 END) as accidental_deaths,
        MIN(death_date) as earliest_death,
        MAX(death_date) as latest_death
      FROM deaths
    `);

    // Get monthly births trend (last 12 months)
    const monthlyBirths = await database.query(`
      SELECT 
        strftime('%Y-%m', birth_date) as month,
        COUNT(*) as births_count,
        COUNT(CASE WHEN newborn_gender = 'Male' THEN 1 END) as male_count,
        COUNT(CASE WHEN newborn_gender = 'Female' THEN 1 END) as female_count
      FROM births 
      WHERE birth_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', birth_date)
      ORDER BY month
    `);

    // Get monthly deaths trend (last 12 months)
    const monthlyDeaths = await database.query(`
      SELECT 
        strftime('%Y-%m', death_date) as month,
        COUNT(*) as deaths_count,
        GROUP_CONCAT(DISTINCT manner_of_death) as manners
      FROM deaths 
      WHERE death_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', death_date)
      ORDER BY month
    `);

    // Get top causes of death
    const topCauses = await database.query(`
      SELECT 
        cause_of_death,
        COUNT(*) as count,
        icd10_cause_code
      FROM deaths 
      GROUP BY cause_of_death 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Get delivery types distribution
    const deliveryTypes = await database.query(`
      SELECT 
        delivery_type,
        COUNT(*) as count
      FROM births 
      GROUP BY delivery_type 
      ORDER BY count DESC
    `);

    // Get complications statistics
    const complications = await database.query(`
      SELECT 
        complication,
        COUNT(*) as count,
        COUNT(CASE WHEN nicu_admission = 'Yes' THEN 1 END) as nicu_cases
      FROM births 
      WHERE complication IS NOT NULL AND complication != 'None'
      GROUP BY complication 
      ORDER BY count DESC
      LIMIT 10
    `);

    res.status(200).json({
      births: birthsStats,
      deaths: deathsStats,
      trends: {
        monthly_births: monthlyBirths,
        monthly_deaths: monthlyDeaths
      },
      analytics: {
        top_causes_of_death: topCauses,
        delivery_types: deliveryTypes,
        complications: complications
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
