const database = require('../../../lib/database');
const authService = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = authService.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, approve } = req.body;
    if (userId === undefined || approve === undefined) {
      return res.status(400).json({ error: 'Missing userId or approve status' });
    }

    await database.run(
      'UPDATE users SET is_approved = ? WHERE id = ?',
      [approve ? 1 : 0, userId]
    );

    res.status(200).json({ message: `User ${approve ? 'approved' : 'unapproved'} successfully` });
  } catch (error) {
    console.error('Error updating user approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
