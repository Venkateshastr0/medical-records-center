const db = require('../db/database');
const bcrypt = require('bcrypt');
const { logAudit } = require('../utils/audit');

// Get all pending user registrations
async function getPendingRegistrations(callback) {
  db.all(
    `SELECT * FROM UserRegistrations WHERE status = 'pending' ORDER BY submitted_at DESC`,
    (err, rows) => {
      if (err) {
        return callback({ success: false, message: err.message });
      }
      callback({ success: true, registrations: rows });
    }
  );
}

// Approve user registration
async function approveRegistration(registrationId, adminId, callback) {
  // Get registration details
  db.get(
    `SELECT * FROM UserRegistrations WHERE registration_id = ?`,
    [registrationId],
    (err, registration) => {
      if (err) {
        return callback({ success: false, message: err.message });
      }
      if (!registration) {
        return callback({ success: false, message: 'Registration not found' });
      }

      // Create user account
      const defaultPassword = 'tempPassword123'; // In production, generate secure password
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
          return callback({ success: false, message: err.message });
        }

        db.run(
          `INSERT INTO Users (name, username, password_hash, role, email, phone, organization, status, approved_by, approved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP)`,
          [
            registration.name,
            registration.username,
            hash,
            registration.role,
            registration.email,
            registration.phone,
            registration.organization,
            adminId
          ],
          function (err) {
            if (err) {
              return callback({ success: false, message: err.message });
            }

            // Update registration status
            db.run(
              `UPDATE UserRegistrations SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
               WHERE registration_id = ?`,
              [adminId, registrationId]
            );

            // Log audit
            logAudit(adminId, 'APPROVE_REGISTRATION', null, `Approved registration for ${registration.name}`);

            callback({
              success: true,
              message: 'Registration approved successfully',
              userId: this.lastID
            });
          }
        );
      });
    }
  );
}

// Reject user registration
async function rejectRegistration(registrationId, adminId, reason, callback) {
  db.get(
    `SELECT * FROM UserRegistrations WHERE registration_id = ?`,
    [registrationId],
    (err, registration) => {
      if (err) {
        return callback({ success: false, message: err.message });
      }
      if (!registration) {
        return callback({ success: false, message: 'Registration not found' });
      }

      db.run(
        `UPDATE UserRegistrations SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
         WHERE registration_id = ?`,
        [adminId, reason, registrationId],
        function (err) {
          if (err) {
            return callback({ success: false, message: err.message });
          }

          // Log audit
          logAudit(adminId, 'REJECT_REGISTRATION', null, `Rejected registration for ${registration.name}: ${reason}`);

          callback({
            success: true,
            message: 'Registration rejected successfully'
          });
        }
      );
    }
  );
}

// Get all users with their status
async function getAllUsers(callback) {
  db.all(
    `SELECT u.*, a.name as approved_by_name 
     FROM Users u 
     LEFT JOIN Users a ON u.approved_by = a.user_id 
     ORDER BY u.created_at DESC`,
    (err, rows) => {
      if (err) {
        return callback({ success: false, message: err.message });
      }
      callback({ success: true, users: rows });
    }
  );
}

// Get all organizations
async function getAllOrganizations(callback) {
  db.all(
    `SELECT o.*, a.name as approved_by_name 
     FROM Organizations o 
     LEFT JOIN Users a ON o.approved_by = a.user_id 
     ORDER BY o.created_at DESC`,
    (err, rows) => {
      if (err) {
        return callback({ success: false, message: err.message });
      }
      callback({ success: true, organizations: rows });
    }
  );
}

// Approve organization
async function approveOrganization(orgId, adminId, callback) {
  db.run(
    `UPDATE Organizations SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
     WHERE org_id = ?`,
    [adminId, orgId],
    function (err) {
      if (err) {
        return callback({ success: false, message: err.message });
      }

      logAudit(adminId, 'APPROVE_ORGANIZATION', null, `Approved organization ID: ${orgId}`);

      callback({
        success: true,
        message: 'Organization approved successfully'
      });
    }
  );
}

// Get system statistics
async function getSystemStats(callback) {
  const stats = {};

  // Get user counts by status
  db.get(
    `SELECT 
       COUNT(*) as total_users,
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_users,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users
     FROM Users`,
    (err, userStats) => {
      if (err) return callback({ success: false, message: err.message });

      stats.users = userStats;

      // Get registration counts
      db.get(
        `SELECT 
           COUNT(*) as total_registrations,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_registrations
         FROM UserRegistrations`,
        (err, regStats) => {
          if (err) return callback({ success: false, message: err.message });

          stats.registrations = regStats;

          // Get organization counts
          db.get(
            `SELECT 
               COUNT(*) as total_organizations,
               SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_organizations
             FROM Organizations`,
            (err, orgStats) => {
              if (err) return callback({ success: false, message: err.message });

              stats.organizations = orgStats;

              // Add System/Server Stats
              const os = require('os');
              const cpus = os.cpus();
              const load = os.loadavg();
              const totalMem = os.totalmem();
              const freeMem = os.freemem();

              // Get local IP
              const nets = os.networkInterfaces();
              let localIP = "localhost";
              for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                  if (net.family === "IPv4" && !net.internal) {
                    localIP = net.address;
                  }
                }
              }

              stats.server = {
                uptime: (os.uptime() / 3600).toFixed(2) + 'h',
                cpu: Math.round(load[0] * 10), // Rough load estimate
                memory: ((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2), // Used GB
                totalMemory: (totalMem / 1024 / 1024 / 1024).toFixed(2), // Total GB
                disk: 60, // Placeholder as Node doesn't easily give disk usage without extra libs
                ip: localIP
              };

              // Simulated security stats (placeholder)
              stats.security = {
                threats: 0,
                blocked: 12,
                alerts: 0,
                lastScan: 'Just now'
              };

              callback({ success: true, stats });
            }
          );
        }
      );
    }
  );
}

module.exports = {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getAllUsers,
  getAllOrganizations,
  approveOrganization,
  getSystemStats
};
