// Inter-Server Communication Client
class InterServerClient {
  constructor() {
    this.currentServer = this.detectCurrentServer();
    this.hospitalServer = {
      host: 'localhost',
      port: 3001,
      apiKey: 'hospital-secure-key-2024'
    };
    this.companyServer = {
      host: 'localhost',
      port: 3002,
      apiKey: 'company-secure-key-2024'
    };
  }

  // Detect which server the user is currently on
  detectCurrentServer() {
    const port = window.location.port;
    if (port === '3001') return 'hospital';
    if (port === '3002') return 'company';
    if (port === '3003') return 'development';
    return 'unknown';
  }

  // Send medical reports from hospital to company
  async sendMedicalReports(reportIds, recipientType = 'insurance') {
    if (this.currentServer !== 'hospital') {
      throw new Error('This function is only available on hospital server');
    }

    try {
      const response = await fetch('/api/inter-server/send-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportIds: reportIds,
          recipientType: recipientType
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Reports sent to ${recipientType} successfully!`, 'success');
        return result;
      } else {
        showNotification(`Failed to send reports: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error sending reports: ${error.message}`, 'error');
      throw error;
    }
  }

  // Send admin updates from company to hospital
  async sendAdminUpdates(updateType, updateData, targetRole) {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/inter-server/send-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updateType: updateType,
          updateData: updateData,
          targetRole: targetRole
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Updates sent to hospital successfully!`, 'success');
        return result;
      } else {
        showNotification(`Failed to send updates: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error sending updates: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get received inter-server data
  async getReceivedData() {
    try {
      const response = await fetch('/api/inter-server/received-data');
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        showNotification(`Failed to get received data: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting received data: ${error.message}`, 'error');
      return [];
    }
  }

  // Download received data file
  async downloadReceivedFile(filename) {
    try {
      const response = await fetch(`./secure-data-received/${filename}`);
      if (!response.ok) {
        throw new Error('File not found');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showNotification(`File ${filename} downloaded successfully!`, 'success');
    } catch (error) {
      showNotification(`Error downloading file: ${error.message}`, 'error');
    }
  }

  // Get current server info
  getServerInfo() {
    return {
      current: this.currentServer,
      hospital: this.hospitalServer,
      company: this.companyServer,
      canSendToCompany: this.currentServer === 'hospital',
      canSendToHospital: this.currentServer === 'company'
    };
  }
}

// Global instance
window.interServerClient = new InterServerClient();
