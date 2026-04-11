use tauri::command;
use crate::AppState;

#[command]
pub async fn get_audit_logs(
    _state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    Ok(vec!["Audit logs placeholder".to_string()])
}
