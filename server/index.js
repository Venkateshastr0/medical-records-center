const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const fieldEncryption = require('./utils/field-encryption');
const hipaaCompliance = require('./utils/hipaa-compliance');
const ErrorHandler = require('./utils/error-handler');
const NotificationManager = require('./utils/notifications');
const BackupManager = require('./utils/backup');
const { authenticateUser } = require('./utils/auth');
const { logAudit } = require('./utils/audit');

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Import database and security
const { initDatabase } = require("./db/init");
const { seed } = require("./db/seed");
const initSocket = require("./socket");

const app = express();
app.use(cors());
app.use(express.json());

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
    console.log("🔧 Initializing database...");
    await initDatabase();
    console.log("✅ Database initialized");
    
    console.log("🌱 Seeding database...");
    await seed();
    console.log("✅ Database seeded");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

// attach socket logic
initSocket(io);

// Initialize notification manager
const { initializeNotifications } = require('./routes/auth');
initializeNotifications(io);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/users', require('./routes/admin-users'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/reception', require('./routes/reception'));

// Route for root to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "2.1.0"
  });
});

const PORT = process.env.PORT || 3000;

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

    console.log(`🚀 Medical Records Desktop App running on http://localhost:${PORT}`);
    console.log(`📡 Network access on http://${localIP}:${PORT}`);
    console.log(`🏥 Ready for medical records management!`);
  });
});
