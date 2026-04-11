const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get system overview statistics
    const systemOverview = await Promise.all([
      // Users count
      database.get('SELECT COUNT(*) as total_users FROM users WHERE is_active = 1'),
      // Patients count
      database.get('SELECT COUNT(*) as total_patients FROM patients'),
      // Medical records count
      database.get('SELECT COUNT(*) as total_records FROM medical_records'),
      // Appointments count
      database.get('SELECT COUNT(*) as total_appointments FROM appointments'),
      // Births count
      database.get('SELECT COUNT(*) as total_births FROM births'),
      // Deaths count
      database.get('SELECT COUNT(*) as total_deaths FROM deaths'),
      // Prescriptions count
      database.get('SELECT COUNT(*) as total_prescriptions FROM prescriptions'),
      // Lab results count
      database.get('SELECT COUNT(*) as total_lab_results FROM lab_results')
    ]);

    // Get recent activity summary
    const recentActivity = await Promise.all([
      // New patients this month
      database.get(`
        SELECT COUNT(*) as new_patients 
        FROM patients 
        WHERE created_at >= date('now', 'start of month')
      `),
      // Appointments today
      database.get(`
        SELECT COUNT(*) as appointments_today 
        FROM appointments 
        WHERE date(appointment_date) = date('now')
      `),
      // Pending prescriptions
      database.get(`
        SELECT COUNT(*) as pending_prescriptions 
        FROM prescriptions 
        WHERE status = 'pending'
      `),
      // Lab results pending
      database.get(`
        SELECT COUNT(*) as pending_lab_results 
        FROM lab_results 
        WHERE status = 'Pending'
      `),
      // Births this month
      database.get(`
        SELECT COUNT(*) as births_this_month 
        FROM births 
        WHERE birth_date >= date('now', 'start of month')
      `),
      // Deaths this month
      database.get(`
        SELECT COUNT(*) as deaths_this_month 
        FROM deaths 
        WHERE death_date >= date('now', 'start of month')
      `)
    ]);

    // Get user activity by role
    const userActivity = await database.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week
      FROM users 
      WHERE is_active = 1
      GROUP BY role 
      ORDER BY count DESC
    `);

    // Get database health metrics
    const databaseHealth = await Promise.all([
      // Check database size (approximate)
      database.get(`
        SELECT COUNT(*) as total_tables 
        FROM sqlite_master 
        WHERE type='table'
      `),
      // Get most recent activity
      database.get(`
        SELECT 
          CASE 
            WHEN (SELECT MAX(created_at) FROM audit_logs) > (SELECT MAX(created_at) FROM medical_records) 
            THEN (SELECT MAX(created_at) FROM audit_logs)
            ELSE (SELECT MAX(created_at) FROM medical_records)
          END as last_activity
      `)
    ]);

    // Get critical alerts
    const criticalAlerts = await Promise.all([
      // Low stock items
      database.get(`
        SELECT COUNT(*) as low_stock_count 
        FROM inventory 
        WHERE stock_level <= critical_level
      `),
      // Overdue appointments
      database.get(`
        SELECT COUNT(*) as overdue_appointments 
        FROM appointments 
        WHERE appointment_date < datetime('now') AND status = 'Scheduled'
      `),
      // Critical pending prescriptions
      database.get(`
        SELECT COUNT(*) as critical_prescriptions 
        FROM prescriptions 
        WHERE urgency = 'critical' AND status = 'pending'
      `)
    ]);

    const overview = {
      total_users: systemOverview[0].total_users,
      total_patients: systemOverview[1].total_patients,
      total_records: systemOverview[2].total_records,
      total_appointments: systemOverview[3].total_appointments,
      total_births: systemOverview[4].total_births,
      total_deaths: systemOverview[5].total_deaths,
      total_prescriptions: systemOverview[6].total_prescriptions,
      total_lab_results: systemOverview[7].total_lab_results
    };

    const activity = {
      new_patients: recentActivity[0].new_patients,
      appointments_today: recentActivity[1].appointments_today,
      pending_prescriptions: recentActivity[2].pending_prescriptions,
      pending_lab_results: recentActivity[3].pending_lab_results,
      births_this_month: recentActivity[4].births_this_month,
      deaths_this_month: recentActivity[5].deaths_this_month
    };

    const alerts = {
      low_stock_items: criticalAlerts[0].low_stock_count,
      overdue_appointments: criticalAlerts[1].overdue_appointments,
      critical_prescriptions: criticalAlerts[2].critical_prescriptions
    };

    res.status(200).json({
      overview,
      activity,
      user_activity: userActivity,
      database_health: {
        total_tables: databaseHealth[0].total_tables,
        last_activity: databaseHealth[1].last_activity
      },
      alerts,
      system_status: alerts.low_stock_items > 0 || alerts.overdue_appointments > 0 || alerts.critical_prescriptions > 0 ? 'WARNING' : 'HEALTHY',
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
}
