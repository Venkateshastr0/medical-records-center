using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public class AuditRepository : IAuditRepository
    {
        private readonly MedicalRecordsDbContext _context;
        private readonly ILogger<AuditRepository> _logger;

        public AuditRepository(MedicalRecordsDbContext context, ILogger<AuditRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<AuditLog>> GetAllAuditLogsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting all audit logs for hospital: {HospitalId}", hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId)
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for hospital: {HospitalId}", auditLogs.Count, hospitalId);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all audit logs for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByUserAsync(string userId, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit logs for user: {UserId} in hospital: {HospitalId}", userId, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && a.UserId == userId)
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for user: {UserId}", auditLogs.Count, userId);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs for user: {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByActionAsync(string action, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit logs for action: {Action} in hospital: {HospitalId}", action, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && a.Action.Equals(action, StringComparison.OrdinalIgnoreCase))
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for action: {Action}", auditLogs.Count, action);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs for action: {Action}", action);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByEntityTypeAsync(string entityType, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit logs for entity type: {EntityType} in hospital: {HospitalId}", entityType, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && a.EntityType.Equals(entityType, StringComparison.OrdinalIgnoreCase))
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for entity type: {EntityType}", auditLogs.Count, entityType);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs for entity type: {EntityType}", entityType);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByDateRangeAsync(DateTime startDate, DateTime endDate, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit logs for date range: {StartDate} to {EndDate} in hospital: {HospitalId}", 
                    startDate, endDate, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId &&
                               a.Timestamp >= startDate &&
                               a.Timestamp <= endDate)
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for date range", auditLogs.Count);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs for date range");
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsBySeverityAsync(string severity, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit logs for severity: {Severity} in hospital: {HospitalId}", severity, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && a.Severity.Equals(severity, StringComparison.OrdinalIgnoreCase))
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} audit logs for severity: {Severity}", auditLogs.Count, severity);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit logs for severity: {Severity}", severity);
                throw;
            }
        }

        public async Task<AuditLog> CreateAuditLogAsync(AuditLog auditLog)
        {
            try
            {
                _logger.LogInformation("Creating audit log: {Action} - {EntityType}", auditLog.Action, auditLog.EntityType);
                
                auditLog.Id = Guid.NewGuid().ToString();
                auditLog.Timestamp = DateTime.UtcNow;
                
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created audit log successfully: {AuditLogId}", auditLog.Id);
                return auditLog;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit log: {Action} - {EntityType}", auditLog.Action, auditLog.EntityType);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetRecentAuditLogsAsync(string hospitalId, int count = 100)
        {
            try
            {
                _logger.LogInformation("Getting {Count} recent audit logs for hospital: {HospitalId}", count, hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId)
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .Take(count)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} recent audit logs", auditLogs.Count);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent audit logs for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetFailedAuditLogsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting failed audit logs for hospital: {HospitalId}", hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && 
                               (a.Status.Equals("Failed", StringComparison.OrdinalIgnoreCase) ||
                                a.Status.Equals("Error", StringComparison.OrdinalIgnoreCase)))
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} failed audit logs", auditLogs.Count);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failed audit logs for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<IEnumerable<AuditLog>> GetCriticalAuditLogsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting critical audit logs for hospital: {HospitalId}", hospitalId);
                
                var auditLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && 
                               a.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase))
                    .Include(a => a.User)
                    .OrderByDescending(a => a.Timestamp)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} critical audit logs", auditLogs.Count);
                return auditLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting critical audit logs for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<int> GetAuditLogCountAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting audit log count for hospital: {HospitalId}", hospitalId);
                
                var count = await _context.AuditLogs
                    .CountAsync(a => a.HospitalId == hospitalId);
                
                _logger.LogInformation("Audit log count for hospital {HospitalId}: {Count}", hospitalId, count);
                return count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit log count for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<bool> CleanupOldAuditLogsAsync(string hospitalId, DateTime cutoffDate)
        {
            try
            {
                _logger.LogInformation("Cleaning up audit logs older than {CutoffDate} for hospital: {HospitalId}", cutoffDate, hospitalId);
                
                var oldLogs = await _context.AuditLogs
                    .Where(a => a.HospitalId == hospitalId && a.Timestamp < cutoffDate)
                    .ToListAsync();
                
                if (oldLogs.Any())
                {
                    _context.AuditLogs.RemoveRange(oldLogs);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Cleaned up {Count} old audit logs", oldLogs.Count);
                }
                else
                {
                    _logger.LogInformation("No old audit logs to clean up");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old audit logs for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<bool> ValidateAuditLogDataAsync(AuditLog auditLog)
        {
            try
            {
                _logger.LogInformation("Validating audit log data: {AuditLogId}", auditLog.Id);
                
                var validationErrors = new List<string>();
                
                if (string.IsNullOrWhiteSpace(auditLog.UserId))
                    validationErrors.Add("User ID is required");
                
                if (string.IsNullOrWhiteSpace(auditLog.Action))
                    validationErrors.Add("Action is required");
                
                if (string.IsNullOrWhiteSpace(auditLog.HospitalId))
                    validationErrors.Add("Hospital ID is required");
                
                if (string.IsNullOrWhiteSpace(auditLog.Status))
                    validationErrors.Add("Status is required");
                
                if (string.IsNullOrWhiteSpace(auditLog.Severity))
                    validationErrors.Add("Severity is required");
                
                if (validationErrors.Any())
                {
                    _logger.LogWarning("Audit log validation failed: {Errors}", string.Join(", ", validationErrors));
                    return false;
                }
                
                _logger.LogInformation("Audit log validation passed: {AuditLogId}", auditLog.Id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating audit log data: {AuditLogId}", auditLog.Id);
                throw;
            }
        }
    }
}
