const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class AuthService {
  // Register new user
  async register(userData) {
    const { username, email, password, firstName, lastName, mobile, role = 'staff' } = userData;
    
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
        `INSERT INTO users (username, email, password_hash, first_name, last_name, mobile_number, role, is_approved) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, passwordHash, firstName, lastName, mobile, role, role === 'admin' ? 1 : 0]
      );
      
      // Get created user
      const user = await database.get(
        'SELECT id, username, email, first_name, last_name, mobile_number, role, is_approved FROM users WHERE id = ?',
        [result.id]
      );
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  // Login user (accepts username or email)
  async login(usernameOrEmail, password) {
    try {
      // Find user by username OR email
      const user = await database.get(
        'SELECT id, username, email, password_hash, first_name, last_name, role, is_active, is_approved, profile_photo, mobile_number, department FROM users WHERE username = ? OR email = ?',
        [usernameOrEmail, usernameOrEmail]
      );
      
      if (!user) {
        throw new Error('Invalid username, email, or password');
      }
      
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Check if account is approved by admin
      if (!user.is_approved) {
        throw new Error('Account is pending admin approval. Please wait for administrator to grant access.');
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
          id: user.id, 
          username: user.username, 
          role: (user.role || '').toLowerCase()
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remove password hash and return mapped user object
      const { password_hash, profile_photo, mobile_number, first_name, last_name, ...others } = user;
      
      const role = (others.role || '').toLowerCase();
      const isSystemAdmin = (role === 'admin');
      const isDoctor = (role === 'doctor');

      return {
        user: {
          ...others,
          role,
          firstName: isSystemAdmin ? 'Venkatesh' : (isDoctor ? (first_name.startsWith('Dr.') ? first_name : `Dr. ${first_name}`) : first_name),
          lastName: isSystemAdmin ? 'M' : last_name,
          profilePhoto: isSystemAdmin ? null : profile_photo,
          phone: isSystemAdmin ? '+91 9922008184' : mobile_number,
          department: isSystemAdmin ? 'Administrator Dashboard' : (isDoctor ? 'Internal Medicine' : user.department)
        },
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
        'SELECT id, username, email, first_name, last_name, role, created_at, last_login, profile_photo, mobile_number, department FROM users WHERE id = ?',
        [userId]
      );
      
      const { profile_photo, mobile_number, first_name, last_name, ...others } = user;
      const role = (others.role || '').toLowerCase();
      const isSystemAdmin = (role === 'admin');
      const isDoctor = (role === 'doctor');

      return { 
        ...others, 
        role,
        firstName: isSystemAdmin ? 'Venkatesh' : (isDoctor ? (first_name.startsWith('Dr.') ? first_name : `Dr. ${first_name}`) : first_name),
        lastName: isSystemAdmin ? 'M' : last_name,
        profilePhoto: isSystemAdmin ? null : profile_photo,
        phone: isSystemAdmin ? '+91 9922008184' : mobile_number,
        department: isSystemAdmin ? 'Administrator Dashboard' : (isDoctor ? 'Internal Medicine' : user.department)
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update user profile
  async updateUser(userId, updateData) {
    const { firstName, lastName, email, profilePhoto, phone, department } = updateData;
    
    try {
      await database.run(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, profile_photo = ?, mobile_number = ?, department = ? WHERE id = ?',
        [firstName, lastName, email, profilePhoto, phone, department, userId]
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
