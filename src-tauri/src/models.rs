use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub permissions: String, // JSON string of permissions
    pub full_name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Patient {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub date_of_birth: NaiveDate,
    pub gender: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub country: Option<String>,
    pub blood_type: Option<String>,
    pub allergies: Option<String>,
    pub medical_history: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub insurance_provider: Option<String>,
    pub insurance_policy_number: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MedicalRecord {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: String,
    pub visit_date: NaiveDate,
    pub chief_complaint: Option<String>,
    pub history_of_present_illness: Option<String>,
    pub physical_examination: Option<String>,
    pub assessment: Option<String>,
    pub plan: Option<String>,
    pub vital_signs: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Appointment {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: String,
    pub appointment_date: DateTime<Utc>,
    pub duration_minutes: i32,
    pub appointment_type: String,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Prescription {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: String,
    pub medical_record_id: Option<String>,
    pub medication_name: String,
    pub dosage: String,
    pub frequency: String,
    pub route: String,
    pub duration: String,
    pub instructions: Option<String>,
    pub refills: i32,
    pub status: String,
    pub prescribed_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LabResult {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: String,
    pub medical_record_id: Option<String>,
    pub test_name: String,
    pub test_category: String,
    pub test_date: NaiveDate,
    pub result_date: Option<NaiveDate>,
    pub result_value: Option<String>,
    pub unit: Option<String>,
    pub reference_range: Option<String>,
    pub status: String,
    pub abnormal_flag: Option<String>,
    pub interpretation: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<String>,
    pub old_values: Option<String>,
    pub new_values: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime<Utc>,
}

// Request/Response models for API
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub remember_me: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user: Option<User>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatientCreateRequest {
    pub first_name: String,
    pub last_name: String,
    pub date_of_birth: NaiveDate,
    pub gender: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub country: Option<String>,
    pub blood_type: Option<String>,
    pub allergies: Option<String>,
    pub medical_history: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub insurance_provider: Option<String>,
    pub insurance_policy_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatientUpdateRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub country: Option<String>,
    pub blood_type: Option<String>,
    pub allergies: Option<String>,
    pub medical_history: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub insurance_provider: Option<String>,
    pub insurance_policy_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MedicalRecordCreateRequest {
    pub patient_id: String,
    pub visit_date: NaiveDate,
    pub chief_complaint: Option<String>,
    pub history_of_present_illness: Option<String>,
    pub physical_examination: Option<String>,
    pub assessment: Option<String>,
    pub plan: Option<String>,
    pub vital_signs: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppointmentCreateRequest {
    pub patient_id: String,
    pub doctor_id: String,
    pub appointment_date: DateTime<Utc>,
    pub duration_minutes: Option<i32>,
    pub appointment_type: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrescriptionCreateRequest {
    pub patient_id: String,
    pub medication_name: String,
    pub dosage: String,
    pub frequency: String,
    pub route: String,
    pub duration: String,
    pub instructions: Option<String>,
    pub refills: Option<i32>,
    pub prescribed_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LabResultCreateRequest {
    pub patient_id: String,
    pub test_name: String,
    pub test_category: String,
    pub test_date: NaiveDate,
    pub result_value: Option<String>,
    pub unit: Option<String>,
    pub reference_range: Option<String>,
    pub interpretation: Option<String>,
}

// Dashboard statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_patients: i64,
    pub active_patients: i64,
    pub total_appointments: i64,
    pub upcoming_appointments: i64,
    pub total_medical_records: i64,
    pub recent_medical_records: i64,
    pub total_prescriptions: i64,
    pub active_prescriptions: i64,
    pub total_lab_results: i64,
    pub pending_lab_results: i64,
}

// Security status
#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityStatus {
    pub active_users: i64,
    pub failed_login_attempts: i64,
    pub security_alerts: i64,
    pub last_security_scan: DateTime<Utc>,
    pub system_health: String,
}

// Search filters
#[derive(Debug, Serialize, Deserialize)]
pub struct PatientSearchFilter {
    pub name: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub blood_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppointmentSearchFilter {
    pub patient_id: Option<String>,
    pub doctor_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
    pub appointment_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

// API Response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: "Success".to_string(),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message,
            error: Some(message.clone()),
        }
    }
}
