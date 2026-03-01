const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { exec } = require('child_process');

class DisasterRecoverySystem {
  constructor() {
    this.backupDirectory = './backups';
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || 'backup-encryption-key-2024';
    this.compressionLevel = 9;
    this.maxBackupSize = 100 * 1024 * 1024; // 100MB
    this.retentionDays = 30;
    this.backupSchedule = {
      full: '0 2 * * * *',         // Daily at 2 AM
      incremental: '0 */2 * * * *',  // Every 2 hours
      differential: '0 6,14,22 * * * *' // Every 6 hours on specific days
    };
    this.recoveryPointObjective = 15; // 15 minutes
    this.recoveryTimeObjective = 60; // 1 hour
    this.backupVerification = true;
    this.offsiteBackup = true;
    this.isRunning = false;
  }

  // Initialize disaster recovery system
  async initialize() {
    try {
      console.log('🔧 Initializing disaster recovery system...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Verify backup configuration
      await this.verifyBackupConfiguration();
      
      // Start backup scheduler
      this.startBackupScheduler();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('✅ Disaster recovery system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize disaster recovery system:', error);
      throw error;
    }
  }

  // Create backup directories
  async createBackupDirectories() {
    const directories = [
      this.backupDirectory,
      `${this.backupDirectory}/full`,
      `${this.backupDirectory}/incremental`,
      `${this.backupDirectory}/differential`,
      `${this.backupDirectory}/offsite`,
      `${this.backupDirectory}/verification`,
      `${this.backupDirectory}/logs`,
      `${this.backupDirectory}/metadata`
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Verify backup configuration
  async verifyBackupConfiguration() {
    const checks = {
      diskSpace: await this.checkDiskSpace(),
      encryptionKey: this.encryptionKey ? true : false,
      backupDirectory: await this.checkDirectoryExists(this.backupDirectory),
      permissions: await this.checkDirectoryPermissions(this.backupDirectory)
    };

    if (!checks.diskSpace) {
      throw new Error('Insufficient disk space for backups');
    }

    if (!checks.encryptionKey) {
      throw new Error('Backup encryption key not configured');
    }

    if (!checks.backupDirectory) {
      throw new Error('Backup directory does not exist');
    }

    if (!checks.permissions) {
      throw new Error('Insufficient permissions for backup directory');
    }

    return checks;
  }

  // Check disk space
  async checkDiskSpace() {
    return new Promise((resolve) => {
      exec('dir /-c', (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        
        const lines = stdout.split('\n');
        const lastLine = lines[lines.length - 2];
        if (lastLine) {
          const parts = lastLine.trim().split(/\s+/);
          const totalSpace = parseInt(parts[1]) * 1024;
          const freeSpace = parseInt(parts[3]) * 1024;
          resolve(freeSpace > (10 * 1024 * 1024 * 1024)); // 10GB free
        } else {
          resolve(false);
        }
      });
    });
  }

  // Check directory exists
  async checkDirectoryExists(dir) {
    try {
      await fs.access(dir);
      return true;
    } catch {
      return false;
    }
  }

  // Check directory permissions
  async checkDirectoryPermissions(dir) {
    try {
      await fs.access(dir, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  // Start backup scheduler
  startBackupScheduler() {
    // Full backup daily at 2 AM
    setInterval(async () => {
      if (!this.isRunning) {
        try {
          await this.createFullBackup();
        } catch (error) {
          console.error('❌ Full backup failed:', error);
        }
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Incremental backup every 2 hours
    setInterval(async () => {
      if (!this.isRunning) {
        try {
          await this.createIncrementalBackup();
        } catch (error) {
          console.error('❌ Incremental backup failed:', error);
        }
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Differential backup every 6 hours
    setInterval(async () => {
      if (!this.isRunning) {
        try {
          await this.createDifferentialBackup();
        } catch (error) {
          console.error('❌ Differential backup failed:', error);
        }
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  // Create full backup
  async createFullBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full-backup-${timestamp}`;
    const backupPath = `${this.backupDirectory}/full/${backupName}`;
    
    console.log(`📦 Creating full backup: ${backupName}`);
    this.isRunning = true;

    try {
      // Create backup metadata
      const metadata = {
        type: 'full',
        timestamp: timestamp,
        name: backupName,
        path: backupPath,
        size: 0,
        checksum: null,
        encrypted: true,
        compressed: true,
        databases: ['hospital', 'company'],
        files: [],
        encryptionKey: this.encryptionKey,
        compressionLevel: this.compressionLevel
      };

      // Backup databases
      const dbFiles = [
        './hospital-server/database.sqlite',
        './company-server/database.sqlite'
      ];

      for (const dbFile of dbFiles) {
        const dbBackupPath = `${backupPath}/${path.basename(dbFile)}`;
        await fs.copyFile(dbFile, dbBackupPath);
        metadata.files.push({
          original: dbFile,
          backup: dbBackupPath,
          type: 'database',
          checksum: await this.calculateFileChecksum(dbBackupPath)
        });
      }

      // Backup application files
      const appFiles = [
        './hospital-server',
        './company-server',
        './client'
      ];

      for (const appFile of appFiles) {
        const appBackupPath = `${backupPath}/${path.basename(appFile)}`;
        await this.copyDirectory(appFile, appBackupPath);
        metadata.files.push({
          original: appFile,
          backup: appBackupPath,
          type: 'application',
          checksum: await this.calculateDirectoryChecksum(appBackupPath)
        });
      }

      // Calculate total size
      metadata.size = await this.calculateDirectorySize(backupPath);

      // Compress backup
      const compressedPath = `${backupPath}.tar.gz`;
      await this.compressDirectory(backupPath, compressedPath);

      // Encrypt backup
      const encryptedPath = `${compressedPath}.enc`;
      await this.encryptFile(compressedPath, encryptedPath);

      // Update metadata
      metadata.compressedPath = compressedPath;
      metadata.encryptedPath = encryptedPath;
      metadata.checksum = await this.calculateFileChecksum(encryptedPath);

      // Save metadata
      const metadataPath = `${this.backupDirectory}/metadata/${backupName}.json`;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Verify backup
      if (this.backupVerification) {
        await this.verifyBackup(encryptedPath, metadata);
      }

      // Create offsite backup
      if (this.offsiteBackup) {
        await this.createOffsiteBackup(encryptedPath, metadata);
      }

      // Cleanup temporary files
      await fs.rm(backupPath, { recursive: true });
      await fs.unlink(compressedPath);

      console.log(`✅ Full backup completed: ${backupName}`);
      
      // Log backup event
      await this.logBackupEvent('FULL_BACKUP_COMPLETED', metadata);
      
      return metadata;
    } catch (error) {
      console.error('❌ Full backup failed:', error);
      await this.logBackupEvent('FULL_BACKUP_FAILED', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Create incremental backup
  async createIncrementalBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `incremental-backup-${timestamp}`;
    const backupPath = `${this.backupDirectory}/incremental/${backupName}`;
    
    console.log(`📦 Creating incremental backup: ${backupName}`);
    this.isRunning = true;

    try {
      // Get last full backup
      const lastFullBackup = await this.getLastFullBackup();
      if (!lastFullBackup) {
        throw new Error('No full backup found for incremental backup');
      }

      // Create backup metadata
      const metadata = {
        type: 'incremental',
        timestamp: timestamp,
        name: backupName,
        path: backupPath,
        size: 0,
        checksum: null,
        encrypted: true,
        compressed: true,
        databases: ['hospital', 'company'],
        files: [],
        baseBackup: lastFullBackup,
        encryptionKey: this.encryptionKey,
        compressionLevel: this.compressionLevel
      };

      // Find changed files since last backup
      const changedFiles = await this.getChangedFiles(lastFullBackup.timestamp);

      // Backup changed files
      for (const file of changedFiles) {
        const relativePath = path.relative('.', file);
        const backupFilePath = `${backupPath}/${relativePath}`;
        const backupDir = path.dirname(backupFilePath);
        
        await fs.mkdir(backupDir, { recursive: true });
        await fs.copyFile(file, backupFilePath);
        
        metadata.files.push({
          original: file,
          backup: backupFilePath,
          type: 'changed',
          checksum: await this.calculateFileChecksum(backupFilePath),
          modified: (await fs.stat(file)).mtime
        });
      }

      // Calculate total size
      metadata.size = await this.calculateDirectorySize(backupPath);

      // Compress backup
      const compressedPath = `${backupPath}.tar.gz`;
      await this.compressDirectory(backupPath, compressedPath);

      // Encrypt backup
      const encryptedPath = `${compressedPath}.enc`;
      await this.encryptFile(compressedPath, encryptedPath);

      // Update metadata
      metadata.compressedPath = compressedPath;
      metadata.encryptedPath = encryptedPath;
      metadata.checksum = await this.calculateFileChecksum(encryptedPath);

      // Save metadata
      const metadataPath = `${this.backupDirectory}/metadata/${backupName}.json`;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Verify backup
      if (this.backupVerification) {
        await this.verifyBackup(encryptedPath, metadata);
      }

      // Create offsite backup
      if (this.offsiteBackup) {
        await this.createOffsiteBackup(encryptedPath, metadata);
      }

      // Cleanup temporary files
      await fs.rm(backupPath, { recursive: true });
      await fs.unlink(compressedPath);

      console.log(`✅ Incremental backup completed: ${backupName}`);
      
      // Log backup event
      await this.logBackupEvent('INCREMENTAL_BACKUP_COMPLETED', metadata);
      
      return metadata;
    } catch (error) {
      console.error('❌ Incremental backup failed:', error);
      await this.logBackupEvent('INCREMENTAL_BACKUP_FAILED', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Create differential backup
  async createDifferentialBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `differential-backup-${timestamp}`;
    const backupPath = `${this.backupDirectory}/differential/${backupName}`;
    
    console.log(`📦 Creating differential backup: ${backupName}`);
    this.isRunning = true;

    try {
      // Get last full backup
      const lastFullBackup = await this.getLastFullBackup();
      if (!lastFullBackup) {
        throw new Error('No full backup found for differential backup');
      }

      // Create backup metadata
      const metadata = {
        type: 'differential',
        timestamp: timestamp,
        name: backupName,
        path: backupPath,
        size: 0,
        checksum: null,
        encrypted: true,
        compressed: true,
        databases: ['hospital', 'company'],
        files: [],
        baseBackup: lastFullBackup,
        encryptionKey: this.encryptionKey,
        compressionLevel: this.compressionLevel
      };

      // Find changed files since last full backup
      const changedFiles = await this.getChangedFiles(lastFullBackup.timestamp);

      // Backup changed files
      for (const file of changedFiles) {
        const relativePath = path.relative('.', file);
        const backupFilePath = `${backupPath}/${relativePath}`;
        const backupDir = path.dirname(backupFilePath);
        
        await fs.mkdir(backupDir, { recursive: true });
        await fs.copyFile(file, backupFilePath);
        
        metadata.files.push({
          original: file,
          backup: backupFilePath,
          type: 'changed',
          checksum: await this.calculateFileChecksum(backupFilePath),
          modified: (await fs.stat(file)).mtime
        });
      }

      // Calculate total size
      metadata.size = await this.calculateDirectorySize(backupPath);

      // Compress backup
      const compressedPath = `${backupPath}.tar.gz`;
      await this.compressDirectory(backupPath, compressedPath);

      // Encrypt backup
      const encryptedPath = `${compressedPath}.enc`;
      await this.encryptFile(compressedPath, encryptedPath);

      // Update metadata
      metadata.compressedPath = compressedPath;
      metadata.encryptedPath = encryptedPath;
      metadata.checksum = await this.calculateFileChecksum(encryptedPath);

      // Save metadata
      const metadataPath = `${this.backupDirectory}/metadata/${backupName}.json`;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Verify backup
      if (this.backupVerification) {
        await this.verifyBackup(encryptedPath, metadata);
      }

      // Create offsite backup
      if (this.offsiteBackup) {
        await this.createOffsiteBackup(encryptedPath, metadata);
      }

      // Cleanup temporary files
      await fs.rm(backupPath, { recursive: true });
      await fs.unlink(compressedPath);

      console.log(`✅ Differential backup completed: ${backupName}`);
      
      // Log backup event
      await this.logBackupEvent('DIFFERENTIAL_BACKUP_COMPLETED', metadata);
      
      return metadata;
    } catch (error) {
      console.error('❌ Differential backup failed:', error);
      await this.logBackupEvent('DIFFERENTIAL_BACKUP_FAILED', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupName, targetPath = './restored') {
    console.log(`🔄 Restoring from backup: ${backupName}`);
    
    try {
      // Find backup metadata
      const metadataPath = `${this.backupDirectory}/metadata/${backupName}.json`;
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      // Decrypt backup
      const decryptedPath = `${metadata.encryptedPath}.dec`;
      await this.decryptFile(metadata.encryptedPath, decryptedPath);

      // Decompress backup
      const decompressedPath = `${decryptedPath}.tar`;
      await this.decompressFile(decryptedPath, decompressedPath);

      // Restore files
      await this.extractArchive(decompressedPath, targetPath);

      // Verify restoration
      await this.verifyRestoration(decompressedPath, metadata);

      // Cleanup temporary files
      await fs.unlink(decryptedPath);
      await fs.unlink(decryptedPath);

      console.log(`✅ Backup restored successfully: ${backupName}`);
      
      // Log restoration event
      await this.logBackupEvent('BACKUP_RESTORE_COMPLETED', {
        backupName: backupName,
        targetPath: targetPath,
        metadata: metadata
      });
      
      return metadata;
    } catch (error) {
      console.error('❌ Backup restoration failed:', error);
      await this.logBackupEvent('BACKUP_RESTORE_FAILED', { 
        backupName: backupName,
        error: error.message 
      });
      throw error;
    }
  }

  // Get last full backup
  async getLastFullBackup() {
    try {
      const metadataDir = `${this.backupDirectory}/metadata`;
      const files = await fs.readdir(metadataDir);
      const fullBackups = files.filter(f => f.includes('full-backup') && f.endsWith('.json'));
      
      if (fullBackups.length === 0) {
        return null;
      }

      // Sort by timestamp and get the latest
      fullBackups.sort((a, b) => b.localeCompare(a));
      const latestBackup = fullBackups[0];
      const metadataPath = `${metadataDir}/${latestBackup}`;
      
      return JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error getting last full backup:', error);
      return null;
    }
  }

  // Get changed files since timestamp
  async getChangedFiles(sinceTimestamp) {
    const changedFiles = [];
    const sinceDate = new Date(sinceTimestamp);

    // Recursively find changed files
    const findChangedFiles = async (dir) => {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await findChangedFiles(filePath);
        } else if (stat.mtime > sinceDate) {
          changedFiles.push(filePath);
        }
      }
    };

    await findChangedFiles('./');
    return changedFiles;
  }

  // Copy directory recursively
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const files = await fs.readdir(src);
    
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = await fs.stat(srcPath);
      
      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  // Calculate directory size
  async calculateDirectorySize(dir) {
    let totalSize = 0;
    
    const calculateSize = async (currentDir) => {
      const files = await fs.readdir(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await calculateSize(filePath);
        } else {
          totalSize += stat.size;
        }
      }
    };

    await calculateSize(dir);
    return totalSize;
  }

  // Calculate file checksum
  async calculateFileChecksum(filePath) {
    const data = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Calculate directory checksum
  async calculateDirectoryChecksum(dir) {
    const data = await fs.readFile(dir);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Compress directory
  async compressDirectory(src, dest) {
    return new Promise((resolve, reject) => {
      const tar = require('tar');
      tar.c({
        gzip: true,
        level: this.compressionLevel
      }, [src])
        .pipe(fs.createWriteStream(dest))
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  // Decompress file
  async decompressFile(src, dest) {
    return new Promise((resolve, reject) => {
      const tar = require('tar');
      fs.createReadStream(src)
        .pipe(zlib.createGunzip())
        .pipe(tar.extract({ cwd: dest }))
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  // Extract archive
  async extractArchive(archivePath, targetPath) {
    return new Promise((resolve, reject) => {
      const tar = require('tar');
      tar.extract({
        cwd: targetPath,
        strip: 1
      })(archivePath)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  // Encrypt file
  async encryptFile(src, dest) {
    const data = await fs.readFile(src);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data);
    encrypted += cipher.final();
    await fs.writeFile(dest, encrypted);
  }

  // Decrypt file
  async decryptFile(src, dest) {
    const encryptedData = await fs.readFile(src);
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData);
    decrypted += decipher.final();
    await fs.writeFile(dest, decrypted);
  }

  // Verify backup integrity
  async verifyBackup(backupPath, metadata) {
    const calculatedChecksum = await this.calculateFileChecksum(backupPath);
    
    if (calculatedChecksum !== metadata.checksum) {
      throw new Error('Backup integrity verification failed');
    }
    
    console.log(`✅ Backup integrity verified: ${metadata.name}`);
  }

  // Verify restoration
  async verifyRestoration(backupPath, metadata) {
    // Verify file count
    const restoredFiles = await this.countFiles(backupPath);
    const expectedFiles = metadata.files.length;
    
    if (restoredFiles !== expectedFiles) {
      throw new Error(`File count mismatch: expected ${expectedFiles}, got ${restoredFiles}`);
    }

    // Verify checksums
    for (const file of metadata.files) {
      if (file.backup && file.backup.startsWith(backupPath)) {
        const calculatedChecksum = await this.calculateFileChecksum(file.backup);
        if (calculatedChecksum !== file.checksum) {
          throw new Error(`Checksum mismatch for file: ${file.original}`);
        }
      }
    }
    
    console.log(`✅ Restoration verified: ${metadata.name}`);
  }

  // Count files in directory
  async countFiles(dir) {
    let count = 0;
    
    const countFiles = async (currentDir) => {
      const files = await fs.readdir(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await countFiles(filePath);
        } else {
          count++;
        }
      }
    };

    await countFiles(dir);
    return count;
  }

  // Create offsite backup
  async createOffsiteBackup(backupPath, metadata) {
    const offsiteDir = `${this.backupDirectory}/offsite`;
    const offsitePath = `${offsiteDir}/${metadata.name}.enc`;
    
    try {
      await fs.copyFile(backupPath, offsitePath);
      
      // Create offsite metadata
      const offsiteMetadata = {
        ...metadata,
        offsiteLocation: offsitePath,
        offsiteTimestamp: new Date().toISOString(),
        offsiteVerified: true
      };
      
      const offsiteMetadataPath = `${offsiteDir}/${metadata.name}.json`;
      await fs.writeFile(offsiteMetadataPath, JSON.stringify(offsiteMetadata, null, 2));
      
      console.log(`✅ Offsite backup created: ${metadata.name}`);
    } catch (error) {
      console.error('❌ Offsite backup failed:', error);
      throw error;
    }
  }

  // Start monitoring
  startMonitoring() {
    // Monitor backup directory
    setInterval(async () => {
      try {
        await this.monitorBackupHealth();
      } catch (error) {
        console.error('❌ Backup monitoring failed:', error);
      }
    }, 60 * 1000); // Every minute

    // Monitor disk space
    setInterval(async () => {
      try {
        const hasSpace = await this.checkDiskSpace();
        if (!hasSpace) {
          console.warn('⚠️ Low disk space detected for backups');
          await this.sendAlert('LOW_DISK_SPACE', 'Disk space running low for backups');
        }
      } catch (error) {
        console.error('❌ Disk space check failed:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Monitor backup verification
    setInterval(async () => {
      try {
        await this.verifyRecentBackups();
      } catch (error) {
        console.error('❌ Backup verification failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // Monitor backup health
  async monitorBackupHealth() {
    const stats = await this.getBackupStatistics();
    
    if (stats.recentBackups === 0) {
      await this.sendAlert('NO_RECENT_BACKUPS', 'No recent backups found');
    }
    
    if (stats.failedBackups > 0) {
      await this.sendAlert('FAILED_BACKUPS', `${stats.failedBackups} failed backups detected`);
    }
    
    if (stats.verificationFailures > 0) {
      await this.sendAlert('VERIFICATION_FAILURES', `${stats.verificationFailures} verification failures detected`);
    }
  }

  // Verify recent backups
  async verifyRecentBackups() {
    const recentBackups = await this.getRecentBackups(7); // Last 7 days
    
    for (const backup of recentBackups) {
      try {
        const metadataPath = `${this.backupDirectory}/metadata/${backup.name}.json`;
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        
        if (metadata.encryptedPath && await this.checkFileExists(metadata.encryptedPath)) {
          await this.verifyBackup(metadata.encryptedPath, metadata);
        }
      } catch (error) {
        console.error(`❌ Backup verification failed: ${backup.name}`, error);
        await this.sendAlert('BACKUP_VERIFICATION_FAILED', `Backup verification failed: ${backup.name}`);
      }
    }
  }

  // Get backup statistics
  async getBackupStatistics() {
    const stats = {
      totalBackups: 0,
      fullBackups: 0,
      incrementalBackups: 0,
      differentialBackups: 0,
      recentBackups: 0,
      failedBackups: 0,
      verificationFailures: 0,
      totalSize: 0,
      oldestBackup: null,
      newestBackup: null
    };

    try {
      const metadataDir = `${this.backupDirectory}/metadata`;
      const files = await fs.readdir(metadataDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const metadataPath = `${metadataDir}/${file}`;
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          
          stats.totalBackups++;
          
          if (metadata.type === 'full') stats.fullBackups++;
          else if (metadata.type === 'incremental') stats.incrementalBackups++;
          else if (metadata.type === 'differential') stats.differentialBackups++;
          
          const backupDate = new Date(metadata.timestamp);
          const now = new Date();
          const daysDiff = (now - backupDate) / (1000 * 60 * 60 * 24);
          
          if (daysDiff <= 7) stats.recentBackups++;
          
          if (!stats.oldestBackup || backupDate < stats.oldestBackup) {
            stats.oldestBackup = metadata.timestamp;
          }
          
          if (!stats.newestBackup || backupDate > stats.newestBackup) {
            stats.newestBackup = metadata.timestamp;
          }
          
          stats.totalSize += metadata.size;
        }
      }
    } catch (error) {
      console.error('❌ Error getting backup statistics:', error);
    }

    return stats;
  }

  // Get recent backups
  async getRecentBackup(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentBackups = [];
    
    try {
      const metadataDir = `${this.backupDirectory}/metadata`;
      const files = await fs.readdir(metadataDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const metadataPath = `${metadataDir}/${file}`;
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          
          const backupDate = new Date(metadata.timestamp);
          if (backupDate >= cutoffDate) {
            recentBackups.push(metadata);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error getting recent backups:', error);
    }

    return recentBackups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Check if file exists
  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Send alert
  async sendAlert(type, message) {
    const alert = {
      type: type,
      message: message,
      timestamp: new Date().toISOString(),
      system: 'disaster-recovery'
    };

    console.log(`🚨 ALERT [${type}]: ${message}`);
    
    // In production, send to monitoring system
    // await this.sendToMonitoringSystem(alert);
  }

  // Log backup event
  async logBackupEvent(eventType, details) {
    const event = {
      eventType: eventType,
      details: details,
      timestamp: new Date().toISOString(),
      system: 'disaster-recovery'
    };

    const logFile = `${this.backupDirectory}/logs/disaster-recovery.log`;
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(event, null, 2) + '\n');
  }

  // Test disaster recovery
  async testDisasterRecovery() {
    console.log('🧪 Testing disaster recovery system...');
    
    try {
      // Test backup creation
      const testBackup = await this.createFullBackup();
      console.log('✅ Backup creation test passed');
      
      // Test backup verification
      await this.verifyBackup(testBackup.encryptedPath, testBackup);
      console.log('✅ Backup verification test passed');
      
      // Test restoration
      const testRestorePath = './test-restore';
      await this.restoreFromBackup(testBackup.name, testRestorePath);
      console.log('✅ Backup restoration test passed');
      
      // Cleanup test restore
      await fs.rm(testRestorePath, { recursive: true });
      
      console.log('✅ Disaster recovery test completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Disaster recovery test failed:', error);
      return false;
    }
  }

  // Get recovery status
  async getRecoveryStatus() {
    const stats = await this.getBackupStatistics();
    const lastBackup = stats.newestBackup ? new Date(stats.newestBackup) : null;
    const now = new Date();
    const hoursSinceLastBackup = lastBackup ? (now - lastBackup) / (1000 * 60 * 60) : null;

    return {
      status: this.isRunning ? 'running' : 'idle',
      lastBackup: stats.newestBackup,
      hoursSinceLastBackup: hoursSinceLastBackup,
      totalBackups: stats.totalBackups,
      recentBackups: stats.recentBackups,
      totalSize: stats.totalSize,
      diskSpace: await this.checkDiskSpace(),
      backupVerification: this.backupVerification,
      offsiteBackup: this.offsiteBackup,
      rpo: this.recoveryPointObjective,
      rto: this.recoveryTimeObjective,
      health: hoursSinceLastBackup < 24 ? 'healthy' : 'warning'
    };
  }
}

module.exports = new DisasterRecoverySystem();
