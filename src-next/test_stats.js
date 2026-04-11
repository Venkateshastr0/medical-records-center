const db = require('./lib/database');
async function test() {
  try {
    const r = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM patients WHERE date(created_at) = date('now')) as new_patients,
        (SELECT COUNT(*) FROM medical_records WHERE date(visit_date) = date('now')) as visits_today,
        (SELECT COUNT(*) FROM appointments WHERE date(appointment_date) = date('now')) as appointments_today
    `);
    console.log('STATS SUCCESS:', r);
    process.exit(0);
  } catch(e) {
    console.error('CRASH:', e.message);
    process.exit(1);
  }
}
test();
