const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock user data for demo
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@medical.com',
    password_hash: '$2b$10$8K1p/a0dQq8Q8Q8Q8Q8Q8O8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8', // admin123
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true
  },
  {
    id: 2,
    username: 'doctor',
    email: 'doctor@medical.com',
    password_hash: '$2b$10$8K1p/a0dQq8Q8Q8Q8Q8Q8O8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', // doctor123
    first_name: 'Doctor',
    last_name: 'Smith',
    role: 'doctor',
    is_active: true
  },
  {
    id: 3,
    username: 'nurse',
    email: 'nurse@medical.com',
    password_hash: '$2b$10$8K1p/a0dQq8Q8Q8Q8Q8Q8O8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', // nurse123
    first_name: 'Nurse',
    last_name: 'Johnson',
    role: 'nurse',
    is_active: true
  },
  {
    id: 4,
    username: 'receptionist',
    email: 'receptionist@medical.com',
    password_hash: '$2b$10$8K1p/a0dQq8Q8Q8Q8Q8Q8O8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', // recept123
    first_name: 'Receptionist',
    last_name: 'Wilson',
    role: 'receptionist',
    is_active: true
  },
  {
    id: 5,
    username: 'pharmacy',
    email: 'pharmacy@medical.com',
    password_hash: '$2b$10$8K1p/a0dQq8Q8Q8Q8Q8Q8O8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', // pharm123
    first_name: 'Pharmacy',
    last_name: 'Tech',
    role: 'pharmacy',
    is_active: true
  }
];

class MockAuthService {
  // Login user
  async login(username, password) {
    try {
      // Find user by username
      const user = mockUsers.find(u => u.username === username);
      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }
      
      // Simple password check for demo
      const validPasswords = {
        'admin': 'admin123',
        'doctor': 'doctor123',
        'nurse': 'nurse123',
        'receptionist': 'recept123',
        'pharmacy': 'pharm123'
      };
      
      if (password !== validPasswords[username]) {
        throw new Error('Invalid username or password');
      }
      
      // Create JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  // Get user by ID
  async getUserById(userId) {
    try {
      const user = mockUsers.find(u => u.id === parseInt(userId));
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MockAuthService();
