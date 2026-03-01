const crypto = require('crypto');
const https = require('https');
const fs = require('fs').promises;

class InterServerCommunication {
  constructor() {
    this.servers = {
      hospital: {
        host: process.env.HOSPITAL_HOST || 'localhost',
        port: process.env.HOSPITAL_PORT || 3001,
        apiKey: process.env.HOSPITAL_API_KEY || 'hospital-secure-key-2024'
      },
      company: {
        host: process.env.COMPANY_HOST || 'localhost',
        port: process.env.COMPANY_PORT || 3002,
        apiKey: process.env.COMPANY_API_KEY || 'company-secure-key-2024'
      }
    };
    
    this.encryptionKey = process.env.INTER_SERVER_KEY || 'med-records-inter-server-encryption-2024';
  }

  // Encrypt data for inter-server transmission
  encryptData(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt received data
  decryptData(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Send data from hospital to company server
  async sendToCompany(data, type = 'medical-reports') {
    try {
      const encryptedData = this.encryptData(data);
      
      const payload = {
        type: type,
        data: encryptedData,
        timestamp: new Date().toISOString(),
        source: 'hospital',
        checksum: this.generateChecksum(data)
      };

      const response = await this.makeRequest('company', payload);
      
      return {
        success: true,
        message: 'Data sent to company server successfully',
        response: response
      };

    } catch (error) {
      console.error('Error sending to company server:', error);
      return {
        success: false,
        message: 'Failed to send data to company server',
        error: error.message
      };
    }
  }

  // Send data from company to hospital server
  async sendToHospital(data, type = 'admin-updates') {
    try {
      const encryptedData = this.encryptData(data);
      
      const payload = {
        type: type,
        data: encryptedData,
        timestamp: new Date().toISOString(),
        source: 'company',
        checksum: this.generateChecksum(data)
      };

      const response = await this.makeRequest('hospital', payload);
      
      return {
        success: true,
        message: 'Data sent to hospital server successfully',
        response: response
      };

    } catch (error) {
      console.error('Error sending to hospital server:', error);
      return {
        success: false,
        message: 'Failed to send data to hospital server',
        error: error.message
      };
    }
  }

  // Make HTTP request to another server
  async makeRequest(targetServer, payload) {
    const server = this.servers[targetServer];
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: server.host,
        port: server.port,
        path: '/api/inter-server/receive',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': server.apiKey,
          'User-Agent': 'Medical-Records-InterServer/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Generate checksum for data integrity
  generateChecksum(data) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Verify checksum of received data
  verifyChecksum(data, checksum) {
    const calculatedChecksum = this.generateChecksum(data);
    return calculatedChecksum === checksum;
  }

  // Save received data securely
  async saveReceivedData(data, type, source) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${type}-${source}-${timestamp}.json`;
      const filepath = `./secure-data-received/${filename}`;
      
      // Ensure directory exists
      await fs.mkdir('./secure-data-received', { recursive: true });
      
      // Save encrypted data
      await fs.writeFile(filepath, JSON.stringify({
        type: type,
        source: source,
        timestamp: new Date().toISOString(),
        data: data,
        checksum: this.generateChecksum(data)
      }, null, 2));
      
      console.log(`✅ Data saved securely: ${filename}`);
      return {
        success: true,
        filepath: filepath,
        filename: filename
      };
      
    } catch (error) {
      console.error('Error saving received data:', error);
      return {
        success: false,
        message: 'Failed to save received data',
        error: error.message
      };
    }
  }

  // Get list of received data files
  async getReceivedData() {
    try {
      const files = await fs.readdir('./secure-data-received');
      const fileList = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = `./secure-data-received/${file}`;
          const content = await fs.readFile(filepath, 'utf8');
          const data = JSON.parse(content);
          
          fileList.push({
            filename: file,
            filepath: filepath,
            type: data.type,
            source: data.source,
            timestamp: data.timestamp,
            checksum: data.checksum
          });
        }
      }
      
      return {
        success: true,
        files: fileList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      };
      
    } catch (error) {
      console.error('Error reading received data:', error);
      return {
        success: false,
        message: 'Failed to read received data',
        error: error.message
      };
    }
  }
}

module.exports = new InterServerCommunication();
