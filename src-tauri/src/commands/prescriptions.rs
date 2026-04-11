use tauri::command;
use crate::AppState;

#[command]
pub async fn get_prescriptions(
    _state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    Ok(vec!["Prescriptions placeholder".to_string()])
}

#[command]
pub async fn create_prescription(
    _prescription: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Prescription created".to_string())
}

#[command]
pub async fn update_prescription(
    _id: String,
    _prescription: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Prescription updated".to_string())
}
