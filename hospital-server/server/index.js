const express = require('express');
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Import database and security
const { initDatabase } = require("./db/init");
const { seed } = require("./db/seed");

// Import advanced security components
const securityHardening = require('../utils/security-hardening');
const intrusionDetection = require('../utils/intrusion-detection');
const zeroTrust = require('../utils/zero-trust-architecture');
const databaseSecurity = require('../utils/database-security');
const sipCommunication = require('../utils/sip-communication');

const app = express();
app.use(cors());
app.use(express.json());

// Apply advanced security middleware
app.use(intrusionDetection.realTimeMonitoring.bind(intrusionDetection));
app.use(securityHardening.createAdvancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP'
}));

// Zero Trust verification middleware
app.use(async (req, res, next) => {
  const verification = await zeroTrust.verifyRequest(req);
  
  if (!verification.trusted) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Zero Trust verification failed.',
      trustScore: verification.trustScore,
      recommendations: verification.recommendations
    });
  }
  
  req.zeroTrust = verification;
  next();
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // desktop apps
    methods: ["GET", "POST"]
  }
});

// Initialize database and seed data
async function initializeApp() {
  try {
    console.log("🔧 Initializing hospital database...");
    await initDatabase();
    console.log("✅ Hospital database initialized");

    console.log("🌱 Seeding hospital users...");
    await seed();
    console.log("✅ Hospital database seeded");
    
    // Initialize security components
    console.log("🔒 Initializing security components...");
    databaseSecurity.initializeFieldEncryption();
    console.log("✅ Database field encryption initialized");
    
    // Start security monitoring
    console.log("🚨 Starting security monitoring...");
    setInterval(() => {
      intrusionDetection.cleanupExpiredSessions();
      securityHardening.cleanupExpiredSessions();
    }, 60000); // Every minute
    
    console.log("✅ Security monitoring active");
    
  } catch (error) {
    console.error("❌ Initialization failed:", error);
  }
}

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../../client")));

// Hospital-specific API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reception', require('./routes/reception'));
app.use('/api/medical', require('./routes/medical'));
app.use('/api/inter-server', require('./routes/inter-server'));
app.use('/api/sip', require('./routes/sip-reception'));

// Route for root to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "hospital",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "2.1.0",
    security: {
      zeroTrust: true,
      intrusionDetection: true,
      databaseEncryption: true,
      sipCommunication: true,
      activeSessions: securityHardening.getSecurityStatus().activeSessions,
      blockedIPs: intrusionDetection.getSecurityDashboard().blockedIPs
    }
  });
});

// Security status endpoint
app.get("/security-status", (req, res) => {
  res.json({
    security: {
      hardening: securityHardening.getSecurityStatus(),
      intrusionDetection: intrusionDetection.getSecurityDashboard(),
      databaseSecurity: databaseSecurity.getSecurityDashboard(),
      zeroTrust: {
        active: true,
        minTrustScore: zeroTrust.minTrustScore
      }
    }
  });
});

const PORT = process.env.HOSPITAL_PORT || 3001;

// Initialize app and start server
initializeApp().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    let localIP = "localhost";

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          localIP = net.address;
        }
      }
    }

    console.log(`🏥 Hospital Server running on http://localhost:${PORT}`);
    console.log(`📡 Network access on http://${localIP}:${PORT}`);
    console.log(`🏥 Ready for hospital medical operations!`);
  });
});
