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

    // 📊 Fetch logs
    const logs = await database.query(`
      SELECT 
        u.username, 
        u.first_name, 
        u.last_name, 
        'LOGIN' as action, 
        u.last_login as timestamp,
        'SUCCESS' as status
      FROM users u
      WHERE u.last_login IS NOT NULL

      UNION ALL

      SELECT 
        u.username, 
        u.first_name, 
        u.last_name, 
        al.action, 
        al.created_at as timestamp,
        'AUDIT' as status
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id

      ORDER BY timestamp DESC
      LIMIT 100
    `);

    res.status(200).json(logs);

  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}