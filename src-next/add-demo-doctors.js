const database = require('./lib/database');

async function addDemoDoctors() {
  try {
    await database.connect();
    
    const demoDoctors = [
      {
        username: 'johnsmith',
        email: 'john.smith@hospital.com',
        password_hash: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjO',
        first_name: 'John',
        last_name: 'Smith',
        mobile_number: '9876543210',
        role: 'doctor',
        is_approved: 1,
        is_active: 1
      },
      {
        username: 'sarahjohnson',
        email: 'sarah.johnson@hospital.com',
        password_hash: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjO',
        first_name: 'Sarah',
        last_name: 'Johnson',
        mobile_number: '9876543211',
        role: 'doctor',
        is_approved: 1,
        is_active: 1
      },
      {
        username: 'michaelchen',
        email: 'michael.chen@hospital.com',
        password_hash: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjO',
        first_name: 'Michael',
        last_name: 'Chen',
        mobile_number: '9876543212',
        role: 'doctor',
        is_approved: 1,
        is_active: 1
      }
    ];

    console.log('Adding demo doctors...');
    
    for (const doctor of demoDoctors) {
      // Check if doctor already exists
      const existing = await database.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [doctor.username, doctor.email]
      );
      
      if (!existing) {
        const result = await database.run(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, mobile_number, role, is_approved, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          doctor.username,
          doctor.email,
          doctor.password_hash,
          doctor.first_name,
          doctor.last_name,
          doctor.mobile_number,
          doctor.role,
          doctor.is_approved,
          doctor.is_active
        ]);
        
        console.log(`✅ Added Dr. ${doctor.first_name} ${doctor.last_name} (ID: ${result.id})`);
      } else {
        console.log(`⚠️  Dr. ${doctor.first_name} ${doctor.last_name} already exists`);
      }
    }

    console.log('\n✅ Demo doctors setup complete!');
    
    // Verify doctors were added
    const doctors = await database.query(`
      SELECT id, username, first_name, last_name, email 
      FROM users 
      WHERE role = 'doctor' AND is_approved = 1 AND is_active = 1
      ORDER BY first_name ASC
    `);
    
    console.log('\n📋 Available Doctors:');
    doctors.forEach(doc => {
      console.log(`  - Dr. ${doc.first_name} ${doc.last_name} (${doc.username})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding demo doctors:', error);
  } finally {
    if (database.db) {
      database.db.close();
    }
  }
}

addDemoDoctors();
