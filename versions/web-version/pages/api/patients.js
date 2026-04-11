import { NextApiRequest, NextApiResponse } from 'next';
const database = require('../../lib/database');

export default async function handler(req, res) {
  try {
    const db = await database.connect();
    
    switch (req.method) {
      case 'GET':
        // Get patients with search and filter
        const { search, status, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (search) {
          whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR patient_id LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status && status !== 'All') {
          whereClause += ' AND status = ?';
          params.push(status);
        }
        
        const offset = (page - 1) * limit;
        
        const patients = await database.query(`
          SELECT * FROM patients 
          ${whereClause}
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        // Get additional statistics
        const stats = await database.get(`
          SELECT 
            COUNT(*) as total_patients,
            COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_patients,
            COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_patients,
            COUNT(CASE WHEN date_of_birth >= date('now', '-18 years') THEN 1 END) as pediatric_patients,
            COUNT(CASE WHEN date_of_birth < date('now', '-65 years') THEN 1 END) as elderly_patients,
            COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_this_week
          FROM patients
        `);

        // Get recent medical records for each patient
        for (const patient of patients) {
          const recentRecord = await database.get(`
            SELECT record_id, visit_date, chief_complaint 
            FROM medical_records 
            WHERE patient_id = ? 
            ORDER BY visit_date DESC 
            LIMIT 1
          `, [patient.patient_id]);
          
          patient.recent_record = recentRecord;
          
          // Calculate age
          if (patient.date_of_birth) {
            const birthDate = new Date(patient.date_of_birth);
            const today = new Date();
            const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            patient.age = age;
          }
        }
        
        res.status(200).json({
          patients,
          stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount.count,
            pages: Math.ceil(totalCount.count / limit)
          }
        });
        break;
        
      case 'POST':
        // Create new patient
        const {
          patient_id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          city,
          state,
          zip_code,
          blood_type,
          allergies,
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_policy_number
        } = req.body;
        
        // Validate required fields
        if (!patient_id || !first_name || !last_name || !date_of_birth || !gender) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate unique patient_id if not provided
        const finalPatientId = patient_id || `PAT${Date.now()}`;
        
        const result = await database.run(`
          INSERT INTO patients (
            patient_id, first_name, last_name, date_of_birth, gender,
            phone, email, address, city, state, zip_code, blood_type,
            allergies, emergency_contact_name, emergency_contact_phone,
            insurance_provider, insurance_policy_number
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          finalPatientId, first_name, last_name, date_of_birth, gender,
          phone, email, address, city, state, zip_code, blood_type,
          allergies, emergency_contact_name, emergency_contact_phone,
          insurance_provider, insurance_policy_number
        ]);
        
        const newPatient = await database.get(
          'SELECT * FROM patients WHERE id = ?',
          [result.id]
        );
        
        res.status(201).json({ patient: newPatient });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Patients API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await database.close();
  }
}
