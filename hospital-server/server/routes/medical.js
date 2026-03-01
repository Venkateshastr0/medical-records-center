const express = require('express');
const router = express.Router();
const { logAudit } = require('../utils/audit');
const hipaaCompliance = require('../utils/hipaa-compliance');
const ErrorHandler = require('../utils/error-handler');

// Get doctor's patients
router.get('/my-patients', async (req, res) => {
  try {
    const db = require('../db/database');
    
    // In real app, get doctor ID from authentication
    const doctorId = 1; // Placeholder
    
    const patients = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, 
               COUNT(r.record_id) as record_count,
               MAX(r.created_at) as last_visit
        FROM Patients p
        LEFT JOIN Records r ON p.patient_id = r.patient_id
        WHERE p.created_by = ?
        GROUP BY p.patient_id
        ORDER BY p.created_at DESC
      `, [doctorId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    await logAudit(doctorId, 'VIEW_MY_PATIENTS', null, 'Doctor viewed their assigned patients');
    
    res.json({
      success: true,
      patients: patients
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Get doctor\'s patients');
    ErrorHandler.apiError(res, error);
  }
});

// Create medical report for patient
router.post('/create-report', async (req, res) => {
  try {
    const db = require('../db/database');
    const {
      patientId,
      diagnosis,
      treatment,
      prescription,
      notes,
      reportTo
    } = req.body;

    // Validate required fields
    if (!patientId || !diagnosis || !treatment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Patient ID, diagnosis, and treatment are required'
      });
    }

    // Log medical report creation
    await hipaaCompliance.logHIPAAEvent({
      eventType: 'MEDICAL_REPORT',
      resourceType: 'medical_records',
      action: 'CREATE',
      ipAddress: req.ip,
      details: `Medical report created for patient ${patientId}`
    });

    // Create medical record
    const recordId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO Records (
          patient_id, type, diagnosis, treatment, prescription, 
          notes, created_by, created_at, report_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patientId,
        'Medical Report',
        diagnosis,
        treatment,
        prescription || null,
        notes || null,
        1, // Doctor ID
        new Date().toISOString(),
        reportTo || null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    await logAudit(1, 'CREATE_MEDICAL_REPORT', patientId, `Medical report created for patient ${patientId}`);

    res.json({
      success: true,
      message: 'Medical report created successfully',
      recordId: recordId
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Create medical report');
    ErrorHandler.apiError(res, error);
  }
});

// Send report to company/insurance
router.post('/send-report', async (req, res) => {
  try {
    const { recordId, recipientType, recipientDetails } = req.body;

    // Validate required fields
    if (!recordId || !recipientType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Record ID and recipient type are required'
      });
    }

    // Log report sending
    await hipaaCompliance.logHIPAAEvent({
      eventType: 'REPORT_SENT',
      resourceType: 'medical_records',
      action: 'SEND_EXTERNAL',
      ipAddress: req.ip,
      details: `Medical report ${recordId} sent to ${recipientType}`
    });

    // In real implementation, this would:
    // 1. Encrypt the report data
    // 2. Send to external company server via secure API
    // 3. Log the transmission
    // 4. Update record status

    await logAudit(null, 'SEND_REPORT_EXTERNAL', recordId, `Report sent to ${recipientType}`);

    res.json({
      success: true,
      message: `Report sent to ${recipientType} successfully`,
      recordId: recordId,
      recipientType: recipientType
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Send report to company');
    ErrorHandler.apiError(res, error);
  }
});

// Get medical reports for patient
router.get('/patient-reports/:patientId', async (req, res) => {
  try {
    const db = require('../db/database');
    const { patientId } = req.params;

    const reports = await new Promise((resolve, reject) => {
      db.all(`
        SELECT r.*, u.name as created_by_name
        FROM Records r
        JOIN Users u ON r.created_by = u.user_id
        WHERE r.patient_id = ? AND r.type = 'Medical Report'
        ORDER BY r.created_at DESC
      `, [patientId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    await logAudit(null, 'VIEW_PATIENT_REPORTS', patientId, `Medical reports viewed for patient ${patientId}`);

    res.json({
      success: true,
      reports: reports,
      patientId: patientId
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Get patient medical reports');
    ErrorHandler.apiError(res, error);
  }
});

module.exports = router;
