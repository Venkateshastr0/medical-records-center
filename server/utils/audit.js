const db = require("../db/database");

function logAudit(userId, action, recordId, details) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO AuditLogs (user_id, action, record_id, timestamp, details)
      VALUES (?, ?, ?, datetime('now'), ?)
      `,
      [userId, action, recordId, details],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

module.exports = { logAudit };
