use tauri::command;
use crate::AppState;

#[command]
pub async fn get_dashboard_stats(
    _state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok("Dashboard stats placeholder".to_string())
}
