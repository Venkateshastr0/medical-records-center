const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'medical_records.db');
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEMP_DB_PATH = path.join(DATA_DIR, 'temp_vitalis.db');

// Promisify sqlite3
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function main() {
  console.log('1. Setting up temporary staging database...');
  
  if (fs.existsSync(TEMP_DB_PATH)) {
    try { fs.unlinkSync(TEMP_DB_PATH); } catch(e) {}
  }
  
  const tempDb = new sqlite3.Database(TEMP_DB_PATH);

  try {
    const schemaFile = path.join(DATA_DIR, 'vitalis_schema.sql');
    const datasetFile = path.join(DATA_DIR, 'vitalis_full_dataset (1).sql');
    
    await exec(tempDb, fs.readFileSync(schemaFile, 'utf8'));
    console.log(' - Schema created.');
    
    console.log(' - Importing vitalis dataset into staging...');
    await exec(tempDb, fs.readFileSync(datasetFile, 'utf8'));
    console.log(' - Vitalis dataset loaded.');

    console.log('\n2. Connect to main app DB');
    const appDb = new sqlite3.Database(DB_PATH);

    const staff = await all(tempDb, 'SELECT * FROM STAFF');
    const patients = await all(tempDb, 'SELECT * FROM PATIENTS');
    const records = await all(tempDb, 'SELECT * FROM MEDICAL_RECORDS');
    const appointments = await all(tempDb, 'SELECT * FROM APPOINTMENTS');
    const prescriptions = await all(tempDb, 'SELECT * FROM PRESCRIPTIONS');
    const labResults = await all(tempDb, 'SELECT * FROM LAB_RESULTS');
    
    console.log(`Extracted: ${staff.length} staff, ${patients.length} patients, ${records.length} records, ${appointments.length} appointments, ${prescriptions.length} prescriptions, ${labResults.length} labs.`);

    console.log('\n3. Starting Migration');
    
    // Hash password once
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    await run(appDb, 'BEGIN TRANSACTION');

    try {
      let staffMap = {};
      console.log(' -> Migrating Staff as Users...');
      for (const s of staff) {
        let r = 'staff';
        const rl = s.role.toLowerCase();
        if (rl.includes('doctor')) r = 'doctor';
        else if (rl.includes('nurse')) r = 'nurse';
        else if (rl.includes('pharmacy') || rl.includes('pharmacist')) r = 'pharmacist';
        else if (rl.includes('admin')) r = 'admin';

        const username = (s.first_name.toLowerCase() + '.' + s.last_name.toLowerCase() + Math.random().toString(36).substring(7)).replace(/[^a-z0-9.]/g, '');
        
        const result = await run(appDb, `INSERT OR IGNORE INTO users 
          (username, email, password_hash, first_name, last_name, role, mobile_number, is_approved)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [username, s.email, hash, s.first_name, s.last_name, r, s.phone]);
        
        // If ignore happened, we need to find the user id anyway
        if (result.lastID) {
            staffMap[s.staff_id] = result.lastID;
        } else {
            const existing = await all(appDb, "SELECT id FROM users WHERE email = ?", [s.email]);
            staffMap[s.staff_id] = existing[0]?.id || 1;
        }
      }

      console.log(' -> Migrating Patients...');
      for (const p of patients) {
        await run(appDb, `INSERT OR IGNORE INTO patients 
          (patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, zip_code, blood_type, allergies, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_policy_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.gender, p.phone, p.email, p.address, p.city, p.state, p.zip_code, p.blood_type, p.allergies, p.emergency_contact_name, p.emergency_contact_phone, p.insurance_provider, p.insurance_policy_number]);
      }

      console.log(' -> Migrating Medical Records...');
      for (const r of records) {
        await run(appDb, `INSERT OR IGNORE INTO medical_records
          (record_id, patient_id, doctor_id, visit_date, chief_complaint, history_of_present_illness, physical_examination, assessment, plan, vital_signs, diagnosis_codes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.record_id, r.patient_id, staffMap[r.doctor_id] || 1, r.visit_date, r.chief_complaint, r.history_of_present_illness, r.physical_examination, r.assessment, r.plan, r.vital_signs, r.diagnosis_codes]);
      }

      console.log(' -> Migrating Appointments...');
      for (const a of appointments) {
        let dt = a.appointment_date + ' ' + (a.appointment_time || '09:00:00');
        await run(appDb, `INSERT OR IGNORE INTO appointments
          (appointment_id, patient_id, doctor_id, appointment_date, duration_minutes, appointment_type, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.appointment_id, a.patient_id, staffMap[a.doctor_id] || 1, dt, a.duration_minutes, 'Routine Checkup', 'Completed', a.reason]);
      }

      console.log(' -> Migrating Prescriptions...');
      for (const rx of prescriptions) {
        await run(appDb, `INSERT OR IGNORE INTO prescriptions
          (prescription_id, patient_id, doctor_id, medication_name, dosage, frequency, route, duration, instructions, status, prescription_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rx.prescription_id, rx.patient_id, staffMap[rx.doctor_id] || 1, rx.drug_name, 'Standard', 'As directed', 'Oral', rx.duration, rx.instructions, 'Active', rx.prescription_date]);
      }

      console.log(' -> Migrating Labs...');
      for (const lab of labResults) {
        await run(appDb, `INSERT OR IGNORE INTO lab_results
          (result_id, patient_id, doctor_id, test_name, test_date, result_date, result_value, unit, reference_range, status, abnormal_flag, interpretation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [lab.lab_id, lab.patient_id, staffMap[lab.doctor_id] || 1, lab.test_name, lab.ordered_date, lab.result_date, lab.result_value, lab.unit, lab.reference_range, 'Completed', lab.flag === 'Normal' ? 'No' : 'Yes', lab.remarks]);
      }

      await run(appDb, 'COMMIT');
      console.log('\nSUCCESS: Database enriched with 1000s of records.');
      
      // Cleanup
      tempDb.close();
      appDb.close();
      setTimeout(() => {
        try { fs.unlinkSync(TEMP_DB_PATH); } catch(e) {}
      }, 1000);

    } catch (e) {
      console.error('Migration failed, rolling back:', e);
      await run(appDb, 'ROLLBACK');
    }

  } catch (err) {
    console.error('Fatal error:', err);
  }
}

main();
