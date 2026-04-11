const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get comprehensive dashboard statistics
    const [
      // Patient statistics
      patientStats,
      // Medical records statistics
      recordsStats,
      // Appointments statistics
      appointmentsStats,
      // Births and deaths statistics
      birthsDeathsStats,
      // Prescriptions statistics
      prescriptionsStats,
      // Users statistics
      usersStats,
      // Recent activity
      recentActivity
    ] = await Promise.all([
      // Patient stats
      database.get(`
        SELECT 
          COUNT(*) as total_patients,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_patients,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_patients,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month,
          COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= date('now', '-1 days') THEN 1 END) as new_today
        FROM patients
      `),
      
      // Medical records stats
      database.get(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT patient_id) as patients_with_records,
          COUNT(CASE WHEN visit_date >= date('now', '-30 days') THEN 1 END) as records_this_month,
          COUNT(CASE WHEN visit_date >= date('now', '-7 days') THEN 1 END) as records_this_week,
          COUNT(CASE WHEN visit_date >= date('now', '-1 days') THEN 1 END) as records_today
        FROM medical_records
      `),
      
      // Appointments stats
      database.get(`
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN appointment_date >= date('now') THEN 1 END) as upcoming,
          COUNT(CASE WHEN date(appointment_date) = date('now') THEN 1 END) as today,
          COUNT(CASE WHEN appointment_date < date('now') AND status = 'Scheduled' THEN 1 END) as overdue
        FROM appointments
      `),
      
      // Births and deaths stats
      database.get(`
        SELECT 
          (SELECT COUNT(*) FROM births) as total_births,
          (SELECT COUNT(*) FROM deaths) as total_deaths,
          (SELECT COUNT(*) FROM births WHERE birth_date >= date('now', '-30 days')) as births_this_month,
          (SELECT COUNT(*) FROM deaths WHERE death_date >= date('now', '-30 days')) as deaths_this_month
      `),
      
      // Prescriptions stats
      database.get(`
        SELECT 
          COUNT(*) as total_prescriptions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'dispensed' THEN 1 END) as dispensed,
          COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical,
          COUNT(CASE WHEN urgency = 'high' THEN 1 END) as high_priority
        FROM prescriptions
      `),
      
      // Users stats
      database.get(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
          COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week,
          COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctors,
          COUNT(CASE WHEN role = 'nurse' THEN 1 END) as nurses,
          COUNT(CASE WHEN role = 'receptionist' THEN 1 END) as receptionists,
          COUNT(CASE WHEN role = 'pharmacy' THEN 1 END) as pharmacy,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
        FROM users
      `),
      
      // Recent activity summary
      database.get(`
        SELECT 
          (SELECT COUNT(*) FROM patients WHERE created_at >= date('now', '-1 days')) as new_patients_today,
          (SELECT COUNT(*) FROM medical_records WHERE visit_date >= date('now', '-1 days')) as records_today,
          (SELECT COUNT(*) FROM appointments WHERE date(appointment_date) = date('now')) as appointments_today,
          (SELECT COUNT(*) FROM prescriptions WHERE created_at >= date('now', '-1 days')) as prescriptions_today,
          (SELECT COUNT(*) FROM births WHERE birth_date = date('now')) as births_today,
          (SELECT COUNT(*) FROM deaths WHERE death_date = date('now')) as deaths_today
      `)
    ]);

    // Get monthly trends for the last 6 months
    const monthlyTrends = await database.query(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(new_patients) as new_patients,
        SUM(new_records) as new_records,
        SUM(appointments) as appointments
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_patients,
          0 as new_records,
          0 as appointments
        FROM patients WHERE created_at >= date('now', '-6 months')
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
          DATE(visit_date) as date,
          0 as new_patients,
          COUNT(*) as new_records,
          0 as appointments
        FROM medical_records WHERE visit_date >= date('now', '-6 months')
        GROUP BY DATE(visit_date)
        
        UNION ALL
        
        SELECT 
          DATE(appointment_date) as date,
          0 as new_patients,
          0 as new_records,
          COUNT(*) as appointments
        FROM appointments WHERE appointment_date >= date('now', '-6 months')
        GROUP BY DATE(appointment_date)
      )
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `);

    // Get critical alerts
    const criticalAlerts = await Promise.all([
      // Overdue appointments
      database.get(`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE appointment_date < date('now') AND status = 'Scheduled'
      `),
      // Critical pending prescriptions
      database.get(`
        SELECT COUNT(*) as count 
        FROM prescriptions 
        WHERE urgency = 'critical' AND status = 'pending'
      `),
      // Low inventory items
      database.get(`
        SELECT COUNT(*) as count 
        FROM inventory 
        WHERE stock_level <= critical_level
      `),
      // Pending lab results
      database.get(`
        SELECT COUNT(*) as count 
        FROM lab_results 
        WHERE status = 'Pending' AND test_date < date('now', '-3 days')
      `)
    ]);

    const alerts = {
      overdue_appointments: criticalAlerts[0].count,
      critical_prescriptions: criticalAlerts[1].count,
      low_inventory: criticalAlerts[2].count,
      pending_lab_results: criticalAlerts[3].count
    };

    // Calculate system health status
    const totalAlerts = Object.values(alerts).reduce((sum, count) => sum + count, 0);
    const systemHealth = totalAlerts === 0 ? 'HEALTHY' : totalAlerts <= 5 ? 'WARNING' : 'CRITICAL';

    res.status(200).json({
      overview: {
        patients: patientStats,
        medical_records: recordsStats,
        appointments: appointmentsStats,
        births_deaths: birthsDeathsStats,
        prescriptions: prescriptionsStats,
        users: usersStats
      },
      recent_activity: recentActivity,
      monthly_trends: monthlyTrends,
      alerts,
      system_health: systemHealth,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}
