const db = require("./database");
const bcrypt = require("bcrypt");
const { encrypt } = require("../utils/crypto");

async function seed() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert users
      const users = [
        {
          name: 'Dr. Strange',
          username: 'doctor',
          password: 'doctor123',
          role: 'Doctor',
          email: 'doctor@medrecord.com',
          phone: '+1234567890',
          organization: 'General Hospital',
          status: 'approved'
        },
        {
          name: 'Admin User',
          username: 'admin',
          password: 'admin123',
          role: 'Admin',
          email: 'admin@medrecord.com',
          phone: '+1234567891',
          organization: 'MedRecord Center',
          status: 'approved'
        },
        {
          name: 'Insurance Agent',
          username: 'insurance',
          password: 'insurance123',
          role: 'Insurance',
          email: 'insurance@medrecord.com',
          phone: '+1234567892',
          organization: 'MetLife Insurance',
          status: 'approved'
        },
        {
          name: 'Legal Counsel',
          username: 'lawyer',
          password: 'lawyer123',
          role: 'Lawyer',
          email: 'lawyer@medrecord.com',
          phone: '+1234567893',
          organization: 'Legal Associates',
          status: 'approved'
        },
        {
          name: 'Venkatesh M Astro',
          username: 'astro',
          password: 'dev123456',
          role: 'Developer',
          email: 'astro@medrecord.com',
          phone: '+1234567894',
          organization: 'MedRecord Center',
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
        },
        {
          name: 'Project Lead',
          username: 'teamlead',
          password: 'lead123',
          role: 'Team Lead',
          email: 'lead@medrecord.com',
          phone: '+1234567896',
          organization: 'MedRecord Center',
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

      // Insert patients
      const patients = [
        { name: 'John Doe', age: 45, status: 'Active' },
        { name: 'Jane Smith', age: 32, status: 'Under Review' },
        { name: 'Robert Johnson', age: 58, status: 'Active' },
        { name: 'Emily Davis', age: 28, status: 'Active' }
      ];

      patients.forEach(patient => {
        db.run(
          `INSERT OR IGNORE INTO Patients (name, age, status) VALUES (?, ?, ?)`,
          [patient.name, patient.age, patient.status],
          (err) => {
            if (err) console.error('Error inserting patient:', err);
          }
        );
      });

      // Insert sample medical records
      const records = [
        { patient_id: 1, type: 'X-Ray', filePath: '/secure/reports/john_xray.pdf' },
        { patient_id: 1, type: 'Blood Test', filePath: '/secure/reports/john_blood.pdf' },
        { patient_id: 2, type: 'MRI', filePath: '/secure/reports/jane_mri.pdf' },
        { patient_id: 3, type: 'CT Scan', filePath: '/secure/reports/robert_ct.pdf' }
      ];

      records.forEach(record => {
        db.run(
          `INSERT OR IGNORE INTO Records (patient_id, type, encrypted_path, created_by, created_at) 
           VALUES (?, ?, ?, 1, datetime('now'))`,
          [record.patient_id, record.type, record.filePath],
          (err) => {
            if (err) console.error('Error inserting record:', err);
          }
        );
      });

      console.log('✅ Database seeded successfully');
      resolve();
    });
  });
}

module.exports = { seed };
