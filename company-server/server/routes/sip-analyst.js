const express = require('express');
const router = express.Router();
const sipComm = require('../utils/sip-communication');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Get analyst personal storage
router.get('/personal-storage', async (req, res) => {
  try {
    const result = await sipComm.getPersonalStorage('analyst');
    res.json(result);
  } catch (error) {
    ErrorHandler.logError(error, 'Get analyst personal storage');
    ErrorHandler.apiError(res, error);
  }
});

// Download file from personal storage
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = `./personal-storage/analyst/${filename}`;
    
    const fs = require('fs').promises;
    const content = await fs.readFile(filepath, 'utf8');
    const data = JSON.parse(content);
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Download analyst file');
    ErrorHandler.apiError(res, error);
  }
});

// Process and send formatted data to main server
router.post('/send-to-main', async (req, res) => {
  try {
    const { dataId, processedData, summary } = req.body;
    
    if (!dataId || !processedData) {
      return res.status(400).json({
        success: false,
        message: 'Data ID and processed data are required'
      });
    }
    
    // Get original data
    const analystStorage = await sipComm.getPersonalStorage('analyst');
    const dataFile = analystStorage.files.find(f => f.filename.includes(dataId));
    
    if (!dataFile) {
      return res.status(404).json({
        success: false,
        message: 'Data not found in analyst storage'
      });
    }
    
    // Create final data package
    const finalPackage = {
      originalData: dataFile,
      processedData: processedData,
      summary: summary,
      processedBy: 'Analyst',
      processedAt: new Date().toISOString(),
      workflow: 'analyst-to-main'
    };
    
    // Send to main server
    const result = await sipComm.sendToMainServer(finalPackage, 'final-processed-data');
    
    await logAudit(null, 'SEND_TO_MAIN_SERVER', null, `Processed data ${dataId} sent to main server via SIP`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Send to main server');
    ErrorHandler.apiError(res, error);
  }
});

// Get processing status
router.get('/processing-status/:dataId', async (req, res) => {
  try {
    const { dataId } = req.params;
    
    const analystStorage = await sipComm.getPersonalStorage('analyst');
    const dataFile = analystStorage.files.find(f => f.filename.includes(dataId));
    
    if (!dataFile) {
      return res.status(404).json({
        success: false,
        message: 'Data not found in analyst storage'
      });
    }
    
    res.json({
      success: true,
      status: 'processing',
      data: dataFile
    });
    
  } catch (error) {
    ErrorHandler.logError(error, 'Get processing status');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
