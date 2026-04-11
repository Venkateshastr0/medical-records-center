use tauri::command;
use crate::AppState;

#[command]
pub async fn health_check(
    _state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    Ok(true)
}
