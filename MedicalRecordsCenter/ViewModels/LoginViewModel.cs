using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Repositories;
using MedicalRecordsCenter.Security;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class LoginViewModel : ObservableObject
    {
        private readonly ILogger<LoginViewModel> _logger;
        private readonly IHospitalAuthService _authService;
        private readonly IUserRepository _userRepository;
        private readonly IAuditRepository _auditRepository;

        [ObservableProperty]
        private string _username = string.Empty;

        [ObservableProperty]
        private string _password = string.Empty;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _errorMessage = string.Empty;

        [ObservableProperty]
        private bool _rememberMe;

        [ObservableProperty]
        private string _statusMessage = "Please enter your credentials";

        public LoginViewModel(
            ILogger<LoginViewModel> logger,
            IHospitalAuthService authService,
            IUserRepository userRepository,
            IAuditRepository auditRepository)
        {
            _logger = logger;
            _authService = authService;
            _userRepository = userRepository;
            _auditRepository = auditRepository;

            // Load saved credentials if available
            _ = LoadSavedCredentialsAsync();
        }

        [RelayCommand]
        private async Task LoginAsync()
        {
            try
            {
                _logger.LogInformation("Login attempt for user: {Username}", Username);
                
                // Validate input
                if (string.IsNullOrWhiteSpace(Username))
                {
                    ErrorMessage = "Username is required";
                    return;
                }

                if (string.IsNullOrWhiteSpace(Password))
                {
                    ErrorMessage = "Password is required";
                    return;
                }

                IsLoading = true;
                ErrorMessage = string.Empty;
                StatusMessage = "Authenticating...";

                // Authenticate user
                var authResult = await _authService.AuthenticateUser(Username, Password);
                
                if (authResult.Success)
                {
                    _logger.LogInformation("User authenticated successfully: {Username}", Username);
                    
                    // Update last login
                    var user = await _userRepository.GetUserByUsernameAsync(Username);
                    if (user != null)
                    {
                        await _userRepository.UpdateLastLoginAsync(user.Id);
                    }

                    // Log successful login
                    await LogAuditEvent("LOGIN", "User", authResult.HospitalId, "Success", "User logged in successfully");

                    // Save credentials if remember me is checked
                    if (RememberMe)
                    {
                        await SaveCredentialsAsync();
                    }

                    // Close login window
                    if (Application.Current.Windows.Count > 0)
                    {
                        var loginWindow = Application.Current.Windows[0];
                        loginWindow.DialogResult = true;
                        loginWindow.Close();
                    }
                }
                else
                {
                    _logger.LogWarning("Login failed for user: {Username} - {Error}", Username, authResult.ErrorMessage);
                    ErrorMessage = authResult.ErrorMessage ?? "Authentication failed";
                    StatusMessage = "Login failed";
                    
                    // Log failed login
                    await LogAuditEvent("LOGIN", "User", "UNKNOWN", "Failed", $"Login failed: {authResult.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for user: {Username}", Username);
                ErrorMessage = "An error occurred during login";
                StatusMessage = "Login error";
                
                // Log error
                await LogAuditEvent("LOGIN", "User", "UNKNOWN", "Error", $"Login error: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private void Cancel()
        {
            try
            {
                _logger.LogInformation("Login cancelled by user");
                
                if (Application.Current.Windows.Count > 0)
                {
                    var loginWindow = Application.Current.Windows[0];
                    loginWindow.DialogResult = false;
                    loginWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling login");
            }
        }

        [RelayCommand]
        private async Task ForgotPassword()
        {
            try
            {
                _logger.LogInformation("Forgot password requested for user: {Username}", Username);
                
                if (string.IsNullOrWhiteSpace(Username))
                {
                    ErrorMessage = "Please enter your username first";
                    return;
                }

                StatusMessage = "Password reset functionality not yet implemented";
                
                // TODO: Implement password reset functionality
                await LogAuditEvent("PASSWORD_RESET_REQUEST", "User", "UNKNOWN", "Info", $"Password reset requested for {Username}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in forgot password");
                ErrorMessage = "Error processing password reset request";
            }
        }

        private async Task LoadSavedCredentialsAsync()
        {
            try
            {
                // TODO: Implement secure credential storage
                // For now, we'll skip this functionality
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading saved credentials");
            }
        }

        private async Task SaveCredentialsAsync()
        {
            try
            {
                // TODO: Implement secure credential storage
                // For now, we'll skip this functionality
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving credentials");
            }
        }

        private async Task LogAuditEvent(string action, string entityType, string hospitalId, string status, string description)
        {
            try
            {
                var auditLog = new Data.Models.AuditLog
                {
                    UserId = Username, // Will be updated after authentication
                    UserName = Username,
                    Action = action,
                    EntityType = entityType,
                    HospitalId = hospitalId,
                    Status = status,
                    Description = description,
                    IpAddress = GetLocalIpAddress(),
                    UserAgent = "WPF Application",
                    Severity = status == "Failed" ? "Warning" : "Info"
                };

                await _auditRepository.CreateAuditLogAsync(auditLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging audit event: {Action}", action);
            }
        }

        private string GetLocalIpAddress()
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
                return "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        partial void OnUsernameChanged(string value)
        {
            if (!string.IsNullOrWhiteSpace(ErrorMessage))
            {
                ErrorMessage = string.Empty;
            }
        }

        partial void OnPasswordChanged(string value)
        {
            if (!string.IsNullOrWhiteSpace(ErrorMessage))
            {
                ErrorMessage = string.Empty;
            }
        }
    }
}
