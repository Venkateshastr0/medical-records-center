import { NextApiRequest, NextApiResponse } from 'next';
const database = require('../../lib/database');

export default async function handler(req, res) {
  try {
    const db = await database.connect();
    
    switch (req.method) {
      case 'GET':
        // Get appointments
        const { date, doctor_id: queryDoctorId, patient_id: queryPatientId, status: queryStatus } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (date) {
          whereClause += ' AND DATE(appointment_date) = ?';
          params.push(date);
        }
        
        if (queryDoctorId) {
          whereClause += ' AND doctor_id = ?';
          params.push(queryDoctorId);
        }
        
        if (queryPatientId) {
          whereClause += ' AND patient_id = ?';
          params.push(queryPatientId);
        }
        
        if (queryStatus) {
          whereClause += ' AND status = ?';
          params.push(queryStatus);
        }
        
        const appointments = await database.query(`
          SELECT a.*, p.first_name, p.last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM appointments a
          JOIN patients p ON a.patient_id = p.patient_id
          JOIN users u ON a.doctor_id = u.id
          ${whereClause}
          ORDER BY a.appointment_date ASC
        `, params);
        
        res.status(200).json({ appointments });
        break;
        
      case 'POST':
        // Create new appointment
        const {
          patient_id: newPatientId,
          doctor_id: newDoctorId,
          appointment_date: newAppointmentDate,
          duration_minutes = 30,
          appointment_type = 'Routine Checkup',
          notes: newNotes
        } = req.body;
        
        // Validate required fields
        if (!newPatientId || !newDoctorId || !newAppointmentDate) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate unique appointment_id
        const appointment_id = `APT${Date.now()}`;
        
        const result = await database.run(`
          INSERT INTO appointments (
            appointment_id, patient_id, doctor_id, appointment_date,
            duration_minutes, appointment_type, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          appointment_id, newPatientId, newDoctorId, newAppointmentDate,
          duration_minutes, appointment_type, newNotes
        ]);
        
        const newAppointment = await database.get(`
          SELECT a.*, p.first_name, p.last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM appointments a
          JOIN patients p ON a.patient_id = p.patient_id
          JOIN users u ON a.doctor_id = u.id
          WHERE a.id = ?
        `, [result.id]);
        
        res.status(201).json({ appointment: newAppointment });
        break;
        
      case 'PUT':
        // Update appointment
        const { id, status: updateStatus, notes: updateNotes, appointment_date: updateDate } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Appointment ID required' });
        }
        
        const updateFields = [];
        const updateParams = [];
        
        if (updateStatus) {
          updateFields.push('status = ?');
          updateParams.push(updateStatus);
        }
        
        if (updateNotes !== undefined) {
          updateFields.push('notes = ?');
          updateParams.push(updateNotes);
        }
        
        if (updateDate) {
          updateFields.push('appointment_date = ?');
          updateParams.push(updateDate);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateParams.push(id);
        
        await database.run(`
          UPDATE appointments 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateParams);
        
        const updatedAppointment = await database.get(`
          SELECT a.*, p.first_name, p.last_name, p.patient_id,
                 u.first_name as doctor_first_name, u.last_name as doctor_last_name
          FROM appointments a
          JOIN patients p ON a.patient_id = p.patient_id
          JOIN users u ON a.doctor_id = u.id
          WHERE a.id = ?
        `, [id]);
        
        res.status(200).json({ appointment: updatedAppointment });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Appointments API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await database.close();
  }
}
