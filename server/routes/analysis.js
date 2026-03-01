const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const fieldEncryption = require('../utils/field-encryption');
const hipaaCompliance = require('../utils/hipaa-compliance');
const { logAudit } = require('../utils/audit');

// Configure multer for data bundle uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/analysis');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for medical data
  }
});

// Get team members for TL
router.get('/team-members', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only Team Leads and Admins can view team members
    if (!['Admin', 'TeamLead'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let query = `SELECT tm.*, u.name, u.email, u.role as user_role 
                FROM TeamMembers tm 
                JOIN Users u ON tm.member_id = u.user_id`;
    let params = [];

    if (userRole === 'TeamLead') {
      query += ' WHERE tm.team_lead_id = ? AND tm.status = "active"';
      params = [userId];
    }

    query += ' ORDER BY tm.joined_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      res.json({
        success: true,
        teamMembers: rows
      });
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create data bundle
router.post('/data-bundles', upload.array('files', 10), async (req, res) => {
  try {
    const { patientId, bundleName, description } = req.body;
    const createdBy = req.user.userId;

    if (!patientId || !bundleName) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and bundle name are required'
      });
    }

    // Process uploaded files
    const dataFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        dataFiles.push({
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          size: file.size,
          mimeType: file.mimetype
        });
      });
    }

    // Encrypt file paths
    const encryptedFiles = dataFiles.map(file => ({
      ...file,
      filePath: fieldEncryption.encryptField(file.filePath, 'file_path')
    }));

    db.run(
      `INSERT INTO DataBundles (patient_id, bundle_name, description, data_files, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, bundleName, description, JSON.stringify(encryptedFiles), createdBy],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        // Log HIPAA event
        hipaaCompliance.logHIPAAEvent({
          userId: createdBy,
          eventType: 'CREATE',
          resourceType: 'data_bundle',
          action: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Created data bundle "${bundleName}" for patient ${patientId}`
        });

        res.json({
          success: true,
          bundleId: this.lastID,
          message: 'Data bundle created successfully'
        });
      }
    );

  } catch (error) {
    console.error('Create data bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Assign analysis task to team member
router.post('/tasks/assign', async (req, res) => {
  try {
    const { patientId, assignedTo, taskType, priority, dataBundleId, instructions, deadline } = req.body;
    const assignedBy = req.user.userId;

    if (!patientId || !assignedTo || !taskType) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, assignee, and task type are required'
      });
    }

    // Get data bundle info
    let dataBundle = null;
    if (dataBundleId) {
      db.get(
        'SELECT * FROM DataBundles WHERE bundle_id = ?',
        [dataBundleId],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }
          dataBundle = row;
          createTask();
        }
      );
    } else {
      createTask();
    }

    function createTask() {
      db.run(
        `INSERT INTO AnalysisTasks (patient_id, assigned_by, assigned_to, task_type, priority, data_bundle, instructions, deadline)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, assignedBy, assignedTo, taskType, priority || 'normal', 
         dataBundle ? JSON.stringify(dataBundle) : null, instructions, deadline],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          // Log assignment
          logAudit(assignedBy, 'ASSIGN_TASK', this.lastID, `Assigned ${taskType} task to user ${assignedTo}`);

          res.json({
            success: true,
            taskId: this.lastID,
            message: 'Task assigned successfully'
          });
        }
      );
    }

  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get tasks for user
router.get('/tasks', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status } = req.query;

    let query = `
      SELECT at.*, 
             p.name as patient_name,
             u1.name as assigned_by_name,
             u2.name as assigned_to_name,
             db.bundle_name
      FROM AnalysisTasks at
      JOIN Patients p ON at.patient_id = p.patient_id
      JOIN Users u1 ON at.assigned_by = u1.user_id
      JOIN Users u2 ON at.assigned_to = u2.user_id
      LEFT JOIN DataBundles db ON JSON_EXTRACT(at.data_bundle, '$.bundle_id') = db.bundle_id
    `;

    let params = [];
    let whereClause = '';

    // Filter based on user role
    if (userRole === 'Admin') {
      // Admin can see all tasks
      whereClause = ' WHERE 1=1';
    } else if (userRole === 'TeamLead') {
      // Team Lead can see tasks assigned to their team members
      whereClause = ' WHERE at.assigned_to IN (SELECT member_id FROM TeamMembers WHERE team_lead_id = ?)';
      params = [userId];
    } else {
      // Regular users can only see their assigned tasks
      whereClause = ' WHERE at.assigned_to = ?';
      params = [userId];
    }

    if (status) {
      whereClause += ' AND at.status = ?';
      params.push(status);
    }

    query += whereClause + ' ORDER BY at.created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      res.json({
        success: true,
        tasks: rows
      });
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Submit analysis result
router.post('/tasks/:taskId/submit', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { analysisData, findings, recommendations, confidenceScore } = req.body;
    const analystId = req.user.userId;

    if (!analysisData || !findings) {
      return res.status(400).json({
        success: false,
        message: 'Analysis data and findings are required'
      });
    }

    // Check if user is assigned to this task
    db.get(
      'SELECT * FROM AnalysisTasks WHERE task_id = ? AND assigned_to = ?',
      [taskId, analystId],
      (err, task) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!task) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Insert analysis result
        db.run(
          `INSERT INTO AnalysisResults (task_id, analyst_id, analysis_data, findings, recommendations, confidence_score)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [taskId, analystId, analysisData, findings, recommendations, confidenceScore || 0],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            // Update task status
            db.run(
              'UPDATE AnalysisTasks SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE task_id = ?',
              [taskId]
            );

            // Log submission
            logAudit(analystId, 'SUBMIT_ANALYSIS', this.lastID, `Submitted analysis for task ${taskId}`);

            res.json({
              success: true,
              resultId: this.lastID,
              message: 'Analysis submitted successfully'
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Submit analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Confirm analysis (TL confirmation)
router.post('/results/:resultId/confirm', async (req, res) => {
  try {
    const resultId = req.params.resultId;
    const { confirmed, feedback } = req.body;
    const tlId = req.user.userId;

    if (typeof confirmed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation status is required'
      });
    }

    // Get analysis result with task info
    db.get(
      `SELECT ar.*, at.assigned_to as analyst_id
       FROM AnalysisResults ar
       JOIN AnalysisTasks at ON ar.task_id = at.task_id
       WHERE ar.result_id = ?`,
      [resultId],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (!result) {
          return res.status(404).json({
            success: false,
            message: 'Analysis result not found'
          });
        }

        // Check if TL is authorized to confirm this result
        db.get(
          'SELECT * FROM TeamMembers WHERE team_lead_id = ? AND member_id = ?',
          [tlId, result.analyst_id],
          (err, teamMember) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Database error'
              });
            }

            if (!teamMember && req.user.role !== 'Admin') {
              return res.status(403).json({
                success: false,
                message: 'Access denied'
              });
            }

            // Update result status
            const newStatus = confirmed ? 'confirmed' : 'rejected';
            db.run(
              `UPDATE AnalysisResults SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE result_id = ?`,
              [newStatus, resultId],
              function(err) {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'Database error'
                  });
                }

                // Update task confirmation
                db.run(
                  'UPDATE AnalysisTasks SET confirmed_at = CURRENT_TIMESTAMP WHERE task_id = ?',
                  [result.task_id]
                );

                // If confirmed, upload to cloud
                if (confirmed) {
                  uploadToCloud(resultId);
                }

                // Log confirmation
                logAudit(tlId, 'CONFIRM_ANALYSIS', resultId, `${confirmed ? 'Confirmed' : 'Rejected'} analysis result`);

                res.json({
                  success: true,
                  message: `Analysis ${confirmed ? 'confirmed' : 'rejected'} successfully`
                });
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('Confirm analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upload to cloud storage
function uploadToCloud(resultId) {
  // Generate encryption key
  const encryptionKey = fieldEncryption.generateApiKey(resultId, '1y');
  
  // Insert cloud storage record
  db.run(
    `INSERT INTO CloudStorage (result_id, cloud_provider, storage_path, encryption_key, upload_status)
     VALUES (?, ?, ?, ?, ?)`,
    [resultId, 'aws-s3', `/medical-analysis/${resultId}`, encryptionKey, 'processing'],
    function(err) {
      if (err) {
        console.error('Cloud storage error:', err);
        return;
      }
      
      // Simulate cloud upload (in production, use actual cloud SDK)
      setTimeout(() => {
        db.run(
          'UPDATE CloudStorage SET upload_status = "completed", uploaded_at = CURRENT_TIMESTAMP WHERE storage_id = ?',
          [this.lastID]
        );
      }, 2000);
    }
  );
}

// Get analysis results
router.get('/results', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status } = req.query;

    let query = `
      SELECT ar.*, 
             at.task_id, at.task_type, at.patient_id,
             p.name as patient_name,
             u1.name as analyst_name,
             u2.name as tl_name,
             cs.upload_status
      FROM AnalysisResults ar
      JOIN AnalysisTasks at ON ar.task_id = at.task_id
      JOIN Patients p ON at.patient_id = p.patient_id
      JOIN Users u1 ON ar.analyst_id = u1.user_id
      LEFT JOIN Users u2 ON at.assigned_to = u2.user_id
      LEFT JOIN CloudStorage cs ON ar.result_id = cs.result_id
    `;

    let params = [];
    let whereClause = ' WHERE 1=1';

    // Filter based on user role
    if (userRole === 'Analyst') {
      whereClause += ' AND ar.analyst_id = ?';
      params = [userId];
    } else if (userRole === 'TeamLead') {
      whereClause += ' AND at.assigned_to IN (SELECT member_id FROM TeamMembers WHERE team_lead_id = ?)';
      params = [userId];
    }

    if (status) {
      whereClause += ' AND ar.status = ?';
      params.push(status);
    }

    query += whereClause + ' ORDER BY ar.created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      res.json({
        success: true,
        results: rows
      });
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
