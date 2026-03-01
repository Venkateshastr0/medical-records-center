const express = require('express');
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Import database and security
const { initDatabase } = require("./db/init");
const { seed } = require("./db/seed");

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
    console.log("🔧 Initializing development database...");
    await initDatabase();
    console.log("✅ Development database initialized");

    console.log("🌱 Seeding development users...");
    await seed();
    console.log("✅ Development database seeded");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../../client")));

// Development-specific API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devops', require('./routes/devops'));

// Route for root to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "2.1.0"
  });
});

const PORT = process.env.DEV_PORT || 3003;

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

    console.log(`🛠️ Development Server running on http://localhost:${PORT}`);
    console.log(`📡 Network access on http://${localIP}:${PORT}`);
    console.log(`⚙️ Ready for development operations!`);
  });
});
