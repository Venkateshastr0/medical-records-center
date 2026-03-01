const express = require('express');
const router = express.Router();
const interServerComm = require('../utils/inter-server-comm');
const { logAudit } = require('../utils/audit');
const ErrorHandler = require('../utils/error-handler');

// Receive data from hospital server
router.post('/receive', async (req, res) => {
  try {
    const { type, data, timestamp, source, checksum } = req.body;
    
    // Verify API key
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.COMPANY_API_KEY || 'company-secure-key-2024';
    
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

// Send admin updates to hospital server
router.post('/send-updates', async (req, res) => {
  try {
    const { updateType, updateData, targetRole } = req.body;
    
    if (!updateType || !updateData) {
      return res.status(400).json({
        success: false,
        message: 'Update type and data are required'
      });
    }
    
    // Send to hospital server
    const result = await interServerComm.sendToHospital({
      updateType: updateType,
      updateData: updateData,
      targetRole: targetRole,
      sentBy: 'Company Server',
      sentAt: new Date().toISOString()
    }, 'admin-updates');
    
    await logAudit(null, 'SEND_UPDATES_TO_HOSPITAL', null, `Sent ${updateType} updates to hospital`);
    
    res.json(result);
    
  } catch (error) {
    ErrorHandler.logError(error, 'Send updates to hospital');
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
