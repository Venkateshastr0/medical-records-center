const express = require('express');
const router = express.Router();
const { logAudit } = require('../utils/audit');
const hipaaCompliance = require('../utils/hipaa-compliance');
const ErrorHandler = require('../utils/error-handler');

// Get today's patients
router.get('/today-patients', async (req, res) => {
  try {
    const db = require('../db/database');
    
    const today = new Date().toISOString().split('T')[0];
    
    const patients = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, 
               COUNT(r.record_id) as record_count,
               MAX(r.created_at) as last_visit
        FROM Patients p
        LEFT JOIN Records r ON p.patient_id = r.patient_id
        WHERE DATE(p.created_at) = ?
        GROUP BY p.patient_id
        ORDER BY p.created_at DESC
      `, [today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    await logAudit(null, 'VIEW_TODAY_PATIENTS', null, 'Reception viewed today\'s patients');
    
    res.json({
      success: true,
      patients: patients,
      date: today
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Get today\'s patients');
    ErrorHandler.apiError(res, error);
  }
});

// Register new patient
router.post('/register-patient', async (req, res) => {
  try {
    const db = require('../db/database');
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      allergies,
      medicalHistory,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      registeredBy
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: First name, last name, date of birth, gender, and phone are required'
      });
    }

    // Log patient registration
    await hipaaCompliance.logHIPAAEvent({
      eventType: 'PATIENT_REGISTRATION',
      resourceType: 'patient_records',
      action: 'CREATE',
      ipAddress: req.ip,
      details: `New patient registration: ${firstName} ${lastName}`
    });

    // Insert patient
    const patientId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO Patients (
          name, age, phone, email, address, blood_group, 
          allergies, medical_history, emergency_contact, 
          emergency_phone, emergency_relation, registered_by, 
          registration_date, date_of_birth, gender, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `${firstName} ${lastName}`,
        calculateAge(dateOfBirth),
        phone,
        email || null,
        address || null,
        bloodGroup || null,
        allergies || null,
        medicalHistory || null,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation || null,
        registeredBy,
        new Date().toISOString(),
        dateOfBirth,
        gender,
        'Active'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    await logAudit(patientId, 'PATIENT_REGISTRATION', null, `Patient ${firstName} ${lastName} registered by ${registeredBy}`);

    res.json({
      success: true,
      message: 'Patient registered successfully',
      patientId: patientId
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Patient registration');
    ErrorHandler.apiError(res, error);
  }
});

// Search patients
router.get('/search-patients', async (req, res) => {
  try {
    const db = require('../db/database');
    const { query, limit = 20, offset = 0 } = req.query;

    let searchQuery = `
      SELECT p.*, 
             COUNT(r.record_id) as record_count,
             MAX(r.created_at) as last_visit
      FROM Patients p
      LEFT JOIN Records r ON p.patient_id = r.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      searchQuery += ` AND (p.name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    searchQuery += `
      GROUP BY p.patient_id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));

    const patients = await new Promise((resolve, reject) => {
      db.all(searchQuery, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT patient_id) as total FROM Patients p WHERE 1=1';
    let countParams = [];

    if (query) {
      countQuery += ` AND (p.name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)`;
      const searchTerm = `%${query}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    await logAudit(null, 'SEARCH_PATIENTS', null, `Patient search: ${query || 'all'}`);

    res.json({
      success: true,
      patients: patients,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
      }
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Search patients');
    ErrorHandler.apiError(res, error);
  }
});

// Get patient details
router.get('/patient/:id', async (req, res) => {
  try {
    const db = require('../db/database');
    const { id } = req.params;

    const patient = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, 
               COUNT(r.record_id) as record_count,
               GROUP_CONCAT(r.type) as record_types
        FROM Patients p
        LEFT JOIN Records r ON p.patient_id = r.patient_id
        WHERE p.patient_id = ?
        GROUP BY p.patient_id
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await logAudit(id, 'VIEW_PATIENT', null, `Patient details viewed: ${patient.name}`);

    res.json({
      success: true,
      patient: patient
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Get patient details');
    ErrorHandler.apiError(res, error);
  }
});

// Update patient information
router.put('/patient/:id', async (req, res) => {
  try {
    const db = require('../db/database');
    const { id } = req.params;
    const updateData = req.body;

    // Check if patient exists
    const existingPatient = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM Patients WHERE patient_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'patient_id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(id);

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE Patients 
        SET ${updateFields.join(', ')}, updated_at = ?
        WHERE patient_id = ?
      `, [...updateValues, new Date().toISOString()], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await hipaaCompliance.logHIPAAEvent({
      eventType: 'PATIENT_UPDATE',
      resourceType: 'patient_records',
      action: 'UPDATE',
      ipAddress: req.ip,
      details: `Patient ${existingPatient.name} information updated`
    });

    await logAudit(id, 'PATIENT_UPDATE', null, `Patient information updated`);

    res.json({
      success: true,
      message: 'Patient information updated successfully'
    });

  } catch (error) {
    ErrorHandler.logError(error, 'Update patient');
    ErrorHandler.apiError(res, error);
  }
});

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

module.exports = router;
