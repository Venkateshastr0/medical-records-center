use serde::{Deserialize, Serialize};
use tauri::command;
use sqlx::SqlitePool;
use chrono::{DateTime, Utc};
use std::fs;
use std::path::Path;
use anyhow::Result;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct LabResult {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: String,
    pub medical_record_id: Option<String>,
    pub test_name: String,
    pub test_category: String,
    pub test_date: String,
    pub result_date: Option<String>,
    pub result_value: Option<String>,
    pub unit: Option<String>,
    pub reference_range: Option<String>,
    pub status: String,
    pub abnormal_flag: Option<String>,
    pub interpretation: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLabResultRequest {
    pub patient_id: String,
    pub file_data: Option<Vec<u8>>,
    pub file_name: Option<String>,
    pub display_name: Option<String>,
    pub upload_time: Option<String>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLabResultRequest {
    pub id: String,
    pub test_name: Option<String>,
    pub test_category: Option<String>,
    pub test_date: Option<String>,
    pub result_date: Option<String>,
    pub result_value: Option<String>,
    pub unit: Option<String>,
    pub reference_range: Option<String>,
    pub status: Option<String>,
    pub abnormal_flag: Option<String>,
    pub interpretation: Option<String>,
}

#[command]
pub async fn get_lab_results(
    patient_id: Option<String>,
    doctor_id: Option<String>,
    limit: Option<i32>,
    page: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<LabResult>, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let limit = limit.unwrap_or(50);
    let offset = page.unwrap_or(1).saturating_sub(1) * limit;

    let mut query = "SELECT * FROM lab_results WHERE 1=1".to_string();
    let mut params = Vec::new();

    if let Some(pid) = patient_id {
        query.push_str(" AND patient_id = ?");
        params.push(pid);
    }

    if let Some(did) = doctor_id {
        query.push_str(" AND doctor_id = ?");
        params.push(did);
    }

    query.push_str(" ORDER BY test_date DESC, created_at DESC LIMIT ? OFFSET ?");
    params.push(limit.to_string());
    params.push(offset.to_string());

    let mut sql_query = sqlx::query_as::<_, LabResult>(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }

    let results = sql_query
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch lab results: {}", e))?;

    Ok(results)
}

#[command]
pub async fn get_lab_result(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<LabResult, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let result = sqlx::query_as::<_, LabResult>(
        "SELECT * FROM lab_results WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch lab result: {}", e))?;

    Ok(result)
}

#[command]
pub async fn create_lab_result(
    request: CreateLabResultRequest,
    state: tauri::State<'_, AppState>,
) -> Result<LabResult, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Handle file upload if present
    let (file_path, file_size) = if let (Some(file_data), Some(file_name)) = (&request.file_data, &request.file_name) {
        // Create uploads directory if it doesn't exist
        let uploads_dir = "uploads/lab_results";
        fs::create_dir_all(uploads_dir).map_err(|e| format!("Failed to create uploads directory: {}", e))?;

        // Generate unique filename
        let file_extension = Path::new(file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        let unique_filename = format!("{}_{}.{}", 
            chrono::DateTime::parse_from_rfc3339(&now).unwrap().timestamp(),
            id,
            file_extension
        );
        let file_path = format!("{}/{}", uploads_dir, unique_filename);

        // Write file to disk
        fs::write(&file_path, file_data)
            .map_err(|e| format!("Failed to save file: {}", e))?;

        (Some(file_path), Some(file_data.len() as i64))
    } else {
        (None, None)
    };

    // Create a default lab result entry for file uploads
    let lab_result = LabResult {
        id: id.clone(),
        patient_id: request.patient_id,
        doctor_id: "system".to_string(), // Default doctor for file uploads
        medical_record_id: None,
        test_name: request.display_name.clone().unwrap_or_else(|| request.file_name.clone().unwrap_or_else(|| "Lab Result File".to_string())),
        test_category: "File Upload".to_string(),
        test_date: request.upload_time.clone().unwrap_or_else(|| now.split('T').next().unwrap_or(&now).to_string()),
        result_date: Some(request.upload_time.clone().unwrap_or_else(|| now.split('T').next().unwrap_or(&now).to_string())),
        result_value: Some("File uploaded".to_string()),
        unit: None,
        reference_range: None,
        status: "COMPLETED".to_string(),
        abnormal_flag: Some("NORMAL".to_string()),
        interpretation: Some(format!("File uploaded at {}", request.upload_time.unwrap_or_else(|| now.clone()))),
        file_path,
        file_name: request.file_name,
        file_size,
        mime_type: request.mime_type,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        r#"
        INSERT INTO lab_results (
            id, patient_id, doctor_id, medical_record_id, test_name, test_category,
            test_date, result_date, result_value, unit, reference_range, status,
            abnormal_flag, interpretation, file_path, file_name, file_size, mime_type,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&lab_result.id)
    .bind(&lab_result.patient_id)
    .bind(&lab_result.doctor_id)
    .bind(&lab_result.medical_record_id)
    .bind(&lab_result.test_name)
    .bind(&lab_result.test_category)
    .bind(&lab_result.test_date)
    .bind(&lab_result.result_date)
    .bind(&lab_result.result_value)
    .bind(&lab_result.unit)
    .bind(&lab_result.reference_range)
    .bind(&lab_result.status)
    .bind(&lab_result.abnormal_flag)
    .bind(&lab_result.interpretation)
    .bind(&lab_result.file_path)
    .bind(&lab_result.file_name)
    .bind(&lab_result.file_size)
    .bind(&lab_result.mime_type)
    .bind(&lab_result.created_at)
    .bind(&lab_result.updated_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create lab result: {}", e))?;

    Ok(lab_result)
}

#[command]
pub async fn update_lab_result(
    request: UpdateLabResultRequest,
    state: tauri::State<'_, AppState>,
) -> Result<LabResult, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let now = Utc::now().to_rfc3339();

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut params = Vec::new();

    if let Some(test_name) = &request.test_name {
        updates.push("test_name = ?");
        params.push(test_name.clone());
    }
    if let Some(test_category) = &request.test_category {
        updates.push("test_category = ?");
        params.push(test_category.clone());
    }
    if let Some(test_date) = &request.test_date {
        updates.push("test_date = ?");
        params.push(test_date.clone());
    }
    if let Some(result_date) = &request.result_date {
        updates.push("result_date = ?");
        params.push(result_date.clone());
    }
    if let Some(result_value) = &request.result_value {
        updates.push("result_value = ?");
        params.push(result_value.clone());
    }
    if let Some(unit) = &request.unit {
        updates.push("unit = ?");
        params.push(unit.clone());
    }
    if let Some(reference_range) = &request.reference_range {
        updates.push("reference_range = ?");
        params.push(reference_range.clone());
    }
    if let Some(status) = &request.status {
        updates.push("status = ?");
        params.push(status.clone());
    }
    if let Some(abnormal_flag) = &request.abnormal_flag {
        updates.push("abnormal_flag = ?");
        params.push(abnormal_flag.clone());
    }
    if let Some(interpretation) = &request.interpretation {
        updates.push("interpretation = ?");
        params.push(interpretation.clone());
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = ?");
    params.push(now.clone());
    params.push(request.id.clone());

    let query = format!(
        "UPDATE lab_results SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut sql_query = sqlx::query(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }

    sql_query
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update lab result: {}", e))?;

    // Return updated record
    get_lab_result(request.id, state).await
}

#[command]
pub async fn delete_lab_result(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    // Get lab result to delete associated file
    let lab_result = get_lab_result(id.clone(), state).await?;

    // Delete file if it exists
    if let Some(file_path) = &lab_result.file_path {
        if Path::new(file_path).exists() {
            fs::remove_file(file_path)
                .map_err(|e| format!("Failed to delete file: {}", e))?;
        }
    }

    // Delete from database
    sqlx::query("DELETE FROM lab_results WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete lab result: {}", e))?;

    Ok(())
}

#[command]
pub async fn get_lab_result_file(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let lab_result = get_lab_result(id, state).await?;

    if let Some(file_path) = lab_result.file_path {
        let file_data = fs::read(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        Ok(file_data)
    } else {
        Err("No file associated with this lab result".to_string())
    }
}
