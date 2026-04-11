const database = require('../../../lib/database');

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const { limit = 50, offset = 0, mannerOfDeath, startDate, endDate } = req.query;
        
        let querySql = 'SELECT * FROM deaths WHERE 1=1';
        const params = [];
        
        if (mannerOfDeath) {
          querySql += ' AND manner_of_death = ?';
          params.push(mannerOfDeath);
        }
        
        if (startDate) {
          querySql += ' AND death_date >= ?';
          params.push(startDate);
        }
        
        if (endDate) {
          querySql += ' AND death_date <= ?';
          params.push(endDate);
        }
        
        querySql += ' ORDER BY death_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const deaths = await database.query(querySql, params);
        
        // Get total count
        const countResult = await database.get('SELECT COUNT(*) as total FROM deaths');
        
        res.status(200).json({
          data: deaths,
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      } catch (error) {
        console.error('Error fetching deaths:', error);
        res.status(500).json({ error: 'Failed to fetch death records' });
      }
      break;
      
    case 'POST':
      try {
        const deathData = req.body;
        const result = await database.run(
          `INSERT INTO deaths (death_id, patient_id, death_date, death_time, cause_of_death, 
           icd10_cause_code, secondary_condition, manner_of_death, place_of_death, 
           attending_doctor_id, death_certificate_number, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            deathData.death_id,
            deathData.patient_id,
            deathData.death_date,
            deathData.death_time,
            deathData.cause_of_death,
            deathData.icd10_cause_code,
            deathData.secondary_condition,
            deathData.manner_of_death,
            deathData.place_of_death,
            deathData.attending_doctor_id,
            deathData.death_certificate_number,
            deathData.notes
          ]
        );
        
        res.status(201).json({ 
          message: 'Death record created successfully',
          id: result.id 
        });
      } catch (error) {
        console.error('Error creating death record:', error);
        res.status(500).json({ error: 'Failed to create death record' });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
