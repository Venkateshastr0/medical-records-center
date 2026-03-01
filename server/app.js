const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const SecurityMiddleware = require('./middleware/security');
const hipaaCompliance = require('./utils/hipaa-compliance');

// Import routes and socket handlers
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const adminRoutes = require('./routes/admin');
const socketHandlers = require('./socket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with security middleware
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(SecurityMiddleware.sessionSecurity);
app.use(SecurityMiddleware.cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for all routes
app.use(SecurityMiddleware.rateLimiter(100, 15 * 60 * 1000));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.1.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', SecurityMiddleware.authenticate, patientRoutes);
app.use('/api/admin', SecurityMiddleware.authenticate, SecurityMiddleware.authorize('Admin'), adminRoutes);

// Serve static files (client)
app.use(express.static(path.join(__dirname, '../client')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application Error:', err);
  
  // Log HIPAA compliance event
  hipaaCompliance.logHIPAAEvent({
    userId: req.user?.userId || 'anonymous',
    eventType: 'SYSTEM_ERROR',
    resourceType: 'application',
    action: 'ERROR',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    details: err.message
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Initialize socket handlers
socketHandlers(io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Medical Records Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Security: HIPAA Compliance Mode Active`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
