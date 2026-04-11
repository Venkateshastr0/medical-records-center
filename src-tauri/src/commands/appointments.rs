use tauri::command;
use crate::AppState;

#[command]
pub async fn get_appointments(
    _state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    Ok(vec!["Appointments placeholder".to_string()])
}

#[command]
pub async fn create_appointment(
    _appointment: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Appointment created".to_string())
}

#[command]
pub async fn update_appointment(
    _id: String,
    _appointment: String,
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Appointment updated".to_string())
}
