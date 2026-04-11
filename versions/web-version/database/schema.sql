-- Medical Records Center Database Schema

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'nurse', 'staff', 'receptionist', 'pharmacy')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    blood_type VARCHAR(5),
    allergies TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    assessment TEXT,
    plan TEXT,
    vital_signs TEXT, -- JSON string for vitals
    diagnosis_codes TEXT, -- JSON array of ICD-10 codes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50) CHECK (appointment_type IN ('Routine Checkup', 'Follow-up Visit', 'Urgent Care', 'Specialist Consultation', 'Lab Test', 'Imaging', 'Procedure', 'Vaccination')),
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'dispensed', 'cancelled')),
    dispensed_by INTEGER,
    dispensed_at DATETIME,
    dispensed_notes TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (dispensed_by) REFERENCES users(id)
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    critical_level INTEGER NOT NULL DEFAULT 5,
    expiry_date DATE,
    batch_number VARCHAR(50),
    storage_requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'dispensed')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(200),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Prescription Dispensaries Table
CREATE TABLE IF NOT EXISTS prescription_dispensaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id INTEGER NOT NULL,
    inventory_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    dispensed_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (dispensed_by) REFERENCES users(id)
);

-- Lab Results Table
CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id INTEGER NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    test_category VARCHAR(50),
    test_date DATE NOT NULL,
    result_date DATE,
    result_value VARCHAR(100),
    unit VARCHAR(20),
    reference_range VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Abnormal')),
    abnormal_flag VARCHAR(5),
    interpretation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id VARCHAR(20),
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Births Table
CREATE TABLE IF NOT EXISTS births (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    birth_id VARCHAR(20) UNIQUE NOT NULL,
    mother_patient_id VARCHAR(20) NOT NULL,
    newborn_patient_id VARCHAR(20) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    birth_date DATE NOT NULL,
    birth_time TIME,
    newborn_gender VARCHAR(10) CHECK (newborn_gender IN ('Male', 'Female')),
    birth_weight VARCHAR(50),
    apgar_score VARCHAR(50),
    delivery_type VARCHAR(100),
    complication VARCHAR(200),
    gestation_weeks INTEGER,
    attending_doctor_id VARCHAR(20),
    ward VARCHAR(100),
    newborn_condition VARCHAR(200),
    nicu_admission VARCHAR(10) CHECK (nicu_admission IN ('Yes', 'No')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Deaths Table
CREATE TABLE IF NOT EXISTS deaths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    death_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    death_date DATE NOT NULL,
    death_time TIME,
    cause_of_death VARCHAR(200) NOT NULL,
    icd10_cause_code VARCHAR(20),
    secondary_condition VARCHAR(200),
    manner_of_death VARCHAR(50),
    place_of_death VARCHAR(100),
    attending_doctor_id VARCHAR(20),
    death_certificate_number VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('admin', 'admin@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'System', 'Administrator', 'admin');

-- Insert Sample Doctor
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('doctor', 'doctor@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'John', 'Smith', 'doctor');

-- Insert Sample Nurse
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('nurse', 'nurse@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Sarah', 'Johnson', 'nurse');
