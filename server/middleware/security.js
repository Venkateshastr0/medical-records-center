const fieldEncryption = require('../utils/field-encryption');
const accessControl = require('../utils/access-control');
const { logAudit } = require('../utils/audit');

class SecurityMiddleware {
    // Rate limiting
    static rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
        const requests = new Map();
        
        return (req, res, next) => {
            const clientId = req.ip || req.socket.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Clean old requests
            if (requests.has(clientId)) {
                requests.set(clientId, requests.get(clientId).filter(time => time > windowStart));
            } else {
                requests.set(clientId, []);
            }
            
            const clientRequests = requests.get(clientId);
            
            if (clientRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
            
            clientRequests.push(now);
            next();
        };
    }

    // Authentication middleware
    static authenticate(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const decoded = fieldEncryption.verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        req.user = decoded;
        next();
    }

    // Role-based access control middleware
    static authorize(requiredRole) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            if (req.user.role !== requiredRole && !accessControl.hasPermission(req.user.role, `admin_access`)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }
            
            next();
        };
    }

    // Permission-based access control
    static requirePermission(permission) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const hasPermission = accessControl.hasPermission(req.user.role, permission);
            
            if (!hasPermission) {
                // Log unauthorized access attempt
                fieldEncryption.logSecurityEvent('UNAUTHORIZED_ACCESS', req.user.userId, {
                    attemptedPermission: permission,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
                
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }
            
            next();
        };
    }

    // Data access middleware
    static requireDataAccess(resourceType, resourceId) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            try {
                const accessCheck = await accessControl.checkDataAccess(
                    req.user.userId,
                    resourceId,
                    resourceType
                );
                
                // Log access attempt
                accessControl.logAccessAttempt(
                    req.user.userId,
                    resourceType,
                    resourceId,
                    'view',
                    accessCheck.allowed ? 'allowed' : 'denied',
                    accessCheck.reason
                );
                
                if (!accessCheck.allowed) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied',
                        reason: accessCheck.reason
                    });
                }
                
                req.accessLevel = accessCheck.level;
                next();
                
            } catch (error) {
                console.error('Error checking data access:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error checking access permissions'
                });
            }
        };
    }

    // Minimum necessary standard middleware
    static requireMinimumNecessary(requestedFields) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const patientId = req.params.patientId || req.body.patientId;
            
            try {
                const necessaryCheck = await accessControl.checkMinimumNecessary(
                    req.user.userId,
                    requestedFields,
                    patientId
                );
                
                if (!necessaryCheck.allowed) {
                    return res.status(403).json({
                        success: false,
                        message: 'Request exceeds minimum necessary standard',
                        excessiveFields: necessaryCheck.excessiveFields,
                        allowedFields: necessaryCheck.allowedFields
                    });
                }
                
                req.allowedFields = necessaryCheck.allowedFields;
                next();
                
            } catch (error) {
                console.error('Error checking minimum necessary:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error checking data access requirements'
                });
            }
        };
    }

    // Field-level encryption middleware
    static encryptSensitiveFields(req, res, next) {
        if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
            try {
                // Encrypt sensitive fields in request body
                if (req.body.patientData) {
                    req.body.patientData = fieldEncryption.encryptPatientData(req.body.patientData);
                }
                
                if (req.body.recordData) {
                    req.body.recordData = fieldEncryption.encryptPatientData(req.body.recordData);
                }
                
                next();
            } catch (error) {
                console.error('Error encrypting fields:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing request'
                });
            }
        } else {
            next();
        }
    }

    // Field-level decryption middleware
    static decryptSensitiveFields(req, res, next) {
        return (req, res, next) => {
            const originalSend = res.send;
            
            res.send = function(data) {
                try {
                    // Decrypt sensitive fields in response data
                    if (typeof data === 'object' && data.success && data.data) {
                        if (data.data.patientData) {
                            data.data.patientData = fieldEncryption.decryptPatientData(data.data.patientData);
                        }
                        
                        if (data.data.recordData) {
                            data.data.recordData = fieldEncryption.decryptPatientData(data.data.recordData);
                        }
                        
                        if (Array.isArray(data.data.patients)) {
                            data.data.patients = data.data.patients.map(patient => 
                                fieldEncryption.decryptPatientData(patient)
                            );
                        }
                        
                        if (Array.isArray(data.data.records)) {
                            data.data.records = data.data.records.map(record => 
                                fieldEncryption.decryptPatientData(record)
                            );
                        }
                    }
                } catch (error) {
                    console.error('Error decrypting fields:', error);
                }
                
                originalSend.call(this, data);
            };
            
            next();
        };
    }

    // Audit logging middleware
    static auditLog(action) {
        return (req, res, next) => {
            const originalSend = res.send;
            
            res.send = function(data) {
                // Log the action after response is sent
                setImmediate(() => {
                    if (req.user) {
                        logAudit(req.user.userId, action, req.params.id || null, JSON.stringify({
                            method: req.method,
                            url: req.url,
                            statusCode: res.statusCode,
                            success: data?.success || false
                        }));
                    }
                });
                
                originalSend.call(this, data);
            };
            
            next();
        };
    }

    // Session security middleware
    static sessionSecurity(req, res, next) {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        next();
    }

    // Input validation middleware
    static validateInput(schema) {
        return (req, res, next) => {
            try {
                const { error, value } = schema.validate(req.body);
                
                if (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation error',
                        details: error.details.map(detail => detail.message)
                    });
                }
                
                req.validatedBody = value;
                next();
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Validation error'
                });
            }
        };
    }

    // CORS middleware
    static cors(options = {}) {
        const defaultOptions = {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        };
        
        const corsOptions = { ...defaultOptions, ...options };
        
        return (req, res, next) => {
            const origin = req.headers.origin;
            
            if (corsOptions.origin.includes('*') || corsOptions.origin.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin || '*');
            }
            
            res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
            res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
            res.setHeader('Access-Control-Allow-Credentials', corsOptions.credentials);
            
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            
            next();
        };
    }
}

module.exports = SecurityMiddleware;
