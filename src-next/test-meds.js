const database = require('./lib/database');

async function testMeds() {
  try {
    console.log('Testing medications query...');
    
    const meds = await database.query(`
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
    
    console.log('Success! Records:', meds?.length);
    console.log('First record:', meds?.[0]);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMeds();
