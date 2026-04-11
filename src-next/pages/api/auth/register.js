import { NextApiRequest, NextApiResponse } from 'next';
const authService = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password, firstName, lastName, mobile, role } = req.body;

    // Debug logging
    console.log('Registration request body:', req.body);
    console.log('Extracted fields:', { username, email, password: '***', firstName, lastName, mobile, role });

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !role) {
      console.log('Missing fields check failed:', {
        hasUsername: !!username,
        hasEmail: !!email,
        hasPassword: !!password,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasRole: !!role
      });
      return res.status(400).json({ 
        error: 'Missing required fields: username, email, password, firstName, lastName, role' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Register user
    const user = await authService.register({
      username,
      email,
      password,
      firstName,
      lastName,
      mobile,
      role
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
