CREATE TABLE STAFF (
    staff_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(50), last_name VARCHAR(50), role VARCHAR(50), specialisation VARCHAR(100),
    date_of_birth DATE, gender VARCHAR(20), phone VARCHAR(50), email VARCHAR(100),
    address TEXT, city VARCHAR(50), state VARCHAR(50), zip_code VARCHAR(20),
    qualification VARCHAR(100), join_date DATE, ward VARCHAR(100), shift VARCHAR(50), salary INTEGER
);

CREATE TABLE PATIENTS (
    patient_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(50), last_name VARCHAR(50), date_of_birth DATE, gender VARCHAR(20),
    phone VARCHAR(50), email VARCHAR(100), address TEXT, city VARCHAR(50), state VARCHAR(50),
    zip_code VARCHAR(20), blood_type VARCHAR(10), allergies TEXT, emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50), insurance_provider VARCHAR(100), insurance_policy_number VARCHAR(100)
);

CREATE TABLE APPOINTMENTS (
    appointment_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50), doctor_id VARCHAR(50), appointment_date DATE, appointment_time VARCHAR(20),
    appointment_type VARCHAR(50), status VARCHAR(50), reason TEXT, duration_minutes INTEGER,
    token_number INTEGER, consultation_fee INTEGER, fee_paid VARCHAR(20), notes TEXT
);

CREATE TABLE MEDICAL_RECORDS (
    record_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50), doctor_id VARCHAR(50), visit_date DATE,
    chief_complaint TEXT, history_of_present_illness TEXT, physical_examination TEXT,
    assessment TEXT, plan TEXT, vital_signs TEXT, diagnosis_codes TEXT
);

CREATE TABLE PRESCRIPTIONS (
    prescription_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50), doctor_id VARCHAR(50), pharmacist_id VARCHAR(50),
    prescription_date DATE, drug_name VARCHAR(100), duration VARCHAR(50),
    quantity INTEGER, refill_allowed VARCHAR(20), instructions TEXT, dispensed_status VARCHAR(50)
);

CREATE TABLE LAB_RESULTS (
    lab_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50), doctor_id VARCHAR(50), test_name VARCHAR(100),
    ordered_date DATE, result_date DATE, result_value VARCHAR(100),
    unit VARCHAR(50), reference_range VARCHAR(100), flag VARCHAR(50),
    status VARCHAR(50), lab_centre VARCHAR(100), remarks TEXT
);
