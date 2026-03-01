const db = require("./database");
const bcrypt = require("bcrypt");

async function seed() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Company users only
      const users = [
        {
          name: 'Admin User',
          username: 'admin',
          password: 'admin123',
          role: 'Admin',
          email: 'admin@company.com',
          phone: '+1234567891',
          organization: 'Medical Records Center',
          status: 'approved'
        },
        {
          name: 'Team Lead',
          username: 'teamlead',
          password: 'teamlead123',
          role: 'Team Lead',
          email: 'teamlead@company.com',
          phone: '+1234567892',
          organization: 'Medical Records Center',
          status: 'approved'
        },
        {
          name: 'Data Analyst',
          username: 'analyst',
          password: 'analyst123',
          role: 'Analyst',
          email: 'analyst@company.com',
          phone: '+1234567893',
          organization: 'Medical Records Center',
          status: 'approved'
        },
        {
          name: 'Production Manager',
          username: 'production',
          password: 'production123',
          role: 'Production',
          email: 'production@company.com',
          phone: '+1234567894',
          organization: 'Medical Records Center',
          status: 'approved'
        }
      ];

      users.forEach(async (user) => {
        const hash = await bcrypt.hash(user.password, 10);
        db.run(
          `INSERT OR IGNORE INTO Users (name, username, password_hash, role, email, phone, organization, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.name, user.username, hash, user.role, user.email, user.phone, user.organization, user.status],
          (err) => {
            if (err) console.error('Error inserting user:', err);
          }
        );
      });

      console.log('✅ Company database seeded successfully');
      resolve();
    });
  });
}

module.exports = { seed };
