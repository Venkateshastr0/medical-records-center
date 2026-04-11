use tauri::command;
use crate::AppState;

#[command]
pub async fn get_medical_records(
    _state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    Ok(vec!["Medical records placeholder".to_string()])
}

#[command]
pub async fn create_medical_record(
    _record: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Medical record created".to_string())
}

#[command]
pub async fn update_medical_record(
    _id: String,
    _record: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Medical record updated".to_string())
}
