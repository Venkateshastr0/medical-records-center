// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::sync::Arc;
use tokio::sync::Mutex;
use sqlx::SqlitePool;

mod commands;
mod database;
mod security;
mod models;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Arc<Mutex<Option<SqlitePool>>>,
}

#[tokio::main]
async fn main() {
    // Initialize database pool
    let db_pool = database::initialize_database().await
        .expect("Failed to initialize database");
    
    let state = AppState {
        db_pool: Arc::new(Mutex::new(Some(db_pool))),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_current_user,
            commands::users::get_users,
            commands::users::get_user,
            commands::users::get_doctors,
            commands::users::create_user,
            commands::users::update_user,
            commands::users::delete_user,
            commands::patients::get_patients,
            commands::patients::get_patient,
            commands::patients::create_patient,
            commands::patients::update_patient,
            commands::patients::delete_patient,
            commands::patients::search_patients,
            commands::medical_records::get_medical_records,
            commands::medical_records::create_medical_record,
            commands::medical_records::update_medical_record,
            commands::appointments::get_appointments,
            commands::appointments::create_appointment,
            commands::appointments::update_appointment,
            commands::prescriptions::get_prescriptions,
            commands::prescriptions::create_prescription,
            commands::prescriptions::update_prescription,
            commands::lab_results::get_lab_results,
            commands::lab_results::get_lab_result,
            commands::lab_results::create_lab_result,
            commands::lab_results::update_lab_result,
            commands::lab_results::delete_lab_result,
            commands::lab_results::get_lab_result_file,
            commands::audit::get_audit_logs,
            commands::security::get_security_status,
            commands::security::check_permissions,
            commands::dashboard::get_dashboard_stats,
            commands::system::health_check,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Set up window state
            window.set_title("Medical Records Center").unwrap();
            
            #[cfg(debug_assertions)]
            {
                let window = window.clone();
                window.open_devtools();
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
