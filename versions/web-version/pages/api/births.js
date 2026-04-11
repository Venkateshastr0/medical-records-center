const database = require('../../../lib/database');

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const { limit = 50, offset = 0, gender, startDate, endDate } = req.query;
        
        let querySql = 'SELECT * FROM births WHERE 1=1';
        const params = [];
        
        if (gender) {
          querySql += ' AND newborn_gender = ?';
          params.push(gender);
        }
        
        if (startDate) {
          querySql += ' AND birth_date >= ?';
          params.push(startDate);
        }
        
        if (endDate) {
          querySql += ' AND birth_date <= ?';
          params.push(endDate);
        }
        
        querySql += ' ORDER BY birth_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const births = await database.query(querySql, params);
        
        // Get total count
        const countResult = await database.get('SELECT COUNT(*) as total FROM births');
        
        res.status(200).json({
          data: births,
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      } catch (error) {
        console.error('Error fetching births:', error);
        res.status(500).json({ error: 'Failed to fetch birth records' });
      }
      break;
      
    case 'POST':
      try {
        const birthData = req.body;
        const result = await database.run(
          `INSERT INTO births (birth_id, mother_patient_id, newborn_patient_id, mother_name, father_name, 
           birth_date, birth_time, newborn_gender, birth_weight, apgar_score, delivery_type, 
           complication, gestation_weeks, attending_doctor_id, ward, newborn_condition, 
           nicu_admission, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            birthData.birth_id,
            birthData.mother_patient_id,
            birthData.newborn_patient_id,
            birthData.mother_name,
            birthData.father_name,
            birthData.birth_date,
            birthData.birth_time,
            birthData.newborn_gender,
            birthData.birth_weight,
            birthData.apgar_score,
            birthData.delivery_type,
            birthData.complication,
            birthData.gestation_weeks,
            birthData.attending_doctor_id,
            birthData.ward,
            birthData.newborn_condition,
            birthData.nicu_admission,
            birthData.notes
          ]
        );
        
        res.status(201).json({ 
          message: 'Birth record created successfully',
          id: result.id 
        });
      } catch (error) {
        console.error('Error creating birth record:', error);
        res.status(500).json({ error: 'Failed to create birth record' });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
