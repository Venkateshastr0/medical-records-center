const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class AuthService {
  // Register new user
  async register(userData) {
    const { username, email, password, firstName, lastName, role = 'staff' } = userData;
    
    try {
      // Check if user already exists
      const existingUser = await database.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      const result = await database.run(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, passwordHash, firstName, lastName, role]
      );
      
      // Get created user
      const user = await database.get(
        'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
        [result.id]
      );
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  // Login user
  async login(username, password) {
    try {
      // Find user by username
      const user = await database.get(
        'SELECT id, username, email, password_hash, first_name, last_name, role, is_active FROM users WHERE username = ?',
        [username]
      );
      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }
      
      // Update last login
      await database.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
      
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
      const user = await database.get(
        'SELECT id, username, email, first_name, last_name, role, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  // Update user profile
  async updateUser(userId, updateData) {
    const { firstName, lastName, email } = updateData;
    
    try {
      await database.run(
        'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
        [firstName, lastName, email, userId]
      );
      
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current password hash
      const user = await database.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await database.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
