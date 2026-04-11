-- Medical Records Center Database Schema

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'nurse', 'pharmacist', 'staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    mobile_number VARCHAR(15),
    department VARCHAR(100),
    profile_photo TEXT,
    is_approved BOOLEAN DEFAULT 0,
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
    country VARCHAR(50),
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_history TEXT,
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
    queue_number INTEGER, -- Daily sequence number (1, 2, 3...)
    triage_vitals TEXT,   -- JSON: { bp, sugar, weight, temp, heart_rate }
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
    patient_id VARCHAR(20) NOT NULL,
    doctor_id INTEGER NOT NULL,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    route VARCHAR(20) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued')),
    prescription_date DATE NOT NULL,
    medications_json TEXT, -- Support for multiple medications per record
    refills_remaining INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
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

-- Insert Default Admin User
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('admin', 'admin@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'System', 'Administrator', 'admin');

-- Insert Sample Doctor
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('doctor', 'doctor@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'John', 'Smith', 'doctor');

-- Insert Sample Nurse
INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('nurse', 'nurse@medicalrecords.com', '$2b$10$rQZ8ZqGZqGZqGZqGZqGZqO', 'Sarah', 'Johnson', 'nurse');
