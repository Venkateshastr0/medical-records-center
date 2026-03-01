using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace MedicalRecordsCenter.Security
{
    public class HospitalAuthService : IHospitalAuthService
    {
        private readonly IWindowsSecurityService _windowsSecurity;
        private readonly IConfiguration _configuration;
        private readonly ILogger<HospitalAuthService> _logger;
        private UserSession _currentSession;

        public HospitalAuthService(
            IWindowsSecurityService windowsSecurity,
            IConfiguration configuration,
            ILogger<HospitalAuthService> logger)
        {
            _windowsSecurity = windowsSecurity;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthenticationResult> AuthenticateUser(string username, string password)
        {
            try
            {
                _logger.LogInformation("Authenticating user: {Username}", username);

                // Step 1: Windows Authentication
                bool windowsAuth = await _windowsSecurity.AuthenticateWithActiveDirectory(username, password);
                if (!windowsAuth)
                {
                    return new AuthenticationResult
                    {
                        Success = false,
                        ErrorMessage = "Windows authentication failed"
                    };
                }

                // Step 2: Biometric Authentication (if required)
                bool biometricRequired = _configuration.GetValue<bool>("Security:RequireBiometric", false);
                if (biometricRequired)
                {
                    bool biometricAuth = await _windowsSecurity.RequireBiometric();
                    if (!biometricAuth)
                    {
                        return new AuthenticationResult
                        {
                            Success = false,
                            ErrorMessage = "Biometric authentication required"
                        };
                    }
                }

                // Step 3: Validate Hospital Access
                bool hospitalAccess = await _windowsSecurity.ValidateAccess(username, "MedicalRecords");
                if (!hospitalAccess)
                {
                    return new AuthenticationResult
                    {
                        Success = false,
                        ErrorMessage = "Access to medical records not authorized"
                    };
                }

                // Step 4: Generate JWT Token
                string token = GenerateJwtToken(username);

                // Step 5: Create Session
                _currentSession = new UserSession
                {
                    UserId = username,
                    Username = username,
                    UserRole = GetUserRole(username),
                    HospitalId = GetHospitalId(username),
                    Token = token,
                    LoginTime = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(8) // 8-hour session
                };

                _logger.LogInformation("User {Username} authenticated successfully", username);
                return new AuthenticationResult
                {
                    Success = true,
                    Token = token,
                    UserRole = _currentSession.UserRole,
                    HospitalId = _currentSession.HospitalId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating user: {Username}", username);
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Authentication error occurred"
                };
            }
        }

        public async Task<bool> ValidateSession(string token)
        {
            try
            {
                if (_currentSession == null || _currentSession.Token != token)
                {
                    return false;
                }

                if (DateTime.UtcNow > _currentSession.ExpiresAt)
                {
                    _logger.LogWarning("Session expired for user: {UserId}", _currentSession.UserId);
                    return false;
                }

                // Validate JWT token
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Security:JwtSecret"]);
                
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session token");
                return false;
            }
        }

        public async Task<UserSession> GetCurrentSession()
        {
            return _currentSession;
        }

        public async Task Logout()
        {
            if (_currentSession != null)
            {
                _logger.LogInformation("User {UserId} logged out", _currentSession.UserId);
                _windowsSecurity.LogSecurityEvent("LOGOUT", $"User {_currentSession.UserId} logged out");
                _currentSession = null;
            }
        }

        private string GenerateJwtToken(string username)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Security:JwtSecret"]);
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, username),
                    new Claim(ClaimTypes.Role, GetUserRole(username)),
                    new Claim("hospital_id", GetHospitalId(username))
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GetUserRole(string username)
        {
            // This would typically check against hospital's user management system
            // For demo purposes, return a role based on username
            if (username.Contains("admin")) return "Administrator";
            if (username.Contains("doctor")) return "Doctor";
            if (username.Contains("nurse")) return "Nurse";
            if (username.Contains("reception")) return "Reception";
            return "Staff";
        }

        private string GetHospitalId(string username)
        {
            // This would typically check against hospital's user management system
            // For demo purposes, return a default hospital ID
            return "HOSPITAL-001";
        }
    }
}
