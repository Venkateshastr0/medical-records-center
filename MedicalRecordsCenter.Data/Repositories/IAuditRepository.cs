using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public interface IAuditRepository
    {
        Task<IEnumerable<AuditLog>> GetAllAuditLogsAsync(string hospitalId);
        Task<IEnumerable<AuditLog>> GetAuditLogsByUserAsync(string userId, string hospitalId);
        Task<IEnumerable<AuditLog>> GetAuditLogsByActionAsync(string action, string hospitalId);
        Task<IEnumerable<AuditLog>> GetAuditLogsByEntityTypeAsync(string entityType, string hospitalId);
        Task<IEnumerable<AuditLog>> GetAuditLogsByDateRangeAsync(DateTime startDate, DateTime endDate, string hospitalId);
        Task<IEnumerable<AuditLog>> GetAuditLogsBySeverityAsync(string severity, string hospitalId);
        Task<AuditLog> CreateAuditLogAsync(AuditLog auditLog);
        Task<IEnumerable<AuditLog>> GetRecentAuditLogsAsync(string hospitalId, int count = 100);
        Task<IEnumerable<AuditLog>> GetFailedAuditLogsAsync(string hospitalId);
        Task<IEnumerable<AuditLog>> GetCriticalAuditLogsAsync(string hospitalId);
        Task<int> GetAuditLogCountAsync(string hospitalId);
        Task<bool> CleanupOldAuditLogsAsync(string hospitalId, DateTime cutoffDate);
        Task<bool> ValidateAuditLogDataAsync(AuditLog auditLog);
    }
}
