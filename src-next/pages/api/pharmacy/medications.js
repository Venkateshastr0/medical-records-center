const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('Fetching medications...');
      
      // Get all medications with stock info
      const medications = await database.query(`
        SELECT 
          id, medication_id, name, generic_name, category, 
          unit_price, stock_quantity, reorder_level, 
          manufacturer, expiry_date, storage_location, is_active,
          CASE 
            WHEN stock_quantity <= reorder_level THEN 'LOW'
            WHEN stock_quantity > reorder_level * 3 THEN 'HIGH'
            ELSE 'NORMAL'
          END as stock_status
        FROM medications
        WHERE is_active = 1
        ORDER BY name
      `);

      console.log('Fetched medications:', medications?.length || 0);
      res.status(200).json(medications || []);
    } catch (error) {
      console.error('Error fetching medications:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: `Failed to fetch medications: ${error.message}` });
    }
  } else if (req.method === 'POST') {
    try {
      // Add new medication
      const { name, generic_name, category, unit_price, stock_quantity, reorder_level, reorder_quantity, manufacturer, storage_location } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Medication name is required' });
      }

      const result = await database.run(`
        INSERT INTO medications (medication_id, name, generic_name, category, unit_price, stock_quantity, reorder_level, reorder_quantity, manufacturer, storage_location)
        VALUES (
          'MED' || SUBSTR('00000' || (SELECT COUNT(*) + 1 FROM medications), -5),
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [name, generic_name, category, unit_price, stock_quantity || 0, reorder_level || 10, reorder_quantity || 50, manufacturer, storage_location]);

      console.log('Added medication:', result.id);
      res.status(201).json({ id: result.id, message: 'Medication added successfully' });
    } catch (error) {
      console.error('Error adding medication:', error.message);
      res.status(500).json({ error: `Failed to add medication: ${error.message}` });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
