const crypto = require('crypto');
const dgram = require('dgram');
const fs = require('fs').promises;

class SIPCommunication {
  constructor() {
    this.servers = {
      hospital: {
        host: process.env.HOSPITAL_HOST || 'localhost',
        port: process.env.HOSPITAL_SIP_PORT || 5060,
        username: 'hospital',
        password: process.env.HOSPITAL_SIP_PASSWORD || 'hospital-sip-secure-2024'
      },
      company: {
        host: process.env.COMPANY_HOST || 'localhost',
        port: process.env.COMPANY_SIP_PORT || 5061,
        username: 'company',
        password: process.env.COMPANY_SIP_PASSWORD || 'company-sip-secure-2024'
      },
      admin: {
        host: process.env.ADMIN_HOST || 'localhost',
        port: process.env.ADMIN_SIP_PORT || 5062,
        username: 'admin',
        password: process.env.ADMIN_SIP_PASSWORD || 'admin-sip-secure-2024'
      },
      tl: {
        host: process.env.TL_HOST || 'localhost',
        port: process.env.TL_SIP_PORT || 5063,
        username: 'tl',
        password: process.env.TL_SIP_PASSWORD || 'tl-secure-2024'
      },
      analyst: {
        host: process.env.ANALYST_HOST || 'localhost',
        port: process.env.ANALYST_SIP_PORT || 5064,
        username: 'analyst',
        password: process.env.ANALYST_SIP_PASSWORD || 'analyst-secure-2024'
      },
      main: {
        host: process.env.MAIN_HOST || 'localhost',
        port: process.env.MAIN_SIP_PORT || 5065,
        username: 'main',
        password: process.env.MAIN_SIP_PASSWORD || 'main-secure-2024'
      }
    };

    this.sipSocket = dgram.createSocket('udp4');
    this.sessions = new Map();
    this.messageQueue = [];
    this.encryptionKey = process.env.SIP_ENCRYPTION_KEY || 'sip-med-records-encryption-2024';
  }

  // Generate SIP message with security headers
  generateSIPMessage(method, uri, headers, body = '') {
    const callId = this.generateCallId();
    const cseq = Math.floor(Math.random() * 1000000);
    const fromTag = this.generateTag();
    const toTag = headers.method === '200 OK' ? this.generateTag() : '';

    const sipMessage = [
      `${method} ${uri} SIP/2.0`,
      `Via: SIP/2.0/UDP ${this.getLocalHost()}:${this.getLocalPort()};branch=${this.generateBranch()}`,
      `Max-Forwards: 70`,
      `From: <sip:${headers.from}>;tag=${fromTag}`,
      `To: <sip:${headers.to}>${toTag ? ';tag=' + toTag : ''}`,
      `Call-ID: ${callId}`,
      `CSeq: ${cseq} ${method}`,
      `Content-Type: ${headers.contentType || 'application/json'}`,
      `Content-Length: ${body.length}`,
      `X-Security-Token: ${this.generateSecurityToken()}`,
      `X-Encryption-Key: ${this.generateEncryptionKey()}`,
      `X-Checksum: ${this.generateChecksum(body)}`,
      '',
      body
    ].join('\r\n');

    return {
      message: sipMessage,
      callId: callId,
      fromTag: fromTag,
      cseq: cseq
    };
  }

  // Encrypt data for SIP transmission
  encryptData(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt SIP data
  decryptData(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Send data from hospital to admin personal storage
  async sendToAdmin(data, dataType = 'medical-reports') {
    try {
      const encryptedData = this.encryptData(data);
      const payload = {
        type: dataType,
        data: encryptedData,
        source: 'hospital',
        timestamp: new Date().toISOString(),
        priority: 'high',
        workflow: 'hospital-to-admin'
      };

      const sipMsg = this.generateSIPMessage('MESSAGE', `sip:admin@${this.servers.admin.host}:${this.servers.admin.port}`, {
        from: 'hospital',
        to: 'admin',
        contentType: 'application/json'
      }, JSON.stringify(payload));

      await this.sendSIPMessage(this.servers.admin, sipMsg.message);
      
      // Save to admin personal storage
      await this.saveToPersonalStorage('admin', payload);
      
      return {
        success: true,
        message: 'Data sent to admin personal storage via SIP',
        callId: sipMsg.callId
      };

    } catch (error) {
      console.error('Error sending to admin via SIP:', error);
      return {
        success: false,
        message: 'Failed to send data to admin',
        error: error.message
      };
    }
  }

  // Send data from admin to TL
  async sendToTL(data, dataType = 'assigned-data') {
    try {
      const encryptedData = this.encryptData(data);
      const payload = {
        type: dataType,
        data: encryptedData,
        source: 'admin',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        workflow: 'admin-to-tl'
      };

      const sipMsg = this.generateSIPMessage('MESSAGE', `sip:tl@${this.servers.tl.host}:${this.servers.tl.port}`, {
        from: 'admin',
        to: 'tl',
        contentType: 'application/json'
      }, JSON.stringify(payload));

      await this.sendSIPMessage(this.servers.tl, sipMsg.message);
      
      // Save to TL temporary storage
      await this.saveToPersonalStorage('tl', payload);
      
      return {
        success: true,
        message: 'Data sent to TL via SIP',
        callId: sipMsg.callId
      };

    } catch (error) {
      console.error('Error sending to TL via SIP:', error);
      return {
        success: false,
        message: 'Failed to send data to TL',
        error: error.message
      };
    }
  }

  // Send formatted data from analyst to main server
  async sendToMainServer(data, dataType = 'formatted-data') {
    try {
      const encryptedData = this.encryptData(data);
      const payload = {
        type: dataType,
        data: encryptedData,
        source: 'analyst',
        timestamp: new Date().toISOString(),
        priority: 'high',
        workflow: 'analyst-to-main'
      };

      const sipMsg = this.generateSIPMessage('MESSAGE', `sip:main@${this.servers.main.host}:${this.servers.main.port}`, {
        from: 'analyst',
        to: 'main',
        contentType: 'application/json'
      }, JSON.stringify(payload));

      await this.sendSIPMessage(this.servers.main, sipMsg.message);
      
      return {
        success: true,
        message: 'Formatted data sent to main server via SIP',
        callId: sipMsg.callId
      };

    } catch (error) {
      console.error('Error sending to main server via SIP:', error);
      return {
        success: false,
        message: 'Failed to send data to main server',
        error: error.message
      };
    }
  }

  // Send SIP message
  async sendSIPMessage(targetServer, message) {
    return new Promise((resolve, reject) => {
      this.sipSocket.send(message, targetServer.port, targetServer.host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Save to personal/temporary storage
  async saveToPersonalStorage(userRole, data) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${data.type}-${userRole}-${timestamp}.json`;
      const storageDir = `./personal-storage/${userRole}`;
      
      // Ensure directory exists
      await fs.mkdir(storageDir, { recursive: true });
      
      // Save encrypted data
      await fs.writeFile(`${storageDir}/${filename}`, JSON.stringify({
        ...data,
        filename: filename,
        storedAt: new Date().toISOString()
      }, null, 2));
      
      console.log(`✅ Data saved to ${userRole} personal storage: ${filename}`);
      return {
        success: true,
        filepath: `${storageDir}/${filename}`,
        filename: filename
      };
      
    } catch (error) {
      console.error('Error saving to personal storage:', error);
      return {
        success: false,
        message: 'Failed to save to personal storage',
        error: error.message
      };
    }
  }

  // Get personal storage files
  async getPersonalStorage(userRole) {
    try {
      const storageDir = `./personal-storage/${userRole}`;
      const files = await fs.readdir(storageDir);
      const fileList = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = `${storageDir}/${file}`;
          const content = await fs.readFile(filepath, 'utf8');
          const data = JSON.parse(content);
          
          fileList.push({
            filename: file,
            filepath: filepath,
            type: data.type,
            source: data.source,
            timestamp: data.timestamp,
            priority: data.priority,
            workflow: data.workflow
          });
        }
      }
      
      return {
        success: true,
        files: fileList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      };
      
    } catch (error) {
      console.error('Error reading personal storage:', error);
      return {
        success: false,
        message: 'Failed to read personal storage',
        error: error.message
      };
    }
  }

  // Assign data from admin to TL
  async assignToTL(dataId, tlId, notes = '') {
    try {
      // Get data from admin storage
      const adminStorage = await this.getPersonalStorage('admin');
      const dataFile = adminStorage.files.find(f => f.filename.includes(dataId));
      
      if (!dataFile) {
        throw new Error('Data not found in admin storage');
      }
      
      const content = await fs.readFile(dataFile.filepath, 'utf8');
      const data = JSON.parse(content);
      
      // Update with assignment info
      data.assignedTo = tlId;
      data.assignedAt = new Date().toISOString();
      data.assignedBy = 'admin';
      data.notes = notes;
      
      // Send to TL
      await this.sendToTL(data, 'assigned-data');
      
      return {
        success: true,
        message: `Data assigned to TL ${tlId} successfully`
      };
      
    } catch (error) {
      console.error('Error assigning to TL:', error);
      return {
        success: false,
        message: 'Failed to assign data to TL',
        error: error.message
      };
    }
  }

  // Assign data from TL to analyst
  async assignToAnalyst(dataId, analystId, notes = '') {
    try {
      // Get data from TL storage
      const tlStorage = await this.getPersonalStorage('tl');
      const dataFile = tlStorage.files.find(f => f.filename.includes(dataId));
      
      if (!dataFile) {
        throw new Error('Data not found in TL storage');
      }
      
      const content = await fs.readFile(dataFile.filepath, 'utf8');
      const data = JSON.parse(content);
      
      // Update with assignment info
      data.assignedTo = analystId;
      data.assignedAt = new Date().toISOString();
      data.assignedBy = 'tl';
      data.notes = notes;
      
      // Send to analyst
      await this.sendToAnalyst(data, 'assigned-data');
      
      return {
        success: true,
        message: `Data assigned to Analyst ${analystId} successfully`
      };
      
    } catch (error) {
      console.error('Error assigning to analyst:', error);
      return {
        success: false,
        message: 'Failed to assign data to analyst',
        error: error.message
      };
    }
  }

  // Send data to analyst
  async sendToAnalyst(data, dataType = 'assigned-data') {
    try {
      const encryptedData = this.encryptData(data);
      const payload = {
        type: dataType,
        data: encryptedData,
        source: 'tl',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        workflow: 'tl-to-analyst'
      };

      const sipMsg = this.generateSIPMessage('MESSAGE', `sip:analyst@${this.servers.analyst.host}:${this.servers.analyst.port}`, {
        from: 'tl',
        to: 'analyst',
        contentType: 'application/json'
      }, JSON.stringify(payload));

      await this.sendSIPMessage(this.servers.analyst, sipMsg.message);
      
      // Save to analyst temporary storage
      await this.saveToPersonalStorage('analyst', payload);
      
      return {
        success: true,
        message: 'Data sent to analyst via SIP',
        callId: sipMsg.callId
      };

    } catch (error) {
      console.error('Error sending to analyst via SIP:', error);
      return {
        success: false,
        message: 'Failed to send data to analyst',
        error: error.message
      };
    }
  }

  // Utility functions
  generateCallId() {
    return crypto.randomBytes(16).toString('hex') + '@' + this.getLocalHost();
  }

  generateBranch() {
    return 'z9hG4bK' + crypto.randomBytes(8).toString('hex');
  }

  generateTag() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateSecurityToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateEncryptionKey() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  getLocalHost() {
    return 'localhost';
  }

  getLocalPort() {
    return 5060;
  }
}

module.exports = new SIPCommunication();
