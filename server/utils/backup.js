// Automated Backup System for Medical Records Center
const fs = require('fs').promises;
const path = require('path');
const ErrorHandler = require('./error-handler');
const { logAudit } = require('./audit');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.backupSchedule = 2 * 60 * 60 * 1000; // 2 AM daily
    this.maxBackups = 30; // Keep last 30 backups
    this.isBackupRunning = false;
  }

  // Initialize backup system
  async initialize() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('Backup system initialized');
      console.log(`Backup directory: ${this.backupDir}`);
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
      ErrorHandler.logError(error, 'Backup initialization');
    }
  }

  // Create backup
  async createBackup() {
    if (this.isBackupRunning) {
      throw new Error('Backup already in progress');
    }

    this.isBackupRunning = true;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup_${timestamp}.sql`);
      
      // Get database connection
      const db = require('../database');
      
      // Create backup SQL
      const backupSQL = `
        BEGIN TRANSACTION;
        
        -- Backup Patients table
        CREATE TABLE Patients_backup_${timestamp} AS SELECT * FROM Patients;
        
        -- Backup Users table
        CREATE TABLE Users_backup_${timestamp} AS SELECT * FROM Users;
        
        -- Backup Records table
        CREATE TABLE Records_backup_${timestamp} AS SELECT * FROM Records;
        
        -- Backup Messages table
        CREATE TABLE Messages_backup_${timestamp} AS SELECT * FROM Messages;
        
        -- Backup Conversations table
        CREATE TABLE Conversations_backup_${timestamp} AS SELECT * FROM Conversations;
        
        -- Backup AuditLogs table
        CREATE TABLE AuditLogs_backup_${timestamp} AS SELECT * FROM AuditLogs;
        
        -- Backup UserRegistrations table
        CREATE TABLE UserRegistrations_backup_${timestamp} AS SELECT * FROM UserRegistrations;
        
        -- Backup AnalysisResults table
        CREATE TABLE AnalysisResults_backup_${timestamp} AS SELECT * FROM AnalysisResults;
        
        -- Backup AccessPermissions table
        CREATE TABLE AccessPermissions_backup_${timestamp} AS SELECT * FROM AccessPermissions;
        
        -- Backup PasswordResets table
        CREATE TABLE PasswordResets_backup_${timestamp} AS SELECT * FROM PasswordResets;
        
        COMMIT;
      `;
      
      // Execute backup
      await new Promise((resolve, reject) => {
        db.exec(backupSQL, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Save backup info
      const backupInfo = {
        timestamp,
        filename: `backup_${timestamp}.sql`,
        size: await this.getBackupSize(),
        tables: ['Patients', 'Users', 'Records', 'Messages', 'Conversations', 'AuditLogs', 'UserRegistrations', 'AnalysisResults', 'AccessPermissions', 'PasswordResets'],
        path: this.backupDir,
        status: 'completed'
      };
      
      await fs.writeFile(
        path.join(this.backupDir, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      console.log(`Backup completed: ${backupPath}`);
      
      // Log audit
      await logAudit(null, 'BACKUP_COMPLETED', null, `Automated backup created: ${backupPath}`);
      
      this.isBackupRunning = false;
      
      resolve(backupInfo);
    } catch (error) {
      console.error('Backup failed:', error);
      ErrorHandler.logError(error, 'Backup creation');
      reject(error);
    }
  }

  // Get backup size
  async getBackupSize() {
    try {
      const files = await fs.readdir(this.backupDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating backup size:', error);
      return 0;
    }
  }

  // Clean up old backups
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.sql'));
      
      // Sort by creation time (oldest first)
      backupFiles.sort((a, b) => {
        const aTime = a.split('_')[1].split('-').join('');
        const bTime = b.split('_')[1].split('-').join('');
        return aTime.localeCompare(bTime);
      });
      
      // Keep only the most recent backups
      const filesToKeep = backupFiles.slice(-this.maxBackups);
      
      // Delete old backups
      for (const file of backupFiles.slice(this.maxBackups)) {
        const filePath = path.join(this.backupDir, file);
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
      
      console.log(`Cleanup completed. Kept ${filesToKeep.length} recent backups`);
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Get backup history
  async getBackupHistory() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const history = [];
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        
        history.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }
      
      return history.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    } catch (error) {
      console.error('Error loading backup history:', error);
      return [];
    }
  }

  // Restore backup
  async restoreBackup(backupFilename) {
    try {
      const backupPath = path.join(this.backupDir, backupFilename);
      const backupContent = await fs.readFile(backupPath, 'utf8');
      
      // Parse backup SQL
      const statements = backupContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      const db = require('../database');
      
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          // Disable foreign key constraints
          db.run('PRAGMA foreign_keys = OFF');
          
          // Execute restore statements
          for (const stmt of statements) {
            db.run(stmt, (err) => {
              if (err) console.error('Error executing restore statement:', stmt);
            });
          }
          
          // Re-enable foreign keys
          db.run('PRAGMA foreign_keys = ON');
          
          db.run('COMMIT');
          resolve();
        });
      });
      
      console.log(`Backup restored from: ${backupFilename}`);
      
      await logAudit(null, 'BACKUP_RESTORED', null, `Backup restored from: ${backupFilename}`);
      
      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      console.error('Error restoring backup:', error);
      ErrorHandler.logError(error, 'Backup restoration');
      return { success: false, message: 'Backup restoration failed' };
    }
  }

  // Schedule automated backups
  scheduleAutomatedBackups() {
    // This would integrate with a job scheduler like node-cron
    console.log('Automated backup scheduling would be implemented here');
  }
}

module.exports = new BackupManager();
