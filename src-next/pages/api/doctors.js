const database = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const doctors = await database.query(`
      SELECT id, username, first_name, last_name, email, is_approved, is_active
      FROM users 
      WHERE role = 'doctor' AND is_approved = 1 AND is_active = 1
      ORDER BY first_name ASC
    `);

    // Format for easier use in frontend - provide both formatted name and individual fields
    const formattedDoctors = doctors.map(doc => ({
      id: doc.id,
      username: doc.username,
      first_name: doc.first_name,
      last_name: doc.last_name,
      email: doc.email,
      name: doc.first_name && doc.last_name ? `Dr. ${doc.first_name} ${doc.last_name}` : `Dr. ${doc.username}`,
      displayName: doc.first_name && doc.last_name ? `${doc.first_name} ${doc.last_name}` : doc.username
    }));

    res.status(200).json({ data: formattedDoctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors', details: error.message });
  }
}
