use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};
use ring::{digest, pbkdf2, aead::{self, BoundKey, Aad, Nonce, UnboundKey, SealingKey, OpeningKey, NONCE_LEN}};
use ring::rand::{SecureRandom, SystemRandom};
use base64::{Engine as _, engine::general_purpose};
use anyhow::{Result, anyhow};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // Subject (user ID)
    pub username: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub iat: usize,        // Issued at
    pub exp: usize,         // Expiration
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSession {
    pub user_id: String,
    pub username: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub expires_at: chrono::DateTime<Utc>,
}

pub struct SecurityService {
    jwt_secret: String,
    rng: SystemRandom,
}

impl SecurityService {
    pub fn new(jwt_secret: String) -> Self {
        Self { 
            jwt_secret,
            rng: SystemRandom::new(),
        }
    }

    /// Derive a 256-bit key from the secret for AES-256-GCM
    fn get_encryption_key(&self) -> Result<[u8; 32]> {
        let hash = digest::digest(&digest::SHA256, self.jwt_secret.as_bytes());
        let mut key = [0u8; 32];
        key.copy_from_slice(hash.as_ref());
        Ok(key)
    }

    pub fn hash_password(&self, password: &str, salt: &str) -> Result<String> {
        let salt_bytes = general_purpose::STANDARD.decode(salt)?;
        let mut output = [0u8; 32];
        pbkdf2::derive(
            pbkdf2::PBKDF2_HMAC_SHA256,
            std::num::NonZeroU32::new(100_000).unwrap(),
            &salt_bytes,
            password.as_bytes(),
            &mut output,
        );
        Ok(general_purpose::STANDARD.encode(output))
    }

    pub fn generate_salt(&self) -> String {
        let mut salt = [0u8; 16];
        self.rng.fill(&mut salt).expect("Failed to generate salt");
        general_purpose::STANDARD.encode(salt)
    }

    pub fn verify_password(&self, password: &str, hash: &str, salt: &str) -> Result<bool> {
        let computed_hash = self.hash_password(password, salt)?;
        Ok(computed_hash == hash)
    }

    pub fn generate_jwt(&self, user_id: &str, username: &str, role: &str, permissions: Vec<String>) -> Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(24); // 24 hour expiration

        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            role: role.to_string(),
            permissions,
            iat: now.timestamp() as usize,
            exp: exp.timestamp() as usize,
        };

        let header = Header::default();
        let token = encode(&header, &claims, &EncodingKey::from_secret(self.jwt_secret.as_ref()))?;
        Ok(token)
    }

    pub fn verify_jwt(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        )?;
        Ok(token_data.claims)
    }

    pub fn check_permission(&self, user_role: &str, required_permission: &str) -> bool {
        let role_permissions = self.get_role_permissions(user_role);
        role_permissions.contains(&required_permission.to_string())
    }

    pub fn get_role_permissions(&self, role: &str) -> Vec<String> {
        match role {
            "admin" => vec![
                "user.create", "user.read", "user.update", "user.delete",
                "patient.create", "patient.read", "patient.update", "patient.delete",
                "medical_record.create", "medical_record.read", "medical_record.update", "medical_record.delete",
                "appointment.create", "appointment.read", "appointment.update", "appointment.delete",
                "prescription.create", "prescription.read", "prescription.update", "prescription.delete",
                "lab_result.create", "lab_result.read", "lab_result.update", "lab_result.delete",
                "audit.read", "system.admin", "security.admin"
            ],
            "doctor" => vec![
                "patient.read", "patient.update",
                "medical_record.create", "medical_record.read", "medical_record.update",
                "appointment.create", "appointment.read", "appointment.update",
                "prescription.create", "prescription.read", "prescription.update",
                "lab_result.read", "lab_result.create"
            ],
            "nurse" => vec![
                "patient.read", "patient.update",
                "medical_record.read", "medical_record.update",
                "appointment.read", "appointment.update",
                "prescription.read", "prescription.update",
                "lab_result.read"
            ],
            "receptionist" => vec![
                "patient.create", "patient.read", "patient.update",
                "appointment.create", "appointment.read", "appointment.update"
            ],
            "analyst" => vec![
                "patient.read",
                "medical_record.read",
                "appointment.read",
                "prescription.read",
                "lab_result.read",
                "audit.read"
            ],
            _ => vec![], // No permissions for unknown roles
        }
    }

    /// Full AES-256-GCM Encryption following Zero-Trust principles
    pub fn encrypt_sensitive_data(&self, data: &str) -> Result<String> {
        let key_bytes = self.get_encryption_key()?;
        let unbound_key = UnboundKey::new(&aead::AES_256_GCM, &key_bytes)
            .map_err(|_| anyhow!("Failed to create AEAD key"))?;
        
        // Generate a random 12-byte nonce
        let mut nonce_bytes = [0u8; NONCE_LEN];
        self.rng.fill(&mut nonce_bytes).map_err(|_| anyhow!("Nonce generation failed"))?;
        
        let sealing_key = SealingKey::new(unbound_key, Nonce::assume_unique_forward(nonce_bytes));
        
        let mut in_out = data.as_bytes().to_vec();
        
        // Seal (encrypt) the data in place
        sealing_key.seal_in_place_append_tag(Aad::empty(), &mut in_out)
            .map_err(|_| anyhow!("Encryption failed"))?;
        
        // Combine nonce + encrypted data + tag
        let mut result = nonce_bytes.to_vec();
        result.extend(in_out);
        
        Ok(general_purpose::STANDARD.encode(result))
    }

    /// Full AES-256-GCM Decryption
    pub fn decrypt_sensitive_data(&self, b64_encrypted_data: &str) -> Result<String> {
        let encrypted_data = general_purpose::STANDARD.decode(b64_encrypted_data)
            .map_err(|_| anyhow!("Invalid base64 data"))?;
        
        if encrypted_data.len() < NONCE_LEN + 16 {
            return Err(anyhow!("Encrypted data too short"));
        }
        
        let key_bytes = self.get_encryption_key()?;
        let unbound_key = UnboundKey::new(&aead::AES_256_GCM, &key_bytes)
            .map_err(|_| anyhow!("Failed to create AEAD key"))?;
        
        let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_LEN);
        let mut nonce_arr = [0u8; NONCE_LEN];
        nonce_arr.copy_from_slice(nonce_bytes);
        
        let mut opening_key = OpeningKey::new(unbound_key, Nonce::assume_unique_forward(nonce_arr));
        
        let mut in_out = ciphertext.to_vec();
        
        // Open (decrypt and verify) the data in place
        let decrypted_data = opening_key.open_in_place(Aad::empty(), &mut in_out)
            .map_err(|_| anyhow!("Decryption or authentication failed"))?;
        
        Ok(String::from_utf8(decrypted_data.to_vec())?)
    }

    pub fn generate_device_fingerprint(&self, user_agent: &str, ip: &str) -> String {
        let data = format!("{}:{}", user_agent, ip);
        let hash = digest::digest(&digest::SHA256, data.as_bytes());
        hex::encode(hash)
    }

    pub fn check_ip_reputation(&self, ip: &str) -> bool {
        // Simple trust list for LAN
        ip.starts_with("192.168.") || ip.starts_with("10.") || ip.starts_with("127.0.0.1") || ip == "::1"
    }

    pub fn validate_session(&self, session: &UserSession) -> bool {
        let now = Utc::now();
        now < session.expires_at
    }

    pub fn audit_log(&self, user_id: &str, action: &str, resource_type: &str, resource_id: &str) -> Result<String> {
        // This would normally call a database command
        // For now, logging to console as a placeholder for security monitor
        println!("[AUDIT] User: {}, Action: {}, Resource: {}/{}", user_id, action, resource_type, resource_id);
        Ok(uuid::Uuid::new_v4().to_string())
    }
}

pub enum UserRole {
    Admin,
    Doctor,
    Nurse,
    Receptionist,
    Analyst,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Admin => "admin",
            UserRole::Doctor => "doctor",
            UserRole::Nurse => "nurse",
            UserRole::Receptionist => "receptionist",
            UserRole::Analyst => "analyst",
        }
    }

    pub fn from_str(role: &str) -> Self {
        match role {
            "admin" => UserRole::Admin,
            "doctor" => UserRole::Doctor,
            "nurse" => UserRole::Nurse,
            "receptionist" => UserRole::Receptionist,
            _ => UserRole::Analyst, 
        }
    }
}
