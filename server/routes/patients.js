const express = require('express');
const router = express.Router();
const db = require('../db/database');
const fieldEncryption = require('../utils/field-encryption');
const accessControl = require('../utils/access-control');
const hipaaCompliance = require('../utils/hipaa-compliance');
const { logAudit } = require('../utils/audit');

// Get all patients (with access control)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check access permissions
    const hasAccess = accessControl.hasPermission(userRole, 'view_all_patients');
    
    if (!hasAccess) {
      // For doctors, only return their assigned patients
      if (userRole === 'Doctor') {
        db.all(
          `SELECT patient_id, name, age, status, created_at 
           FROM Patients WHERE assigned_doctor = ?`,
          [userId],
          (err, rows) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            res.json({
              success: true,
              patients: rows
            });
          }
        );
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
    } else {
      // For admins, return all patients
      db.all(
        `SELECT patient_id, name, age, status, created_at FROM Patients`,
        [],
        (err, rows) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          res.json({
            success: true,
            patients: rows
          });
        }
      );
    }

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get specific patient (with access control)
router.get('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check data access permissions
    const accessCheck = await accessControl.checkDataAccess(userId, patientId, 'patient_data');
    
    if (!accessCheck.allowed) {
      await hipaaCompliance.logHIPAAEvent({
        userId: userId,
        eventType: 'UNAUTHORIZED_ACCESS',
        resourceType: 'patient_records',
        action: 'VIEW',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: `Attempted to access patient ${patientId}`
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessCheck.reason
      });
    }

    // Get patient data
    db.get(
      `SELECT * FROM Patients WHERE patient_id = ?`,
      [patientId],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: 'Patient not found'
          });
        }

        // Log access
        logAudit(userId, 'VIEW_PATIENT', patientId, `Viewed patient record`);
        
        hipaaCompliance.logHIPAAEvent({
          userId: userId,
          eventType: 'VIEW',
          resourceType: 'patient_records',
          action: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Accessed patient ${patientId}`
        });

        res.json({
          success: true,
          patient: row,
          accessLevel: accessCheck.level
        });
      }
    );

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get patient records
router.get('/:id/records', async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check access permissions
    const accessCheck = await accessControl.checkDataAccess(userId, patientId, 'medical_records');
    
    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessCheck.reason
      });
    }

    // Get patient records
    db.all(
      `SELECT record_id, type, created_at, created_by 
       FROM Records WHERE patient_id = ? ORDER BY created_at DESC`,
      [patientId],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log access
        logAudit(userId, 'VIEW_RECORDS', patientId, `Viewed patient records`);
        
        hipaaCompliance.logHIPAAEvent({
          userId: userId,
          eventType: 'VIEW',
          resourceType: 'medical_records',
          action: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Accessed records for patient ${patientId}`
        });

        res.json({
          success: true,
          records: rows
        });
      }
    );

  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add new patient (Doctor and Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, age, status, assigned_doctor } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check permissions
    const hasPermission = accessControl.hasPermission(userRole, 'add_patients');
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Insert new patient
    db.run(
      `INSERT INTO Patients (name, age, status, assigned_doctor, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [name, age, status, assigned_doctor || userId, userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log action
        logAudit(userId, 'ADD_PATIENT', this.lastID, `Added new patient: ${name}`);
        
        hipaaCompliance.logHIPAAEvent({
          userId: userId,
          eventType: 'CREATE',
          resourceType: 'patient_records',
          action: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Created patient record for ${name}`
        });

        res.json({
          success: true,
          message: 'Patient added successfully',
          patientId: this.lastID
        });
      }
    );

  } catch (error) {
    console.error('Add patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, age, status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check access permissions
    const accessCheck = await accessControl.checkDataAccess(userId, patientId, 'patient_data');
    
    if (!accessCheck.allowed || accessCheck.level !== 'full') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessCheck.reason
      });
    }

    // Update patient
    db.run(
      `UPDATE Patients SET name = ?, age = ?, status = ?, updated_at = datetime('now')
       WHERE patient_id = ?`,
      [name, age, status, patientId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Patient not found'
          });
        }

        // Log action
        logAudit(userId, 'UPDATE_PATIENT', patientId, `Updated patient: ${name}`);
        
        hipaaCompliance.logHIPAAEvent({
          userId: userId,
          eventType: 'EDIT',
          resourceType: 'patient_records',
          action: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Updated patient ${patientId}`
        });

        res.json({
          success: true,
          message: 'Patient updated successfully'
        });
      }
    );

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
