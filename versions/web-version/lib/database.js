const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path - absolute path to ensure it works
const dbPath = path.resolve(__dirname, '..', 'database', 'medical_records.db');

console.log('Database path:', dbPath);

// Create database connection
function createConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
      } else {
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
          console.error('Query error:', err);
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
          console.error('Run error:', err);
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
          console.error('Get error:', err);
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
            console.error('Close error:', err);
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
