const db = require("./database");
const bcrypt = require("bcrypt");

async function seed() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Hospital users only
      const users = [
        {
          name: 'Dr. Strange',
          username: 'doctor',
          password: 'doctor123',
          role: 'Doctor',
          email: 'doctor@hospital.com',
          phone: '+1234567890',
          organization: 'General Hospital',
          status: 'approved'
        },
        {
          name: 'Sarah Johnson',
          username: 'reception',
          password: 'reception123',
          role: 'Hospital Reception',
          email: 'reception@hospital.com',
          phone: '+1234567895',
          organization: 'General Hospital',
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

      // Insert sample patients
      const patients = [
        { name: 'John Doe', age: 45, status: 'Active', phone: '+1234567891' },
        { name: 'Jane Smith', age: 32, status: 'Under Review', phone: '+1234567892' },
        { name: 'Robert Johnson', age: 58, status: 'Active', phone: '+1234567893' },
        { name: 'Emily Davis', age: 28, status: 'Active', phone: '+1234567894' }
      ];

      patients.forEach(patient => {
        db.run(
          `INSERT OR IGNORE INTO Patients (name, age, status, phone) VALUES (?, ?, ?, ?)`,
          [patient.name, patient.age, patient.status, patient.phone],
          (err) => {
            if (err) console.error('Error inserting patient:', err);
          }
        );
      });

      console.log('✅ Hospital database seeded successfully');
      resolve();
    });
  });
}

module.exports = { seed };
