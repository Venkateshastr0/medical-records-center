const express = require('express');
const router = express.Router();
const sipComm = require('../utils/sip-communication');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Get main server data (for admin and production team)
router.get('/data', async (req, res) => {
  try {
    const db = require('../db/database');
    const mainData = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM ProcessedData 
        ORDER BY processed_at DESC
        LIMIT 100
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: mainData
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get main server data');
    ErrorHandler.apiError(res, error);
  }
});

// Receive data from analyst
router.post('/receive-from-analyst', async (req, res) => {
  try {
    const { type, data, timestamp, source, checksum } = req.body;
    
    // Verify checksum
    const decryptedData = sipComm.decryptData(data);
    if (!sipComm.verifyChecksum(decryptedData, checksum)) {
      return res.status(400).json({
        success: false,
        message: 'Data integrity check failed'
      });
    }
    
    // Save to main server database
    const db = require('../db/database');
    const recordId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO ProcessedData (
          type, data, source, timestamp, checksum,
          processed_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        type,
        JSON.stringify(decryptedData),
        source,
        timestamp,
        checksum,
        new Date().toISOString(),
        'active'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    await logAudit(null, 'RECEIVE_FROM_ANALYST', recordId, `Data received from analyst via SIP`);
    
    res.json({
      success: true,
      message: 'Data received and stored in main server',
      recordId: recordId
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Receive data from analyst');
    ErrorHandler.apiError(res, error);
  }
});

// Get specific data record
router.get('/data/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const db = require('../db/database');
    const record = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ProcessedData 
        WHERE id = ?
      `, [recordId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    res.json({
      success: true,
      record: record
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get main server record');
    ErrorHandler.apiError(res, error);
  }
});

// Update data status (admin only)
router.put('/data/:recordId/status', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const db = require('../db/database');
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ProcessedData 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `, [status, new Date().toISOString(), recordId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await logAudit(null, 'UPDATE_DATA_STATUS', recordId, `Data status updated to ${status}`);
    
    res.json({
      success: true,
      message: 'Data status updated successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Update data status');
    ErrorHandler.apiError(res, error);
  }
});

// Delete data (admin only)
router.delete('/data/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const db = require('../db/database');
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM ProcessedData 
        WHERE id = ?
      `, [recordId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await logAudit(null, 'DELETE_DATA', recordId, `Data deleted from main server`);
    
    res.json({
      success: true,
      message: 'Data deleted successfully'
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Delete data');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
