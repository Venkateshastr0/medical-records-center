const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'medical_records.db');

// Create database connection
function createConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        reject(new Error(`Failed to open DB at ${dbPath}: ${err.message}`));
      } else {
        db.configure('busyTimeout', 5000); // 5 second timeout for busy DB
        console.log('Connected to SQLite database at:', dbPath);
        resolve(db);
      }
    });
  });
}

// Database helper functions
class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    if (!this.db) {
      this.db = await createConnection();
    }
    return this.db;
  }

  async query(sql, params = []) {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async run(sql, params = []) {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
