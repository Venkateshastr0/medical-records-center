// SIP Communication Client
class SIPClient {
  constructor() {
    this.currentServer = this.detectCurrentServer();
    this.sipEnabled = true;
    this.encryptionLevel = 'AES-256-CBC';
  }

  // Detect which server the user is currently on
  detectCurrentServer() {
    const port = window.location.port;
    if (port === '3001') return 'hospital';
    if (port === '3002') return 'company';
    if (port === '3003') return 'development';
    return 'unknown';
  }

  // Send medical reports to admin personal storage
  async sendToAdmin(reportIds, priority = 'high', notes = '') {
    if (this.currentServer !== 'hospital') {
      throw new Error('This function is only available on hospital server');
    }

    try {
      const response = await fetch('/api/sip/send-to-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportIds: reportIds,
          priority: priority,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Reports sent to admin personal storage via SIP!`, 'success');
        return result;
      } else {
        showNotification(`Failed to send reports: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error sending reports via SIP: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get admin personal storage
  async getAdminStorage() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/admin/personal-storage');
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        showNotification(`Failed to get admin storage: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting admin storage: ${error.message}`, 'error');
      return [];
    }
  }

  // Assign data to TL
  async assignToTL(dataId, tlId, notes = '') {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/admin/assign-to-tl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataId: dataId,
          tlId: tlId,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Data assigned to TL successfully!`, 'success');
        return result;
      } else {
        showNotification(`Failed to assign to TL: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error assigning to TL: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get available TLs
  async getAvailableTLs() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/admin/available-tls');
      const result = await response.json();
      
      if (result.success) {
        return result.tls;
      } else {
        showNotification(`Failed to get available TLs: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting available TLs: ${error.message}`, 'error');
      return [];
    }
  }

  // Get TL personal storage
  async getTLStorage() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/tl/personal-storage');
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        showNotification(`Failed to get TL storage: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting TL storage: ${error.message}`, 'error');
      return [];
    }
  }

  // Assign data to analyst
  async assignToAnalyst(dataId, analystId, notes = '') {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/tl/assign-to-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataId: dataId,
          analystId: analystId,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Data assigned to analyst successfully!`, 'success');
        return result;
      } else {
        showNotification(`Failed to assign to analyst: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error assigning to analyst: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get available analysts
  async getAvailableAnalysts() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/tl/available-analysts');
      const result = await response.json();
      
      if (result.success) {
        return result.analysts;
      } else {
        showNotification(`Failed to get available analysts: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting available analysts: ${error.message}`, 'error');
      return [];
    }
  }

  // Get analyst personal storage
  async getAnalystStorage() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/analyst/personal-storage');
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        showNotification(`Failed to get analyst storage: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting analyst storage: ${error.message}`, 'error');
      return [];
    }
  }

  // Send processed data to main server
  async sendToMainServer(dataId, processedData, summary) {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/analyst/send-to-main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataId: dataId,
          processedData: processedData,
          summary: summary
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Processed data sent to main server via SIP!`, 'success');
        return result;
      } else {
        showNotification(`Failed to send to main server: ${result.message}`, 'error');
        throw new Error(result.message);
      }
    } catch (error) {
      showNotification(`Error sending to main server: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get main server data (admin and production team)
  async getMainServerData() {
    if (this.currentServer !== 'company') {
      throw new Error('This function is only available on company server');
    }

    try {
      const response = await fetch('/api/sip/main/data');
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        showNotification(`Failed to get main server data: ${result.message}`, 'error');
        return [];
      }
    } catch (error) {
      showNotification(`Error getting main server data: ${error.message}`, 'error');
      return [];
    }
  }

  // Get SIP status
  async getSIPStatus() {
    try {
      const response = await fetch('/api/sip/status');
      const result = await response.json();
      
      if (result.success) {
        return result.status;
      } else {
        return { sipEnabled: false };
      }
    } catch (error) {
      return { sipEnabled: false };
    }
  }

  // Get current user capabilities
  getUserCapabilities() {
    const server = this.currentServer;
    const capabilities = {
      canSendToAdmin: server === 'hospital',
      canReceiveFromHospital: server === 'company',
      canAssignToTL: server === 'company',
      canAssignToAnalyst: server === 'company',
      canSendToMain: server === 'company',
      canAccessMain: server === 'company',
      sipEnabled: this.sipEnabled,
      encryptionLevel: this.encryptionLevel
    };

    return capabilities;
  }
}

// Global instance
window.sipClient = new SIPClient();
