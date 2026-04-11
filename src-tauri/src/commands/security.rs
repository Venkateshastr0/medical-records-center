use tauri::command;
use crate::AppState;

#[command]
pub async fn get_security_status(
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Security status OK".to_string())
}

#[command]
pub async fn check_permissions(
    _user_id: String,
    _permission: String,
    _state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    Ok(true)
}
