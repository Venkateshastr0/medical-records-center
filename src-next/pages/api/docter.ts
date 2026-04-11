const database = require('../../lib/database');

export default async function handler(req, res) {
  try {
    const doctors = await database.query(`
      SELECT id, first_name, last_name 
      FROM users 
      WHERE role = 'doctor' AND is_active = 1 AND is_approved = 1
    `);

    return res.status(200).json({
      data: doctors
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}