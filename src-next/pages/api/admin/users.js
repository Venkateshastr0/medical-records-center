const database = require('../../../lib/database');
const authService = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔐 Auth check
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = authService.verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // 📊 Fetch users
    const users = await database.query(`
      SELECT 
        id, username, email, first_name, last_name, 
        role, is_approved, is_active, last_login, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}