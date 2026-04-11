const db = require('./lib/database');
async function chk() {
  try {
    const r = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('TABLES:', r.map(t => t.name));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
chk();
