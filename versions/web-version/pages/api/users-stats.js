const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get real user statistics from database
    const userStats = await database.get(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
        COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week,
        COUNT(CASE WHEN last_login >= date('now', '-30 days') THEN 1 END) as active_this_month,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month
      FROM users
    `);

    // Get user breakdown by role
    const userByRole = await database.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count,
        COUNT(CASE WHEN last_login >= date('now', '-7 days') THEN 1 END) as active_this_week
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);

    // Get individual user details for management
    const userDetails = await database.query(`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        email,
        role,
        is_active,
        created_at,
        last_login,
        CASE 
          WHEN last_login >= date('now', '-7 days') THEN 'Active'
          WHEN last_login >= date('now', '-30 days') THEN 'Recently Active'
          ELSE 'Inactive'
        END as activity_status
      FROM users 
      ORDER BY created_at DESC
    `);

    // Get login activity trends (last 30 days)
    const loginTrends = await database.query(`
      SELECT 
        DATE(last_login) as date,
        COUNT(*) as logins
      FROM users 
      WHERE last_login >= date('now', '-30 days')
      GROUP BY DATE(last_login)
      ORDER BY date DESC
    `);

    // Format activity status for each user
    const formattedUsers = userDetails.map(user => ({
      ...user,
      is_active: Boolean(user.is_active),
      last_login: user.last_login ? new Date(user.last_login).toISOString() : null,
      created_at: new Date(user.created_at).toISOString()
    }));

    res.status(200).json({
      overview: userStats,
      by_role: userByRole,
      users: formattedUsers,
      login_trends: loginTrends,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
}
