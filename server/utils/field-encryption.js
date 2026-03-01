const crypto = require('crypto');
const { encrypt } = require('./crypto');

class FieldEncryption {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-medical-key', 'salt', this.keyLength);
    }

    // Encrypt individual fields with different keys per field type
    encryptField(value, fieldType) {
        if (!value) return value;
        
        const fieldKey = this.deriveFieldKey(fieldType);
        const iv = crypto.randomBytes(this.ivLength);
        
        const cipher = crypto.createCipher(this.algorithm, fieldKey);
        cipher.setAAD(Buffer.from(fieldType));
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            fieldType: fieldType
        };
    }

    // Decrypt individual fields
    decryptField(encryptedData) {
        if (!encryptedData || typeof encryptedData !== 'object') return encryptedData;
        
        const fieldKey = this.deriveFieldKey(encryptedData.fieldType);
        const decipher = crypto.createDecipher(this.algorithm, fieldKey);
        
        decipher.setAAD(Buffer.from(encryptedData.fieldType));
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Derive unique key for each field type
    deriveFieldKey(fieldType) {
        return crypto.pbkdf2Sync(this.secretKey, fieldType, 100000, this.keyLength, 'sha256');
    }

    // Encrypt patient data with field-level encryption
    encryptPatientData(patientData) {
        const sensitiveFields = [
            'name', 'email', 'phone', 'address', 'ssn', 
            'medical_history', 'allergies', 'medications'
        ];
        
        const encrypted = { ...patientData };
        
        sensitiveFields.forEach(field => {
            if (encrypted[field]) {
                encrypted[field] = this.encryptField(encrypted[field], `patient_${field}`);
            }
        });
        
        return encrypted;
    }

    // Decrypt patient data
    decryptPatientData(encryptedPatientData) {
        if (!encryptedPatientData) return encryptedPatientData;
        
        const decrypted = { ...encryptedPatientData };
        
        Object.keys(decrypted).forEach(field => {
            if (decrypted[field] && typeof decrypted[field] === 'object' && decrypted[field].encrypted) {
                decrypted[field] = this.decryptField(decrypted[field]);
            }
        });
        
        return decrypted;
    }

    // Generate secure token for password resets
    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hash passwords with salt
    hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        
        const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return { hash, salt };
    }

    // Verify password
    verifyPassword(password, hash, salt) {
        const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return hash === hashVerify;
    }

    // Generate API key with expiration
    generateApiKey(userId, expiresIn = '24h') {
        const payload = {
            userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiration(expiresIn)
        };
        
        return this.signToken(payload);
    }

    // Sign JWT-like token
    signToken(payload) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // Verify token
    verifyToken(token) {
        try {
            const [header, payload, signature] = token.split('.');
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(`${header}.${payload}`)
                .digest('base64url');
            
            if (signature !== expectedSignature) {
                return null;
            }
            
            const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
            
            if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }
            
            return decodedPayload;
        } catch (error) {
            return null;
        }
    }

    parseExpiration(expiresIn) {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));
        
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 86400; // default to 24 hours
        }
    }

    // Audit logging for security events
    logSecurityEvent(eventType, userId, details) {
        const auditEntry = {
            eventType,
            userId,
            timestamp: new Date().toISOString(),
            details,
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown'
        };
        
        console.log('🔒 Security Event:', auditEntry);
        // In production, this would go to a secure audit log
        return auditEntry;
    }
}

module.exports = new FieldEncryption();
