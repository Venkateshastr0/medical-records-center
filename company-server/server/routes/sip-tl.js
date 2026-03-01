const express = require('express');
const router = express.Router();
const sipComm = require('../utils/sip-communication');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Get TL personal storage
router.get('/personal-storage', async (req, res) => {
  try {
    const result = await sipComm.getPersonalStorage('tl');
    res.json(result);
  } catch (error) {
    ErrorHandler.logError(error, 'Get TL personal storage');
    ErrorHandler.apiError(res, error);
  }
});

// Assign data to analyst
router.post('/assign-to-analyst', async (req, res) => {
  try {
    const { dataId, analystId, notes = '' } = req.body;
    
    if (!dataId || !analystId) {
      return res.status(400).json({
        success: false,
        message: 'Data ID and Analyst ID are required'
      });
    }
    
    const result = await sipComm.assignToAnalyst(dataId, analystId, notes);
    
    await logAudit(null, 'ASSIGN_DATA_TO_ANALYST', null, `Data ${dataId} assigned to Analyst ${analystId}`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Assign data to analyst');
    ErrorHandler.apiError(res, error);
  }
});

// Get available analysts
router.get('/available-analysts', async (req, res) => {
  try {
    const db = require('../db/database');
    const analysts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT user_id, name, username, email
        FROM Users 
        WHERE role = 'Analyst' AND status = 'approved'
        ORDER BY name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      analysts: analysts
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get available analysts');
    ErrorHandler.apiError(res, error);
  }
});

// Download file from personal storage
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = `./personal-storage/tl/${filename}`;
    
    const fs = require('fs').promises;
    const content = await fs.readFile(filepath, 'utf8');
    const data = JSON.parse(content);
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Download TL file');
    ErrorHandler.apiError(res, error);
  }
});

// Format data and send to analyst
router.post('/format-and-send', async (req, res) => {
  try {
    const { dataId, formatType, analystId, formattedData } = req.body;
    
    if (!dataId || !analystId || !formattedData) {
      return res.status(400).json({
        success: false,
        message: 'Data ID, Analyst ID, and formatted data are required'
      });
    }
    
    // Get original data
    const tlStorage = await sipComm.getPersonalStorage('tl');
    const dataFile = tlStorage.files.find(f => f.filename.includes(dataId));
    
    if (!dataFile) {
      return res.status(404).json({
        success: false,
        message: 'Data not found in TL storage'
      });
    }
    
    // Create formatted data package
    const formattedPackage = {
      originalData: dataFile,
      formattedData: formattedData,
      formatType: formatType,
      formattedBy: 'TL',
      formattedAt: new Date().toISOString(),
      assignedTo: analystId
    };
    
    // Send to analyst
    const result = await sipComm.sendToAnalyst(formattedPackage, 'formatted-data');
    
    await logAudit(null, 'FORMAT_AND_SEND_TO_ANALYST', null, `Data ${dataId} formatted and sent to Analyst ${analystId}`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Format and send to analyst');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
