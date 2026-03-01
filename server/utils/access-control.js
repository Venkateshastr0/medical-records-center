const db = require('../db/database');

class AccessControl {
    constructor() {
        this.permissions = {
            // Doctor permissions
            Doctor: {
                can: [
                    'view_own_patients',
                    'add_records',
                    'edit_own_records',
                    'view_patient_history',
                    'generate_reports'
                ],
                cannot: [
                    'view_all_patients',
                    'delete_records',
                    'manage_users',
                    'view_system_logs',
                    'access_billing'
                ]
            },
            
            // Admin permissions
            Admin: {
                can: [
                    'view_all_patients',
                    'manage_users',
                    'view_system_logs',
                    'manage_system_settings',
                    'approve_registrations',
                    'view_audit_logs',
                    'manage_organizations',
                    'access_billing'
                ],
                cannot: [
                    'delete_patient_data',
                    'modify_encrypted_fields'
                ]
            },
            
            // Insurance permissions
            Insurance: {
                can: [
                    'view_requested_records',
                    'request_patient_data',
                    'view_billing_info',
                    'generate_claims'
                ],
                cannot: [
                    'view_all_patients',
                    'add_records',
                    'edit_records',
                    'manage_users',
                    'view_system_logs'
                ]
            },
            
            // Lawyer permissions
            Lawyer: {
                can: [
                    'view_requested_records',
                    'request_legal_documents',
                    'view_case_files',
                    'generate_legal_reports'
                ],
                cannot: [
                    'view_all_patients',
                    'add_records',
                    'edit_records',
                    'manage_users',
                    'view_system_logs',
                    'access_billing'
                ]
            }
        };
    }

    // Check if user has permission for specific action
    hasPermission(userRole, action, resourceOwnerId = null) {
        const rolePermissions = this.permissions[userRole];
        
        if (!rolePermissions) {
            return false;
        }

        // Check explicit denies first
        if (rolePermissions.cannot && rolePermissions.cannot.includes(action)) {
            return false;
        }

        // Check explicit allows
        if (rolePermissions.can && rolePermissions.can.includes(action)) {
            return true;
        }

        // Check resource-specific permissions
        return this.checkResourceSpecificPermission(userRole, action, resourceOwnerId);
    }

    // Check resource-specific permissions (e.g., can only view own patients)
    checkResourceSpecificPermission(userRole, action, resourceOwnerId) {
        switch (userRole) {
            case 'Doctor':
                if (action === 'view_patient_records' && resourceOwnerId) {
                    // Doctor can only view their own patients
                    return this.isDoctorPatient(resourceOwnerId);
                }
                break;
                
            case 'Insurance':
            case 'Lawyer':
                if (action.includes('view') && !action.includes('requested')) {
                    // Insurance and lawyers can only view requested records
                    return false;
                }
                break;
        }
        
        return false;
    }

    // Check if patient belongs to doctor
    isDoctorPatient(patientId, doctorId) {
        return new Promise((resolve) => {
            db.get(
                `SELECT patient_id FROM Patients WHERE patient_id = ? AND assigned_doctor = ?`,
                [patientId, doctorId],
                (err, row) => {
                    resolve(!err && !!row);
                }
            );
        });
    }

    // Get user's access level for specific resource
    getAccessLevel(userId, resourceType, resourceId) {
        return new Promise((resolve) => {
            db.get(
                `SELECT access_level, expires_at FROM AccessPermissions 
                 WHERE user_id = ? AND resource_type = ? AND resource_id = ? 
                 AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))`,
                [userId, resourceType, resourceId],
                (err, row) => {
                    if (err || !row) {
                        resolve(null);
                    } else {
                        resolve({
                            level: row.access_level,
                            expiresAt: row.expires_at
                        });
                    }
                }
            );
        });
    }

    // Grant temporary access to resource
    grantTemporaryAccess(userId, resourceType, resourceId, accessLevel, expiresInHours = 24) {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
            
            db.run(
                `INSERT INTO AccessPermissions 
                 (user_id, resource_type, resource_id, access_level, granted_by, granted_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
                [userId, resourceType, resourceId, accessLevel, 'system', expiresAt],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            permissionId: this.lastID,
                            expiresAt
                        });
                    }
                }
            );
        });
    }

    // Revoke access to resource
    revokeAccess(userId, resourceType, resourceId) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE AccessPermissions 
                 SET status = 'revoked', revoked_at = datetime('now')
                 WHERE user_id = ? AND resource_type = ? AND resource_id = ?`,
                [userId, resourceType, resourceId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ revoked: this.changes });
                    }
                }
            );
        });
    }

    // Check data access based on need-to-know principle
    checkDataAccess(userId, patientId, dataType) {
        return new Promise(async (resolve) => {
            try {
                // Get user details
                const user = await this.getUserDetails(userId);
                if (!user) {
                    resolve({ allowed: false, reason: 'User not found' });
                    return;
                }

                // Check role-based permissions
                if (!this.hasPermission(user.role, `view_${dataType}`)) {
                    resolve({ allowed: false, reason: 'Insufficient role permissions' });
                    return;
                }

                // Check specific access permissions
                const accessLevel = await this.getAccessLevel(userId, 'patient', patientId);
                if (accessLevel) {
                    resolve({ 
                        allowed: true, 
                        level: accessLevel.level,
                        source: 'granted_access',
                        expiresAt: accessLevel.expiresAt
                    });
                    return;
                }

                // Check default access rules
                const defaultAccess = this.getDefaultAccess(user.role, patientId, dataType);
                resolve(defaultAccess);

            } catch (error) {
                resolve({ allowed: false, reason: 'Error checking access', error });
            }
        });
    }

    // Get default access based on role
    getDefaultAccess(userRole, patientId, dataType) {
        switch (userRole) {
            case 'Doctor':
                return { 
                    allowed: true, 
                    level: 'full',
                    source: 'doctor_privilege',
                    condition: 'assigned_patient_only'
                };
                
            case 'Admin':
                return { 
                    allowed: true, 
                    level: 'admin',
                    source: 'admin_privilege'
                };
                
            case 'Insurance':
            case 'Lawyer':
                return { 
                    allowed: false, 
                    reason: 'requires_explicit_access_request',
                    source: 'restricted_access'
                };
                
            default:
                return { allowed: false, reason: 'Unknown role' };
        }
    }

    // Get user details
    getUserDetails(userId) {
        return new Promise((resolve) => {
            db.get(
                `SELECT user_id, role, name, email FROM Users WHERE user_id = ?`,
                [userId],
                (err, row) => {
                    resolve(err ? null : row);
                }
            );
        });
    }

    // Log access attempt
    logAccessAttempt(userId, resourceType, resourceId, action, result, reason = null) {
        const logEntry = {
            userId,
            resourceType,
            resourceId,
            action,
            result, // 'allowed' or 'denied'
            reason,
            timestamp: new Date().toISOString(),
            ipAddress: 'unknown', // Would be extracted from request
            userAgent: 'unknown'   // Would be extracted from request
        };

        console.log('🔐 Access Attempt:', logEntry);
        // In production, this would be stored in secure audit logs
        return logEntry;
    }

    // Get user's effective permissions
    getEffectivePermissions(userId) {
        return new Promise(async (resolve) => {
            try {
                const user = await this.getUserDetails(userId);
                if (!user) {
                    resolve([]);
                    return;
                }

                const rolePerms = this.permissions[user.role];
                const grantedPerms = await this.getGrantedPermissions(userId);

                resolve({
                    role: user.role,
                    can: rolePerms.can || [],
                    cannot: rolePerms.cannot || [],
                    granted: grantedPerms
                });

            } catch (error) {
                resolve([]);
            }
        });
    }

    // Get granted permissions for user
    getGrantedPermissions(userId) {
        return new Promise((resolve) => {
            db.all(
                `SELECT resource_type, resource_id, access_level, expires_at
                 FROM AccessPermissions 
                 WHERE user_id = ? AND status = 'active' 
                 AND (expires_at IS NULL OR expires_at > datetime('now'))`,
                [userId],
                (err, rows) => {
                    resolve(err ? [] : rows);
                }
            );
        });
    }

    // HIPAA Minimum Necessary Standard check
    checkMinimumNecessary(userId, requestedFields, patientId) {
        return new Promise(async (resolve) => {
            try {
                const user = await this.getUserDetails(userId);
                if (!user) {
                    resolve({ allowed: false, reason: 'User not found' });
                    return;
                }

                // Define minimum necessary fields by role
                const minimumNecessary = {
                    Doctor: ['name', 'medical_history', 'medications', 'allergies', 'vitals'],
                    Insurance: ['name', 'diagnosis', 'treatment_dates', 'billing_codes'],
                    Lawyer: ['name', 'medical_history', 'treatment_dates', 'provider_notes']
                };

                const allowedFields = minimumNecessary[user.role] || [];
                const excessiveFields = requestedFields.filter(field => !allowedFields.includes(field));

                if (excessiveFields.length > 0) {
                    resolve({
                        allowed: false,
                        reason: 'Request exceeds minimum necessary standard',
                        excessiveFields,
                        allowedFields
                    });
                } else {
                    resolve({
                        allowed: true,
                        allowedFields
                    });
                }

            } catch (error) {
                resolve({ allowed: false, reason: 'Error checking minimum necessary', error });
            }
        });
    }
}

module.exports = new AccessControl();
