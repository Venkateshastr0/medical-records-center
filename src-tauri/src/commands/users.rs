use serde::{Deserialize, Serialize};
use tauri::command;
use sqlx::SqlitePool;
use chrono::{DateTime, Utc};
use anyhow::Result;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub permissions: String,
    pub full_name: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[command]
pub async fn get_users(
    role: Option<String>,
    limit: Option<i32>,
    page: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<User>, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let limit = limit.unwrap_or(50);
    let offset = page.unwrap_or(1).saturating_sub(1) * limit;

    let mut query = "SELECT * FROM users WHERE is_active = TRUE".to_string();
    let mut params = Vec::new();

    if let Some(role_filter) = role {
        query.push_str(" AND role = ?");
        params.push(role_filter);
    }

    query.push_str(" ORDER BY full_name LIMIT ? OFFSET ?");
    params.push(limit.to_string());
    params.push(offset.to_string());

    let mut sql_query = sqlx::query_as::<_, User>(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }

    let results = sql_query
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch users: {}", e))?;

    Ok(results)
}

#[command]
pub async fn get_user(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<User, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let result = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = ? AND is_active = TRUE"
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch user: {}", e))?;

    Ok(result)
}

#[command]
pub async fn get_doctors(
    limit: Option<i32>,
    page: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<User>, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let limit = limit.unwrap_or(50);
    let offset = page.unwrap_or(1).saturating_sub(1) * limit;

    let results = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE role = 'doctor' AND is_active = TRUE ORDER BY full_name LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch doctors: {}", e))?;

    Ok(results)
}

#[command]
pub async fn create_user(
    user: User,
    state: tauri::State<'_, AppState>,
) -> Result<User, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let now = Utc::now().to_rfc3339();

    let new_user = User {
        id: user.id.clone(),
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        permissions: user.permissions,
        full_name: user.full_name,
        is_active: user.is_active,
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        r#"
        INSERT INTO users (
            id, username, email, password_hash, role, permissions, full_name,
            is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&new_user.id)
    .bind(&new_user.username)
    .bind(&new_user.email)
    .bind(&new_user.password_hash)
    .bind(&new_user.role)
    .bind(&new_user.permissions)
    .bind(&new_user.full_name)
    .bind(&new_user.is_active)
    .bind(&new_user.created_at)
    .bind(&new_user.updated_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create user: {}", e))?;

    Ok(new_user)
}

#[command]
pub async fn update_user(
    id: String,
    user: User,
    state: tauri::State<'_, AppState>,
) -> Result<User, String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    let now = Utc::now().to_rfc3339();

    let updated_user = User {
        id: id.clone(),
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        permissions: user.permissions,
        full_name: user.full_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: now,
    };

    sqlx::query(
        r#"
        UPDATE users SET
            username = ?, email = ?, password_hash = ?, role = ?, permissions = ?,
            full_name = ?, is_active = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&updated_user.username)
    .bind(&updated_user.email)
    .bind(&updated_user.password_hash)
    .bind(&updated_user.role)
    .bind(&updated_user.permissions)
    .bind(&updated_user.full_name)
    .bind(&updated_user.is_active)
    .bind(&updated_user.updated_at)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update user: {}", e))?;

    Ok(updated_user)
}

#[command]
pub async fn delete_user(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.db_pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not initialized")?;

    // Soft delete by setting is_active to false
    sqlx::query("UPDATE users SET is_active = FALSE WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete user: {}", e))?;

    Ok(())
}
