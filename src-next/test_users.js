const db = require('./lib/database');
async function test() {
  try {
    const r = await db.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
          COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved,
          COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week
        FROM users
    `);
    console.log('USER STATS SUCCESS:', r);
    process.exit(0);
  } catch(e) {
    console.error('CRASH:', e.message);
    process.exit(1);
  }
}
test();
