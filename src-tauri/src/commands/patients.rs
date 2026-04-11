use serde::{Deserialize, Serialize};
use tauri::command;
use sqlx::SqlitePool;
use chrono::{DateTime, Utc};
use anyhow::Result;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Patient {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub date_of_birth: String,
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
    pub created_at: String,
    pub updated_at: String,
}

#[command]
pub async fn get_patients(
    limit: Option<i32>,
    page: Option<i32>,
    search: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Patient>, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let limit = limit.unwrap_or(50);
    let offset = page.unwrap_or(1).saturating_sub(1) * limit;

    let mut query = "SELECT * FROM patients WHERE 1=1".to_string();
    let mut params = Vec::new();

    if let Some(search_term) = search {
        if !search_term.is_empty() {
            query.push_str(" AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            let search_pattern = format!("%{}%", search_term);
            params.push(search_pattern.clone());
            params.push(search_pattern.clone());
            params.push(search_pattern.clone());
            params.push(search_pattern);
        }
    }

    query.push_str(" ORDER BY last_name, first_name LIMIT ? OFFSET ?");
    params.push(limit.to_string());
    params.push(offset.to_string());

    let mut sql_query = sqlx::query_as::<_, Patient>(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }

    let results = sql_query
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch patients: {}", e))?;

    Ok(results)
}

#[command]
pub async fn get_patient(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Patient, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let result = sqlx::query_as::<_, Patient>(
        "SELECT * FROM patients WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch patient: {}", e))?;

    Ok(result)
}

#[command]
pub async fn create_patient(
    patient: Patient,
    state: tauri::State<'_, AppState>,
) -> Result<Patient, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let now = Utc::now().to_rfc3339();

    let new_patient = Patient {
        id: patient.id.clone(),
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zip_code: patient.zip_code,
        country: patient.country,
        blood_type: patient.blood_type,
        allergies: patient.allergies,
        medical_history: patient.medical_history,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone,
        insurance_provider: patient.insurance_provider,
        insurance_policy_number: patient.insurance_policy_number,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        r#"
        INSERT INTO patients (
            id, first_name, last_name, date_of_birth, gender, phone, email,
            address, city, state, zip_code, country, blood_type, allergies,
            medical_history, emergency_contact_name, emergency_contact_phone,
            insurance_provider, insurance_policy_number, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_patient.id)
    .bind(&new_patient.first_name)
    .bind(&new_patient.last_name)
    .bind(&new_patient.date_of_birth)
    .bind(&new_patient.gender)
    .bind(&new_patient.phone)
    .bind(&new_patient.email)
    .bind(&new_patient.address)
    .bind(&new_patient.city)
    .bind(&new_patient.state)
    .bind(&new_patient.zip_code)
    .bind(&new_patient.country)
    .bind(&new_patient.blood_type)
    .bind(&new_patient.allergies)
    .bind(&new_patient.medical_history)
    .bind(&new_patient.emergency_contact_name)
    .bind(&new_patient.emergency_contact_phone)
    .bind(&new_patient.insurance_provider)
    .bind(&new_patient.insurance_policy_number)
    .bind(&new_patient.created_at)
    .bind(&new_patient.updated_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create patient: {}", e))?;

    Ok(new_patient)
}

#[command]
pub async fn update_patient(
    id: String,
    patient: Patient,
    state: tauri::State<'_, AppState>,
) -> Result<Patient, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let now = Utc::now().to_rfc3339();

    let updated_patient = Patient {
        id: id.clone(),
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zip_code: patient.zip_code,
        country: patient.country,
        blood_type: patient.blood_type,
        allergies: patient.allergies,
        medical_history: patient.medical_history,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone,
        insurance_provider: patient.insurance_provider,
        insurance_policy_number: patient.insurance_policy_number,
        created_at: patient.created_at,
        updated_at: now,
    };

    sqlx::query(
        r#"
        UPDATE patients SET
            first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?,
            address = ?, city = ?, state = ?, zip_code = ?, country = ?, blood_type = ?, allergies = ?,
            medical_history = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
            insurance_provider = ?, insurance_policy_number = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&updated_patient.first_name)
    .bind(&updated_patient.last_name)
    .bind(&updated_patient.date_of_birth)
    .bind(&updated_patient.gender)
    .bind(&updated_patient.phone)
    .bind(&updated_patient.email)
    .bind(&updated_patient.address)
    .bind(&updated_patient.city)
    .bind(&updated_patient.state)
    .bind(&updated_patient.zip_code)
    .bind(&updated_patient.country)
    .bind(&updated_patient.blood_type)
    .bind(&updated_patient.allergies)
    .bind(&updated_patient.medical_history)
    .bind(&updated_patient.emergency_contact_name)
    .bind(&updated_patient.emergency_contact_phone)
    .bind(&updated_patient.insurance_provider)
    .bind(&updated_patient.insurance_policy_number)
    .bind(&updated_patient.updated_at)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update patient: {}", e))?;

    Ok(updated_patient)
}

#[command]
pub async fn delete_patient(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    sqlx::query("DELETE FROM patients WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete patient: {}", e))?;

    Ok(())
}

#[command]
pub async fn search_patients(
    query: String,
    limit: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Patient>, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let limit = limit.unwrap_or(20);
    let search_pattern = format!("%{}%", query);

    let results = sqlx::query_as::<_, Patient>(
        r#"
        SELECT * FROM patients 
        WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
        ORDER BY last_name, first_name
        LIMIT ?
        "#
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to search patients: {}", e))?;

    Ok(results)
}
