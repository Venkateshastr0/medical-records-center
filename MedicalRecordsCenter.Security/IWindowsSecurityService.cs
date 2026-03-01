using System;
using System.DirectoryServices.AccountManagement;
using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;

namespace MedicalRecordsCenter.Security
{
    public interface IWindowsSecurityService
    {
        Task<bool> AuthenticateWithActiveDirectory(string username, string password);
        Task<bool> AuthenticateWithBiometric();
        Task<bool> ValidateAccess(string userId, string resource);
        Task<bool> RequireBiometric();
        void EnableRealTimeProtection();
        void JoinDomain(string domainName);
        void ApplyGroupPolicy();
        void ConfigureFirewall();
        void LogSecurityEvent(string eventType, string details);
    }
}
