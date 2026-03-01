// Real-time Notification System
const socketIo = require('socket.io');
const ErrorHandler = require('./error-handler');

class NotificationManager {
  constructor() {
    this.io = socketIo;
    this.connectedAdmins = new Set();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
  }

  // Initialize notification system
  initialize(server) {
    this.io = server;
    
    this.io.on('connection', (socket) => {
      console.log('Admin connected to notifications:', socket.handshake.address);
      this.connectedAdmins.add(socket);
      
      // Send current notification history to new admin
      socket.emit('notificationHistory', this.notificationHistory.slice(-50));
    });

    this.io.on('disconnect', (socket) => {
      console.log('Admin disconnected from notifications:', socket.handshake.address);
      this.connectedAdmins.delete(socket);
    });
  }

  // Send real-time notification to all connected admins
  sendToAllAdmins(event, data) {
    const notification = {
      id: Date.now().toString(),
      type: event,
      message: data.message,
      timestamp: new Date().toISOString(),
      severity: data.severity || 'info',
      data: data.data || {}
    };

    // Add to history
    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }

    // Send to all connected admins
    this.connectedAdmins.forEach(socket => {
      socket.emit('notification', notification);
    });
  }

  // Send to specific admin
  sendToAdmin(socketId, event, data) {
    const notification = {
      id: Date.now().toString(),
      type: event,
      message: data.message,
      timestamp: new Date().toISOString(),
      severity: data.severity || 'info',
      data: data.data || {}
    };

    this.connectedAdmins.forEach(socket => {
      if (socket.id === socketId) {
        socket.emit('notification', notification);
      }
    });
  }

  // Get notification history
  getNotificationHistory() {
    return this.notificationHistory;
  }

  // Clear notification history
  clearHistory() {
    this.notificationHistory = [];
    this.connectedAdmins.forEach(socket => {
      socket.emit('notificationHistory', []);
    });
  }
}

module.exports = new NotificationManager();
