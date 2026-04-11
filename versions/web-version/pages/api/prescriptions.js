import { NextApiRequest, NextApiResponse } from 'next';
const database = require('../../lib/database');

export default async function handler(req, res) {
  try {
    const db = await database.connect();
    
    switch (req.method) {
      case 'GET':
        // Get prescriptions with filters
        const { status: queryStatus, urgency: queryUrgency, patient_id: queryPatientId, doctor_id: queryDoctorId } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (queryStatus) {
          whereClause += ' AND pr.status = ?';
          params.push(queryStatus);
        }
        
        if (queryUrgency) {
          whereClause += ' AND pr.urgency = ?';
          params.push(queryUrgency);
        }
        
        if (queryPatientId) {
          whereClause += ' AND pr.patient_id = ?';
          params.push(queryPatientId);
        }
        
        if (queryDoctorId) {
          whereClause += ' AND pr.doctor_id = ?';
          params.push(queryDoctorId);
        }
        
        const prescriptions = await database.query(`
          SELECT pr.*, 
                 p.first_name as patient_first_name, p.last_name as patient_last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM prescriptions pr
          JOIN patients p ON pr.patient_id = p.id
          JOIN users u ON pr.doctor_id = u.id
          ${whereClause}
          ORDER BY pr.created_at DESC
        `, params);
        
        res.status(200).json({ prescriptions });
        break;
        
      case 'POST':
        // Create new prescription
        const {
          patient_id: postPatientId,
          doctor_id: postDoctorId,
          medication_name,
          dosage,
          frequency,
          duration,
          instructions,
          urgency: postUrgency = 'normal',
          notes
        } = req.body;
        
        // Validate required fields
        if (!postPatientId || !postDoctorId || !medication_name || !dosage) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate unique prescription_id
        const prescription_id = `RX${Date.now()}`;
        
        const result = await database.run(`
          INSERT INTO prescriptions (
            prescription_id, patient_id, doctor_id, medication_name, dosage,
            frequency, duration, instructions, urgency, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          prescription_id, postPatientId, postDoctorId, medication_name, dosage,
          frequency, duration, instructions, postUrgency, notes
        ]);
        
        const newPrescription = await database.get(`
          SELECT pr.*, 
                 p.first_name as patient_first_name, p.last_name as patient_last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM prescriptions pr
          JOIN patients p ON pr.patient_id = p.id
          JOIN users u ON pr.doctor_id = u.id
          WHERE pr.id = ?
        `, [result.id]);
        
        res.status(201).json({ prescription: newPrescription });
        break;
        
      case 'PUT':
        // Update prescription status
        const { id, status: putStatus, dispensed_by, dispensed_notes } = req.body;
        
        if (!id || !putStatus) {
          return res.status(400).json({ error: 'Prescription ID and status required' });
        }
        
        await database.run(`
          UPDATE prescriptions 
          SET status = ?, dispensed_by = ?, dispensed_notes = ?, dispensed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [putStatus, dispensed_by, dispensed_notes, id]);
        
        const updatedPrescription = await database.get(`
          SELECT pr.*, 
                 p.first_name as patient_first_name, p.last_name as patient_last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM prescriptions pr
          JOIN patients p ON pr.patient_id = p.id
          JOIN users u ON pr.doctor_id = u.id
          WHERE pr.id = ?
        `, [id]);
        
        res.status(200).json({ prescription: updatedPrescription });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Prescriptions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await database.close();
  }
}
