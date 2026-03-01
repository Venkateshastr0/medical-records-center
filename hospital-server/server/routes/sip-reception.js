const express = require('express');
const router = express.Router();
const sipComm = require('../utils/sip-communication');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Send medical reports to admin personal storage
router.post('/send-to-admin', async (req, res) => {
  try {
    const { reportIds, priority = 'high', notes = '' } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds)) {
      return res.status(400).json({
        success: false,
        message: 'Report IDs array is required'
      });
    }
    
    // Get reports from database
    const db = require('../db/database');
    const reports = await new Promise((resolve, reject) => {
      const placeholders = reportIds.map(() => '?').join(',');
      db.all(`
        SELECT r.*, p.name as patient_name, p.age, p.phone, u.name as doctor_name
        FROM Records r
        JOIN Patients p ON r.patient_id = p.patient_id
        JOIN Users u ON r.created_by = u.user_id
        WHERE r.record_id IN (${placeholders})
        ORDER BY r.created_at DESC
      `, reportIds, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Send to admin personal storage via SIP
    const result = await sipComm.sendToAdmin({
      reports: reports,
      sentBy: 'Hospital Reception',
      sentAt: new Date().toISOString(),
      priority: priority,
      notes: notes,
      workflow: 'hospital-to-admin'
    }, 'medical-reports');
    
    await logAudit(null, 'SEND_REPORTS_TO_ADMIN', null, `Sent ${reports.length} reports to admin personal storage via SIP`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Send reports to admin via SIP');
    ErrorHandler.apiError(res, error);
  }
});

// Get SIP communication status
router.get('/status', async (req, res) => {
  try {
    const status = {
      sipEnabled: true,
      servers: {
        hospital: {
          host: 'localhost',
          port: 5060,
          status: 'active'
        },
        admin: {
          host: 'localhost',
          port: 5062,
          status: 'active'
        }
      },
      encryption: 'AES-256-CBC',
      protocol: 'SIP/2.0',
      security: 'High'
    };
    
    res.json({
      success: true,
      status: status
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get SIP status');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
