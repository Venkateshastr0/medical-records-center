using System.Threading.Tasks;

namespace MedicalRecordsCenter.Security
{
    public interface IHospitalAuthService
    {
        Task<AuthenticationResult> AuthenticateUser(string username, string password);
        Task<bool> ValidateSession(string token);
        Task<UserSession> GetCurrentSession();
        Task Logout();
    }

    public class AuthenticationResult
    {
        public bool Success { get; set; }
        public string Token { get; set; }
        public string UserRole { get; set; }
        public string ErrorMessage { get; set; }
        public string HospitalId { get; set; }
    }

    public class UserSession
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string UserRole { get; set; }
        public string HospitalId { get; set; }
        public string Token { get; set; }
        public DateTime LoginTime { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
