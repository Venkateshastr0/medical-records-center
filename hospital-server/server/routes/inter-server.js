const express = require('express');
const router = express.Router();
const interServerComm = require('../utils/inter-server-comm');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Receive data from company server
router.post('/receive', async (req, res) => {
  try {
    const { type, data, timestamp, source, checksum } = req.body;
    
    // Verify API key
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.HOSPITAL_API_KEY || 'hospital-secure-key-2024';
    
    if (apiKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid API key'
      });
    }
    
    // Verify checksum for data integrity
    const decryptedData = interServerComm.decryptData(data);
    if (!interServerComm.verifyChecksum(decryptedData, checksum)) {
      return res.status(400).json({
        success: false,
        message: 'Data integrity check failed'
      });
    }
    
    // Save received data securely
    const saveResult = await interServerComm.saveReceivedData(decryptedData, type, source);
    
    await logAudit(null, 'RECEIVE_INTER_SERVER_DATA', null, `Data received from ${source}: ${type}`);
    
    res.json({
      success: true,
      message: 'Data received and saved successfully',
      savedFile: saveResult.filename
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Receive inter-server data');
    ErrorHandler.apiError(res, error);
  }
});

// Send medical reports to company server
router.post('/send-reports', async (req, res) => {
  try {
    const { reportIds, recipientType } = req.body;
    
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
        SELECT r.*, p.name as patient_name, u.name as doctor_name
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
    
    // Send to company server
    const result = await interServerComm.sendToCompany({
      reports: reports,
      recipientType: recipientType,
      sentBy: 'Hospital Server',
      sentAt: new Date().toISOString()
    }, 'medical-reports');
    
    await logAudit(null, 'SEND_REPORTS_TO_COMPANY', null, `Sent ${reports.length} reports to company`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Send reports to company');
    ErrorHandler.apiError(res, error);
  }
});

// Get received data list
router.get('/received-data', async (req, res) => {
  try {
    const result = await interServerComm.getReceivedData();
    res.json(result);
  } catch (error) {
    ErrorHandler.logError(error, 'Get received data');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
