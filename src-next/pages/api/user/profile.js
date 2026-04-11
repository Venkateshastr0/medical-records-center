const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For testing, use mock user ID
    const userId = 1;
    const { firstName, lastName, email, profilePhoto, phone, department } = req.body;

    // Update only columns that exist in the schema
    const updatedUser = await database.run(`
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, mobile_number = ?, department = ?
      WHERE id = ?
    `, [firstName, lastName, email, phone, department, userId]);

    // Get updated user data
    const user = await database.get(`
      SELECT id, username, email, first_name, last_name, role, created_at, last_login, mobile_number, department 
      FROM users WHERE id = ?
    `, [userId]);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
}
