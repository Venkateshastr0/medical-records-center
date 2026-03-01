const express = require('express');
const router = express.Router();
const db = require('../db/database');
const hipaaCompliance = require('../utils/hipaa-compliance');
const { logAudit } = require('../utils/audit');

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user statistics
    db.get(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users
       FROM Users`,
      [],
      (err, userStats) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Get registration statistics
        db.get(
          `SELECT 
            COUNT(*) as pending_registrations
           FROM UserRegistrations WHERE status = 'pending'`,
          [],
          (err, regStats) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Get organization statistics
            db.get(
              `SELECT 
                COUNT(*) as total_organizations,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_organizations
               FROM Organizations`,
              [],
              (err, orgStats) => {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'Database error'
                  });
                }

                // Log access
                logAudit(userId, 'VIEW_STATS', null, 'Viewed system statistics');

                res.json({
                  success: true,
                  stats: {
                    users: userStats,
                    registrations: regStats,
                    organizations: orgStats
                  }
                });
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get pending user registrations
router.get('/registrations/pending', async (req, res) => {
  try {
    const userId = req.user.userId;

    db.all(
      `SELECT * FROM UserRegistrations WHERE status = 'pending' ORDER BY submitted_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log access
        logAudit(userId, 'VIEW_REGISTRATIONS', null, 'Viewed pending registrations');

        res.json({
          success: true,
          registrations: rows
        });
      }
    );

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Approve user registration
router.post('/registrations/:id/approve', async (req, res) => {
  try {
    const registrationId = req.params.id;
    const userId = req.user.userId;

    // Get registration details
    db.get(
      `SELECT * FROM UserRegistrations WHERE registration_id = ?`,
      [registrationId],
      (err, registration) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!registration) {
          return res.status(404).json({
            success: false,
            message: 'Registration not found'
          });
        }

        // Create user account
        db.run(
          `INSERT INTO Users (name, username, password_hash, role, email, phone, organization, status, approved_by, approved_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, datetime('now'), datetime('now'))`,
          [
            registration.name,
            registration.username,
            'temp_hash', // Would normally hash a default password
            registration.role,
            registration.email,
            registration.phone,
            registration.organization,
            userId
          ],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Update registration status
            db.run(
              `UPDATE UserRegistrations SET status = 'approved', approved_by = ?, approved_at = datetime('now')
               WHERE registration_id = ?`,
              [userId, registrationId],
              (err) => {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'Database error'
                  });
                }

                // Log action
                logAudit(userId, 'APPROVE_REGISTRATION', registrationId, `Approved registration for ${registration.name}`);
                
                hipaaCompliance.logHIPAAEvent({
                  userId: userId,
                  eventType: 'APPROVE',
                  resourceType: 'user_registrations',
                  action: 'SUCCESS',
                  ipAddress: req.ip,
                  userAgent: req.get('User-Agent'),
                  details: `Approved registration for ${registration.name} (${registration.email})`
                });

                res.json({
                  success: true,
                  message: 'Registration approved successfully'
                });
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reject user registration
router.post('/registrations/:id/reject', async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { reason } = req.body;
    const userId = req.user.userId;

    // Get registration details
    db.get(
      `SELECT * FROM UserRegistrations WHERE registration_id = ?`,
      [registrationId],
      (err, registration) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!registration) {
          return res.status(404).json({
            success: false,
            message: 'Registration not found'
          });
        }

        // Update registration status
        db.run(
          `UPDATE UserRegistrations SET status = 'rejected', rejection_reason = ?, rejected_by = ?, rejected_at = datetime('now')
           WHERE registration_id = ?`,
          [reason, userId, registrationId],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Log action
            logAudit(userId, 'REJECT_REGISTRATION', registrationId, `Rejected registration for ${registration.name}: ${reason}`);
            
            hipaaCompliance.logHIPAAEvent({
              userId: userId,
              eventType: 'REJECT',
              resourceType: 'user_registrations',
              action: 'SUCCESS',
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              details: `Rejected registration for ${registration.name} (${registration.email})`
            });

            res.json({
              success: true,
              message: 'Registration rejected successfully'
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const userId = req.user.userId;

    db.all(
      `SELECT user_id, name, username, email, phone, role, status, organization, created_at, last_login
       FROM Users ORDER BY created_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log access
        logAudit(userId, 'VIEW_USERS', null, 'Viewed all users');

        res.json({
          success: true,
          users: rows
        });
      }
    );

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const userId = req.user.userId;

    db.all(
      `SELECT * FROM Organizations ORDER BY created_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log access
        logAudit(userId, 'VIEW_ORGANIZATIONS', null, 'Viewed all organizations');

        res.json({
          success: true,
          organizations: rows
        });
      }
    );

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Approve organization
router.post('/organizations/:id/approve', async (req, res) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.userId;

    // Get organization details
    db.get(
      `SELECT * FROM Organizations WHERE org_id = ?`,
      [orgId],
      (err, org) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!org) {
          return res.status(404).json({
            success: false,
            message: 'Organization not found'
          });
        }

        // Update organization status
        db.run(
          `UPDATE Organizations SET status = 'approved', approved_by = ?, approved_at = datetime('now')
           WHERE org_id = ?`,
          [userId, orgId],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Log action
            logAudit(userId, 'APPROVE_ORGANIZATION', orgId, `Approved organization: ${org.name}`);
            
            hipaaCompliance.logHIPAAEvent({
              userId: userId,
              eventType: 'APPROVE',
              resourceType: 'organizations',
              action: 'SUCCESS',
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              details: `Approved organization ${org.name}`
            });

            res.json({
              success: true,
              message: 'Organization approved successfully'
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Approve organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get compliance report
router.get('/compliance/report', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // Generate HIPAA compliance report
    const report = await hipaaCompliance.generateComplianceReport(startDate, endDate);

    // Log access
    logAudit(userId, 'VIEW_COMPLIANCE', null, 'Generated compliance report');

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
