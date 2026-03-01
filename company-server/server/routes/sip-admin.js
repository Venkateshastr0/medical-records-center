const express = require('express');
const router = express.Router();
const sipComm = require('../utils/sip-communication');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Get admin personal storage
router.get('/personal-storage', async (req, res) => {
  try {
    const result = await sipComm.getPersonalStorage('admin');
    res.json(result);
  } catch (error) {
    ErrorHandler.logError(error, 'Get admin personal storage');
    ErrorHandler.apiError(res, error);
  }
});

// Assign data to TL
router.post('/assign-to-tl', async (req, res) => {
  try {
    const { dataId, tlId, notes = '' } = req.body;
    
    if (!dataId || !tlId) {
      return res.status(400).json({
        success: false,
        message: 'Data ID and TL ID are required'
      });
    }
    
    const result = await sipComm.assignToTL(dataId, tlId, notes);
    
    await logAudit(null, 'ASSIGN_DATA_TO_TL', null, `Data ${dataId} assigned to TL ${tlId}`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Assign data to TL');
    ErrorHandler.apiError(res, error);
  }
});

// Get available TLs
router.get('/available-tls', async (req, res) => {
  try {
    const db = require('../db/database');
    const tls = await new Promise((resolve, reject) => {
      db.all(`
        SELECT user_id, name, username, email
        FROM Users 
        WHERE role = 'Team Lead' AND status = 'approved'
        ORDER BY name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      tls: tls
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get available TLs');
    ErrorHandler.apiError(res, error);
  }
});

// Download file from personal storage
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = `./personal-storage/admin/${filename}`;
    
    const fs = require('fs').promises;
    const content = await fs.readFile(filepath, 'utf8');
    const data = JSON.parse(content);
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Download admin file');
    ErrorHandler.apiError(res, error);
  }
});

// Send data back to hospital (if needed)
router.post('/send-to-hospital', async (req, res) => {
  try {
    const { data, dataType, notes } = req.body;
    
    const result = await sipComm.sendToHospital({
      data: data,
      sentBy: 'Admin',
      sentAt: new Date().toISOString(),
      notes: notes
    }, dataType);
    
    await logAudit(null, 'SEND_DATA_TO_HOSPITAL', null, `Data sent to hospital via SIP`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Send data to hospital');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
