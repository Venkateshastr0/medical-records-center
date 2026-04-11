const database = require('../../../lib/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create a mock admin token for testing
const createMockToken = () => {
  return jwt.sign(
    { 
      id: 1, 
      username: 'admin', 
      role: 'admin'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For testing, create mock admin user
  const user = { id: 1, username: 'admin', role: 'admin' };
  try {
    const isDoctor = user.role === 'doctor';
    const doctorFilter = isDoctor ? `WHERE doctor_id = '${user.id}'` : '';
    const doctorFilterAnd = isDoctor ? `AND doctor_id = '${user.id}'` : '';
    const doctorFilterWhere = isDoctor ? `WHERE doctor_id = '${user.id}'` : '';

    // Get comprehensive statistics
    const results = await Promise.all([
      // 0: User statistics
      database.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
          COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved,
          COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week
        FROM users
      `),
      // 1: Patient statistics
      isDoctor ? 
        database.get(`
          SELECT 
            COUNT(DISTINCT patient_id) as total,
            COUNT(DISTINCT CASE WHEN created_at >= date('now', '-30 days') THEN patient_id END) as new_this_month,
            COUNT(DISTINCT CASE WHEN created_at >= date('now', '-7 days') THEN patient_id END) as new_this_week
          FROM (
            SELECT patient_id, created_at FROM appointments WHERE doctor_id = ?
            UNION
            SELECT patient_id, visit_date as created_at FROM medical_records WHERE doctor_id = ?
          )
        `, [user.id, user.id]) :
        database.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_this_week
          FROM patients
        `),
      // 2: Appointment statistics (Filtered for Doctors)
      database.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN date(appointment_date) = date('now') THEN 1 END) as today,
          COUNT(CASE WHEN appointment_date >= date('now') THEN 1 END) as upcoming
        FROM appointments
        ${doctorFilter}
      `),
      // 3: Medical records statistics (Filtered for Doctors)
      database.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN visit_date >= date('now', '-30 days') THEN 1 END) as this_month,
          COUNT(CASE WHEN visit_date >= date('now', '-7 days') THEN 1 END) as this_week
        FROM medical_records
        ${doctorFilter}
      `),
      // 4: Pending user approvals
      database.get('SELECT COUNT(*) as count FROM users WHERE is_approved = 0'),
      // 5: Recent activity summary (Filtered for Doctors)
      database.get(`
        SELECT 
          (SELECT COUNT(*) FROM patients WHERE date(created_at) = date('now')) as new_patients,
          (SELECT COUNT(*) FROM medical_records WHERE date(visit_date) = date('now') ${doctorFilterAnd}) as visits_today,
          (SELECT COUNT(*) FROM appointments WHERE date(appointment_date) = date('now') ${doctorFilterAnd}) as appointments_today
      `),
      // 6: Placeholder for Births/Deaths (Tables not in schema yet)
      Promise.resolve({ total_births: 0, total_deaths: 0, births_today: 0 }),
      // 7: Prescriptions statistics (Filtered for Doctors)
      database.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'urgent' THEN 1 END) as critical
        FROM prescriptions
        ${doctorFilter}
      `).catch(() => ({ total: 0, pending: 0, critical: 0 })),
      // 8: Growth data (last 6 months - Filtered for Doctors)
      database.query(`
        SELECT 
          strftime('%b', date(visit_date)) as month,
          COUNT(*) as visits,
          (SELECT COUNT(*) FROM patients p WHERE strftime('%m', date(p.created_at)) = strftime('%m', date(mr.visit_date))) as patients
        FROM medical_records mr
        WHERE visit_date >= date('now', '-6 months')
        ${doctorFilterAnd}
        GROUP BY strftime('%m', date(visit_date))
        ORDER BY visit_date ASC
      `).catch(() => []),
      // 9: Detailed Recent Activity List (Filtered for Doctors)
      database.query(`
        SELECT * FROM (
          SELECT 'NEW' as type, 'New patient: ' || first_name || ' ' || last_name as desc, 'Clinical Ops' as dept, created_at as timestamp 
          FROM patients ORDER BY created_at DESC LIMIT 5
        ) UNION ALL SELECT * FROM (
          SELECT 'OK' as type, 'Medical record updated' as desc, 'My Patients' as dept, visit_date as timestamp 
          FROM medical_records ${doctorFilterWhere} ORDER BY visit_date DESC LIMIT 5
        ) UNION ALL SELECT * FROM (
          SELECT 'LAB' as type, 'Result received' as desc, 'Laboratory' as dept, created_at as timestamp 
          FROM lab_results ${isDoctor ? `WHERE patient_id IN (SELECT patient_id FROM appointments WHERE doctor_id = '${user.id}')` : ''} 
          ORDER BY created_at DESC LIMIT 5
        ) ORDER BY timestamp DESC LIMIT 10
      `).catch(() => []),
      // 10: Rx Category Breakdown (Filtered for Doctors)
      database.query(`
        SELECT medication_name as name, COUNT(*) as value 
        FROM prescriptions 
        ${doctorFilter}
        GROUP BY medication_name 
        ORDER BY value DESC 
        LIMIT 5
      `).catch(() => []),
      // 11: Today's Schedule (Filtered for Doctors)
      database.query(`
        SELECT 
          strftime('%H:%M', appointment_date) as time,
          strftime('%p', appointment_date) as ampm,
          p.first_name || ' ' || p.last_name as patient,
          'Patient Consultation' as procedure,
          CASE 
            WHEN strftime('%H', appointment_date) < '12' THEN '#3b82f6'
            WHEN strftime('%H', appointment_date) < '15' THEN '#a855f7'
            ELSE '#22c55e'
          END as color
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        WHERE date(a.appointment_date) = date('now')
        ${doctorFilterAnd}
        ORDER BY a.appointment_date ASC
      `).catch(() => [])
    ]);

    const [
      userCount, patientCount, appointmentCount, recordCount, pendingApprovals,
      recentActivity, birthsDeathsStats, prescriptionsStats, growthData,
      activityList, rxCategories, todaySchedule
    ] = results;

    // Color palette for RX categories
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa'];
    const formattedRxCategories = rxCategories.map((item, index) => ({
      name: item.name,
      value: item.value,
      color: colors[index % colors.length]
    }));
    
    // Add BG colors to schedule
    const formattedSchedule = todaySchedule.map(appt => ({
      ...appt,
      bg: appt.color + '14' // Add transparency
    }));
    
    res.status(200).json({
      users: {
        total: userCount.total,
        active: userCount.active,
        approved: userCount.approved,
        active_this_week: userCount.active_this_week
      },
      patients: {
        total: patientCount.total,
        new_this_month: patientCount.new_this_month,
        new_this_week: patientCount.new_this_week
      },
      appointments: {
        total: appointmentCount.total,
        scheduled: appointmentCount.scheduled,
        today: appointmentCount.today,
        upcoming: appointmentCount.upcoming
      },
      medical_records: {
        total: recordCount.total,
        this_month: recordCount.this_month,
        this_week: recordCount.this_week
      },
      births_deaths: birthsDeathsStats,
      prescriptions: prescriptionsStats,
      pending_approvals: pendingApprovals.count,
      recent_activity: recentActivity,
      growth_data: growthData,
      activity_list: activityList,
      rx_categories: formattedRxCategories,
      today_schedule: formattedSchedule,
      db_status: 'Connected',
      db_path: 'database/medical_records.db',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
}
