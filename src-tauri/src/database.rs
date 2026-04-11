use sqlx::{SqlitePool, sqlite::SqliteConnectOptions, migrate::MigrateDatabase, Row};
use chrono::{DateTime, Utc};
use anyhow::Result;
use std::path::Path;

pub async fn initialize_database() -> Result<SqlitePool> {
    // Create database directory if it doesn't exist
    let db_path = "medical_records.db";
    let db_dir = Path::new(db_path).parent().unwrap_or(Path::new("."));
    
    if !db_dir.exists() {
        std::fs::create_dir_all(db_dir)?;
    }

    // Configure SQLite connection
    let connect_options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal);

    // Create connection pool
    let pool = SqlitePool::connect_with(connect_options).await?;

    // Run migrations
    create_tables(&pool).await?;
    
    println!("✅ Database initialized successfully");
    Ok(pool)
}

async fn create_tables(pool: &SqlitePool) -> Result<()> {
    // Users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            permissions TEXT NOT NULL,
            full_name TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Patients table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth DATE NOT NULL,
            gender TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            country TEXT,
            blood_type TEXT,
            allergies TEXT,
            medical_history TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            insurance_provider TEXT,
            insurance_policy_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await?;

    // Medical records table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS medical_records (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            visit_date DATE NOT NULL,
            chief_complaint TEXT,
            history_of_present_illness TEXT,
            physical_examination TEXT,
            assessment TEXT,
            plan TEXT,
            vital_signs TEXT,
            notes TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES users(id)
        )
        "#
    )
    .execute(pool)
    .await?;

    // Appointments table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            appointment_date DATETIME NOT NULL,
            duration_minutes INTEGER DEFAULT 30,
            appointment_type TEXT NOT NULL,
            status TEXT DEFAULT 'SCHEDULED',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES users(id)
        )
        "#
    )
    .execute(pool)
    .await?;

    // Prescriptions table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            medical_record_id TEXT,
            medication_name TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            route TEXT NOT NULL,
            duration TEXT NOT NULL,
            instructions TEXT,
            refills INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            prescribed_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES users(id),
            FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
        )
        "#
    )
    .execute(pool)
    .await?;

    // Lab results table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS lab_results (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            medical_record_id TEXT,
            test_name TEXT NOT NULL,
            test_category TEXT NOT NULL,
            test_date DATE NOT NULL,
            result_date DATE,
            result_value TEXT,
            unit TEXT,
            reference_range TEXT,
            status TEXT DEFAULT 'PENDING',
            abnormal_flag TEXT,
            interpretation TEXT,
            file_path TEXT,
            file_name TEXT,
            file_size INTEGER,
            mime_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES users(id),
            FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
        )
        "#
    )
    .execute(pool)
    .await?;

    // Audit logs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            old_values TEXT,
            new_values TEXT,
            ip_address TEXT,
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        "#
    )
    .execute(pool)
    .await?;

    // Create indexes for performance
    let indexes = vec![
        "CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name)",
        "CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth)",
        "CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id)",
        "CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id)",
        "CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(visit_date)",
        "CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)",
        "CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id)",
        "CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)",
        "CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id)",
        "CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(patient_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
    ];

    for index in indexes {
        sqlx::query(index).execute(pool).await?;
    }

    println!("✅ Database tables created successfully");
    Ok(())
}

pub async fn health_check(pool: &SqlitePool) -> Result<bool> {
    let result = sqlx::query("SELECT 1")
        .fetch_one(pool)
        .await;
    
    match result {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
