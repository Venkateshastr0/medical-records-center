const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'medical_records.db');

// Seed pharmacy data
function seedPharmacyData() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to SQLite database for seeding.');
  });

  // Sample inventory items
  const inventoryItems = [
    {
      name: 'Amoxicillin 500mg',
      generic_name: 'Amoxicillin',
      category: 'Antibiotics',
      manufacturer: 'Pfizer',
      unit_price: 15.50,
      stock_level: 120,
      reorder_level: 50,
      critical_level: 20,
      expiry_date: '2025-12-31',
      batch_number: 'AMX2024001',
      storage_requirements: 'Store at room temperature'
    },
    {
      name: 'Lisinopril 10mg',
      generic_name: 'Lisinopril',
      category: 'Cardiovascular',
      manufacturer: 'Novartis',
      unit_price: 25.75,
      stock_level: 8,
      reorder_level: 30,
      critical_level: 10,
      expiry_date: '2025-08-15',
      batch_number: 'LIS2024002',
      storage_requirements: 'Store at room temperature'
    },
    {
      name: 'Metformin 500mg',
      generic_name: 'Metformin',
      category: 'Diabetes',
      manufacturer: 'GlaxoSmithKline',
      unit_price: 12.30,
      stock_level: 200,
      reorder_level: 100,
      critical_level: 50,
      expiry_date: '2025-10-30',
      batch_number: 'MET2024003',
      storage_requirements: 'Store at room temperature'
    },
    {
      name: 'Ibuprofen 400mg',
      generic_name: 'Ibuprofen',
      category: 'Pain Management',
      manufacturer: 'Johnson & Johnson',
      unit_price: 8.25,
      stock_level: 15,
      reorder_level: 50,
      critical_level: 15,
      expiry_date: '2025-06-20',
      batch_number: 'IBU2024004',
      storage_requirements: 'Store at room temperature'
    },
    {
      name: 'Omeprazole 20mg',
      generic_name: 'Omeprazole',
      category: 'Gastrointestinal',
      manufacturer: 'AstraZeneca',
      unit_price: 18.90,
      stock_level: 75,
      reorder_level: 40,
      critical_level: 20,
      expiry_date: '2025-09-15',
      batch_number: 'OME2024005',
      storage_requirements: 'Store at room temperature'
    }
  ];

  // Sample prescriptions
  const prescriptions = [
    {
      prescription_id: 'RX1001',
      patient_id: 1, // Assuming patient with ID 1 exists
      doctor_id: 2, // Assuming doctor with ID 2 exists
      medication_name: 'Amoxicillin 500mg',
      dosage: '500mg',
      frequency: '3 times daily',
      duration: '7 days',
      instructions: 'Take with food',
      urgency: 'normal',
      status: 'pending',
      notes: 'Patient allergic to penicillin alternatives'
    },
    {
      prescription_id: 'RX1002',
      patient_id: 2, // Assuming patient with ID 2 exists
      doctor_id: 2,
      medication_name: 'Lisinopril 10mg',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take in the morning',
      urgency: 'high',
      status: 'pending',
      notes: 'Follow up required in 2 weeks'
    },
    {
      prescription_id: 'RX1003',
      patient_id: 3,
      doctor_id: 2,
      medication_name: 'Metformin 500mg',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '30 days',
      instructions: 'Take with meals',
      urgency: 'normal',
      status: 'processing',
      notes: 'Monitor blood sugar levels'
    }
  ];

  // Insert inventory items
  const inventoryStmt = db.prepare(`
    INSERT OR REPLACE INTO inventory (
      name, generic_name, category, manufacturer, unit_price,
      stock_level, reorder_level, critical_level, expiry_date,
      batch_number, storage_requirements
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  inventoryItems.forEach(item => {
    inventoryStmt.run([
      item.name, item.generic_name, item.category, item.manufacturer, item.unit_price,
      item.stock_level, item.reorder_level, item.critical_level, item.expiry_date,
      item.batch_number, item.storage_requirements
    ]);
  });

  inventoryStmt.finalize();

  // Insert prescriptions
  const prescriptionStmt = db.prepare(`
    INSERT OR REPLACE INTO prescriptions (
      prescription_id, patient_id, doctor_id, medication_name, dosage,
      frequency, duration, instructions, urgency, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  prescriptions.forEach(prescription => {
    prescriptionStmt.run([
      prescription.prescription_id, prescription.patient_id, prescription.doctor_id,
      prescription.medication_name, prescription.dosage, prescription.frequency,
      prescription.duration, prescription.instructions, prescription.urgency,
      prescription.status, prescription.notes
    ]);
  });

  prescriptionStmt.finalize();

  console.log('Pharmacy data seeded successfully!');

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

// Run seeding
if (require.main === module) {
  seedPharmacyData();
}

module.exports = { seedPharmacyData };
