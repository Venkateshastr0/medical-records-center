const database = require('./lib/database');

async function fixDB() {
  try {
    console.log("Adding country column...");

    await database.run(`ALTER TABLE patients ADD COLUMN country TEXT`);

    console.log("✅ Column 'country' added successfully!");
  } catch (error) {
    console.error("⚠️ Error:", error.message);
  }
}

fixDB();