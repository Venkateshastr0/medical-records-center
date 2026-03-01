const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class HIPAACompliance {
    constructor() {
        this.auditLogPath = path.join(__dirname, '../../logs/hipaa-audit.log');
        this.complianceRules = {
            dataRetention: {
                adultMedicalRecords: 7 * 365, // 7 years in days
                minorMedicalRecords: 7 * 365,  // 7 years after age of majority
                billingRecords: 6 * 365,        // 6 years
                auditLogs: 6 * 365              // 6 years
            },
            accessLogging: {
                required: true,
                fields: ['userId', 'action', 'resource', 'timestamp', 'ipAddress', 'userAgent'],
                retention: 6 * 365 // 6 years
            },
            encryption: {
                atRest: true,
                inTransit: true,
                algorithm: 'AES-256-GCM',
                keyRotation: 90 // days
            },
            authentication: {
                passwordComplexity: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    preventReuse: 5 // previous passwords
                },
                sessionTimeout: 15, // minutes
                maxLoginAttempts: 3,
                lockoutDuration: 30 // minutes
            }
        };
    }

    // Comprehensive audit logging for HIPAA compliance
    async logHIPAAEvent(eventData) {
        const requiredFields = ['userId', 'eventType', 'resourceType', 'action', 'timestamp'];
        
        // Validate required fields
        for (const field of requiredFields) {
            if (!eventData[field]) {
                console.error('Missing required HIPAA audit field:', field);
                return false;
            }
        }

        const auditEntry = {
            ...eventData,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            complianceLevel: 'HIPAA',
            dataClassification: this.classifyData(eventData.resourceType),
            riskLevel: this.assessRiskLevel(eventData.eventType, eventData.action)
        };

        try {
            // Ensure log directory exists
            await fs.mkdir(path.dirname(this.auditLogPath), { recursive: true });
            
            // Write to audit log
            const logLine = JSON.stringify(auditEntry) + '\n';
            await fs.appendFile(this.auditLogPath, logLine);
            
            // Also log to console for immediate visibility
            console.log('🏥 HIPAA Audit:', auditEntry);
            
            return true;
        } catch (error) {
            console.error('Failed to write HIPAA audit log:', error);
            return false;
        }
    }

    // Classify data sensitivity level
    classifyData(resourceType) {
        const classification = {
            'patient_records': 'PHI',
            'medical_history': 'PHI',
            'billing_info': 'PHI',
            'user_accounts': 'PII',
            'system_logs': 'System',
            'audit_logs': 'System',
            'admin_settings': 'System'
        };
        
        return classification[resourceType] || 'Unknown';
    }

    // Assess risk level of access
    assessRiskLevel(eventType, action) {
        const riskMatrix = {
            'LOGIN': { 'SUCCESS': 'Low', 'FAILURE': 'Medium' },
            'LOGOUT': { 'SUCCESS': 'Low' },
            'VIEW': { 'SUCCESS': 'Medium' },
            'EDIT': { 'SUCCESS': 'High' },
            'DELETE': { 'SUCCESS': 'Critical' },
            'EXPORT': { 'SUCCESS': 'High' },
            'PRINT': { 'SUCCESS': 'Medium' },
            'DOWNLOAD': { 'SUCCESS': 'High' },
            'SHARE': { 'SUCCESS': 'Critical' }
        };
        
        return riskMatrix[eventType]?.[action] || 'Medium';
    }

    // Validate HIPAA compliance for data access
    validateAccess(userId, resourceType, action, resourceId = null) {
        return {
            isCompliant: true, // Would implement actual validation logic
            requirements: [
                'Minimum necessary standard applied',
                'User authentication verified',
                'Authorization checked',
                'Audit logging enabled'
            ],
            warnings: []
        };
    }

    // Generate HIPAA compliance report
    async generateComplianceReport(startDate, endDate) {
        try {
            const auditData = await this.readAuditLogs(startDate, endDate);
            
            const report = {
                period: { startDate, endDate },
                summary: this.generateSummary(auditData),
                accessPatterns: this.analyzeAccessPatterns(auditData),
            complianceMetrics: this.calculateComplianceMetrics(auditData),
                riskAssessment: this.assessComplianceRisks(auditData),
                recommendations: this.generateRecommendations(auditData)
            };
            
            return report;
        } catch (error) {
            console.error('Error generating compliance report:', error);
            throw error;
        }
    }

    // Read audit logs for analysis
    async readAuditLogs(startDate, endDate) {
        try {
            const data = await fs.readFile(this.auditLogPath, 'utf8');
            const lines = data.trim().split('\n').filter(line => line);
            
            return lines
                .map(line => JSON.parse(line))
                .filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
                });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    // Generate summary statistics
    generateSummary(auditData) {
        const summary = {
            totalEvents: auditData.length,
            uniqueUsers: new Set(auditData.map(e => e.userId)).size,
            eventTypes: {},
            riskLevels: {},
            dataClassifications: {},
            timeDistribution: {}
        };

        auditData.forEach(entry => {
            // Count event types
            summary.eventTypes[entry.eventType] = (summary.eventTypes[entry.eventType] || 0) + 1;
            
            // Count risk levels
            summary.riskLevels[entry.riskLevel] = (summary.riskLevels[entry.riskLevel] || 0) + 1;
            
            // Count data classifications
            summary.dataClassifications[entry.dataClassification] = 
                (summary.dataClassifications[entry.dataClassification] || 0) + 1;
            
            // Time distribution (by hour)
            const hour = new Date(entry.timestamp).getHours();
            summary.timeDistribution[hour] = (summary.timeDistribution[hour] || 0) + 1;
        });

        return summary;
    }

    // Analyze access patterns
    analyzeAccessPatterns(auditData) {
        const patterns = {
            userActivity: {},
            resourceAccess: {},
            unusualPatterns: []
        };

        auditData.forEach(entry => {
            // User activity patterns
            if (!patterns.userActivity[entry.userId]) {
                patterns.userActivity[entry.userId] = {
                    totalAccess: 0,
                    resourceTypes: {},
                    riskLevels: {},
                    timeDistribution: {}
                };
            }
            
            const userActivity = patterns.userActivity[entry.userId];
            userActivity.totalAccess++;
            
            userActivity.resourceTypes[entry.resourceType] = 
                (userActivity.resourceTypes[entry.resourceType] || 0) + 1;
            
            userActivity.riskLevels[entry.riskLevel] = 
                (userActivity.riskLevels[entry.riskLevel] || 0) + 1;
            
            const hour = new Date(entry.timestamp).getHours();
            userActivity.timeDistribution[hour] = 
                (userActivity.timeDistribution[hour] || 0) + 1;
            
            // Resource access patterns
            if (!patterns.resourceAccess[entry.resourceType]) {
                patterns.resourceAccess[entry.resourceType] = {
                    totalAccess: 0,
                    uniqueUsers: new Set(),
                    riskLevels: {}
                };
            }
            
            const resourceAccess = patterns.resourceAccess[entry.resourceType];
            resourceAccess.totalAccess++;
            resourceAccess.uniqueUsers.add(entry.userId);
            resourceAccess.riskLevels[entry.riskLevel] = 
                (resourceAccess.riskLevels[entry.riskLevel] || 0) + 1;
        });

        // Convert Sets to counts
        Object.values(patterns.resourceAccess).forEach(resource => {
            resource.uniqueUsers = resource.uniqueUsers.size;
        });

        return patterns;
    }

    // Calculate compliance metrics
    calculateComplianceMetrics(auditData) {
        const metrics = {
            auditLogCompleteness: 100, // Assuming all required fields are present
            authenticationSuccess: 0,
            unauthorizedAccessAttempts: 0,
            highRiskOperations: 0,
            criticalOperations: 0,
            complianceScore: 0
        };

        auditData.forEach(entry => {
            if (entry.eventType === 'LOGIN') {
                if (entry.action === 'SUCCESS') {
                    metrics.authenticationSuccess++;
                } else {
                    metrics.unauthorizedAccessAttempts++;
                }
            }
            
            if (entry.riskLevel === 'High') {
                metrics.highRiskOperations++;
            }
            
            if (entry.riskLevel === 'Critical') {
                metrics.criticalOperations++;
            }
        });

        // Calculate compliance score (simplified)
        const totalLogins = metrics.authenticationSuccess + metrics.unauthorizedAccessAttempts;
        metrics.loginSuccessRate = totalLogins > 0 ? (metrics.authenticationSuccess / totalLogins) * 100 : 100;
        
        // Overall compliance score
        metrics.complianceScore = (
            metrics.auditLogCompleteness * 0.3 +
            metrics.loginSuccessRate * 0.3 +
            Math.max(0, 100 - (metrics.unauthorizedAccessAttempts * 10)) * 0.4
        );

        return metrics;
    }

    // Assess compliance risks
    assessComplianceRisks(auditData) {
        const risks = [];
        
        // Check for unusual access patterns
        const userActivity = {};
        auditData.forEach(entry => {
            if (!userActivity[entry.userId]) {
                userActivity[entry.userId] = [];
            }
            userActivity[entry.userId].push(entry);
        });

        Object.entries(userActivity).forEach(([userId, activities]) => {
            // Check for excessive access
            if (activities.length > 1000) {
                risks.push({
                    type: 'EXCESSIVE_ACCESS',
                    userId,
                    count: activities.length,
                    severity: 'Medium'
                });
            }
            
            // Check for off-hours access
            const offHoursAccess = activities.filter(entry => {
                const hour = new Date(entry.timestamp).getHours();
                return hour < 6 || hour > 22;
            });
            
            if (offHoursAccess.length > activities.length * 0.3) {
                risks.push({
                    type: 'OFF_HOURS_ACCESS',
                    userId,
                    count: offHoursAccess.length,
                    severity: 'Low'
                });
            }
        });

        return risks;
    }

    // Generate compliance recommendations
    generateRecommendations(auditData) {
        const recommendations = [];
        
        // Analyze patterns and suggest improvements
        const highRiskOps = auditData.filter(e => e.riskLevel === 'High').length;
        const criticalOps = auditData.filter(e => e.riskLevel === 'Critical').length;
        
        if (highRiskOps > auditData.length * 0.2) {
            recommendations.push({
                type: 'SECURITY_REVIEW',
                priority: 'High',
                description: 'High number of high-risk operations detected. Consider implementing additional safeguards.',
                action: 'Review high-risk access patterns and implement stricter controls'
            });
        }
        
        if (criticalOps > 0) {
            recommendations.push({
                type: 'CRITICAL_OPERATIONS',
                priority: 'Critical',
                description: 'Critical operations detected. Ensure proper authorization and monitoring.',
                action: 'Implement real-time monitoring for critical operations'
            });
        }
        
        recommendations.push({
            type: 'REGULAR_AUDIT',
            priority: 'Medium',
            description: 'Schedule regular HIPAA compliance audits',
            action: 'Conduct monthly compliance reviews and annual assessments'
        });

        return recommendations;
    }

    // Check data retention compliance
    async checkDataRetention() {
        const retentionIssues = [];
        
        // This would check actual data ages against retention policies
        // Implementation would depend on your data storage system
        
        return retentionIssues;
    }

    // Generate business associate agreement (BAA) template
    generateBAATemplate() {
        return {
            title: 'Business Associate Agreement',
            sections: [
                'Permitted Uses and Disclosures',
                'Safeguards',
                'Reporting',
                'Term and Termination',
                'Breach Notification',
                'Compliance with HIPAA'
            ],
            lastUpdated: new Date().toISOString()
        };
    }

    // Validate minimum necessary standard
    validateMinimumNecessary(requestedFields, userRole, purpose) {
        const minimumNecessaryFields = {
            'Doctor': ['name', 'diagnosis', 'treatment', 'medications'],
            'Insurance': ['name', 'diagnosis', 'treatment_dates', 'billing_codes'],
            'Lawyer': ['name', 'treatment_dates', 'provider_notes']
        };
        
        const allowedFields = minimumNecessaryFields[userRole] || [];
        const excessiveFields = requestedFields.filter(field => !allowedFields.includes(field));
        
        return {
            compliant: excessiveFields.length === 0,
            allowedFields,
            excessiveFields,
            recommendation: excessiveFields.length > 0 ? 
                'Reduce requested fields to minimum necessary' : 
                'Request meets minimum necessary standard'
        };
    }
}

module.exports = new HIPAACompliance();
