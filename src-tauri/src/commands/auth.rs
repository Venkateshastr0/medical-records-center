use crate::models::*;
use crate::security::{SecurityService, UserRole};
use crate::AppState;
use tauri::State;
use sqlx::SqlitePool;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn login(
    username: String,
    password: String,
    remember_me: Option<bool>,
    state: State<'_, AppState>,
) -> Result<LoginResponse, String> {
    let pool = {
        let pool_guard = state.db_pool.lock().await;
        match pool_guard.as_ref() {
            Some(pool) => pool.clone(),
            None => return Err("Database not initialized".to_string()),
        }
    };

    // Find user by username
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE username = ? AND is_active = TRUE"
    )
    .bind(&username)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let user = match user {
        Some(user) => user,
        None => {
            return Ok(LoginResponse {
                success: false,
                token: None,
                user: None,
                message: "Invalid username or password".to_string(),
            });
        }
    };

    // Verify password (in production, use proper password hashing)
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    // For demo purposes, we'll use a simple password check
    // In production, use proper password verification
    if password != "password123" { // Replace with proper password verification
        return Ok(LoginResponse {
            success: false,
            token: None,
            user: None,
            message: "Invalid username or password".to_string(),
        });
    }

    // Generate JWT token
    let permissions: Vec<String> = user.permissions
        .split(',')
        .map(|p| p.trim().to_string())
        .collect();

    let token = security_service.generate_jwt(
        &user.id,
        &user.username,
        &user.role,
        permissions.clone(),
    ).map_err(|e| format!("Token generation error: {}", e))?;

    // Log successful login
    let _ = security_service.audit_log(
        &user.id,
        "LOGIN_SUCCESS",
        "USER",
        &user.id,
    );

    Ok(LoginResponse {
        success: true,
        token: Some(token),
        user: Some(user),
        message: "Login successful".to_string(),
    })
}

#[tauri::command]
pub async fn logout(
    user_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    // Log logout
    let _ = security_service.audit_log(
        &user_id,
        "LOGOUT",
        "USER",
        &user_id,
    );

    Ok(true)
}

#[tauri::command]
pub async fn get_current_user(
    token: String,
    state: State<'_, AppState>,
) -> Result<Option<User>, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    let claims = security_service.verify_jwt(&token)
        .map_err(|e| format!("Invalid token: {}", e))?;

    let pool = {
        let pool_guard = state.db_pool.lock().await;
        match pool_guard.as_ref() {
            Some(pool) => pool.clone(),
            None => return Err("Database not initialized".to_string()),
        }
    };

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = ? AND is_active = TRUE"
    )
    .bind(&claims.sub)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(user)
}

#[tauri::command]
pub async fn check_permissions(
    token: String,
    required_permission: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    let claims = security_service.verify_jwt(&token)
        .map_err(|e| format!("Invalid token: {}", e))?;

    let has_permission = security_service.check_permission(&claims.role, &required_permission);
    
    Ok(has_permission)
}

#[tauri::command]
pub async fn create_user(
    user_data: User,
    token: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<User>, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    // Verify token and permissions
    let claims = security_service.verify_jwt(&token)
        .map_err(|e| format!("Invalid token: {}", e))?;

    if !security_service.check_permission(&claims.role, "user.create") {
        return Ok(ApiResponse::error("Insufficient permissions".to_string()));
    }

    let pool = {
        let pool_guard = state.db_pool.lock().await;
        match pool_guard.as_ref() {
            Some(pool) => pool.clone(),
            None => return Err("Database not initialized".to_string()),
        }
    };

    // Generate new user ID
    let user_id = uuid::Uuid::new_v4().to_string();
    
    // Hash password (in production, use proper password hashing)
    let password_hash = user_data.password_hash; // Should be hashed before creating

    // Insert new user
    let result = sqlx::query(
        r#"
        INSERT INTO users (
            id, username, email, password_hash, role, permissions, 
            full_name, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&user_id)
    .bind(&user_data.username)
    .bind(&user_data.email)
    .bind(&password_hash)
    .bind(&user_data.role)
    .bind(&user_data.permissions)
    .bind(&user_data.full_name)
    .bind(&user_data.is_active)
    .bind(chrono::Utc::now())
    .bind(chrono::Utc::now())
    .execute(&pool)
    .await;

    match result {
        Ok(_) => {
            // Log user creation
            let _ = security_service.audit_log(
                &claims.sub,
                "USER_CREATE",
                "USER",
                &user_id,
            );

            // Fetch created user
            let created_user = sqlx::query_as::<_, User>(
                "SELECT * FROM users WHERE id = ?"
            )
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;

            Ok(ApiResponse::success(created_user))
        }
        Err(e) => Ok(ApiResponse::error(format!("Failed to create user: {}", e))),
    }
}

#[tauri::command]
pub async fn update_user(
    user_id: String,
    user_data: User,
    token: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<User>, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    // Verify token and permissions
    let claims = security_service.verify_jwt(&token)
        .map_err(|e| format!("Invalid token: {}", e))?;

    if !security_service.check_permission(&claims.role, "user.update") {
        return Ok(ApiResponse::error("Insufficient permissions".to_string()));
    }

    let pool = {
        let pool_guard = state.db_pool.lock().await;
        match pool_guard.as_ref() {
            Some(pool) => pool.clone(),
            None => return Err("Database not initialized".to_string()),
        }
    };

    // Update user
    let result = sqlx::query(
        r#"
        UPDATE users SET 
            username = ?, email = ?, role = ?, permissions = ?, 
            full_name = ?, is_active = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&user_data.username)
    .bind(&user_data.email)
    .bind(&user_data.role)
    .bind(&user_data.permissions)
    .bind(&user_data.full_name)
    .bind(&user_data.is_active)
    .bind(chrono::Utc::now())
    .bind(&user_id)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => {
            // Log user update
            let _ = security_service.audit_log(
                &claims.sub,
                "USER_UPDATE",
                "USER",
                &user_id,
            );

            // Fetch updated user
            let updated_user = sqlx::query_as::<_, User>(
                "SELECT * FROM users WHERE id = ?"
            )
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;

            Ok(ApiResponse::success(updated_user))
        }
        Err(e) => Ok(ApiResponse::error(format!("Failed to update user: {}", e))),
    }
}

#[tauri::command]
pub async fn delete_user(
    user_id: String,
    token: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<bool>, String> {
    let security_service = SecurityService::new("your-secret-key-here".to_string());
    
    // Verify token and permissions
    let claims = security_service.verify_jwt(&token)
        .map_err(|e| format!("Invalid token: {}", e))?;

    if !security_service.check_permission(&claims.role, "user.delete") {
        return Ok(ApiResponse::error("Insufficient permissions".to_string()));
    }

    let pool = {
        let pool_guard = state.db_pool.lock().await;
        match pool_guard.as_ref() {
            Some(pool) => pool.clone(),
            None => return Err("Database not initialized".to_string()),
        }
    };

    // Delete user (soft delete by setting is_active = false)
    let result = sqlx::query(
        "UPDATE users SET is_active = FALSE, updated_at = ? WHERE id = ?"
    )
    .bind(chrono::Utc::now())
    .bind(&user_id)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => {
            // Log user deletion
            let _ = security_service.audit_log(
                &claims.sub,
                "USER_DELETE",
                "USER",
                &user_id,
            );

            Ok(ApiResponse::success(true))
        }
        Err(e) => Ok(ApiResponse::error(format!("Failed to delete user: {}", e))),
    }
}
