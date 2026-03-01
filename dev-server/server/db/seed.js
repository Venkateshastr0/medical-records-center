const db = require("./database");
const bcrypt = require("bcrypt");

async function seed() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Development users only
      const users = [
        {
          name: 'Venkatesh M Astro',
          username: 'astro',
          password: 'dev123456',
          role: 'Developer',
          email: 'astro@dev.company.com',
          phone: '+1234567894',
          organization: 'Dev Environment',
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

      console.log('✅ Development database seeded successfully');
      resolve();
    });
  });
}

module.exports = { seed };
