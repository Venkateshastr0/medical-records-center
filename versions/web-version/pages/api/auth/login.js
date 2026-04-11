import { NextApiRequest, NextApiResponse } from 'next';
const authService = require('../../../lib/auth-mock'); // Using mock auth for now

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, password' 
      });
    }

    // Login user
    const result = await authService.login(username, password);

    // Set HTTP-only cookie with token
    res.setHeader('Set-Cookie', [
      `token=${result.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
      `user=${JSON.stringify(result.user)}; Path=/; Max-Age=86400; SameSite=Strict`
    ]);

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('deactivated')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
