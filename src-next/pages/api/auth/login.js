import { serialize } from 'cookie';
const authService = require('../../../lib/auth');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, password'
      });
    }

    // Authenticate user
    const result = await authService.login(username, password);

    const isProd = process.env.NODE_ENV === 'production';

    // Store only safe user data in cookie
    const safeUser = {
      id: result.user.id,
      name: result.user.name || result.user.username,
      role: result.user.role
    };

    const userCookie = encodeURIComponent(JSON.stringify(safeUser));

    // Set cookies securely
    res.setHeader('Set-Cookie', [
      serialize('token', result.token, {
        httpOnly: true,
        secure: isProd,
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
        sameSite: 'strict'
      }),
      serialize('user', userCookie, {
        httpOnly: false, // frontend may read this
        secure: isProd,
        maxAge: 60 * 60 * 24,
        path: '/',
        sameSite: 'strict'
      })
    ]);

    // Success response - include token in response for frontend storage
    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: safeUser
    });

  } catch (error) {
    const message = error?.message || 'Internal server error';

    if (
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('deactivated')
    ) {
      return res.status(401).json({ error: message });
    }

    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}