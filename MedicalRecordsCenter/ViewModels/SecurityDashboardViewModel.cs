using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;
using MedicalRecordsCenter.Data.Repositories;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class SecurityDashboardViewModel : ObservableObject
    {
        private readonly ILogger<SecurityDashboardViewModel> _logger;
        private readonly IUserRepository _userRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly UserSession? _currentUser;

        [ObservableProperty]
        private ObservableCollection<AuditLog> _recentAuditLogs = new();

        [ObservableProperty]
        private ObservableCollection<User> _activeUsers = new();

        [ObservableProperty]
        private ObservableCollection<AuditLog> _failedLogins = new();

        [ObservableProperty]
        private ObservableCollection<AuditLog> _criticalEvents = new();

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusMessage = "Loading security dashboard...";

        [ObservableProperty]
        private int _totalUsers;

        [ObservableProperty]
        private int _activeUsersCount;

        [ObservableProperty]
        private int _failedLoginsCount;

        [ObservableProperty]
        private int _criticalEventsCount;

        [ObservableProperty]
        private int _totalAuditLogs;

        [ObservableProperty]
        private DateTime _lastRefresh = DateTime.Now;

        public SecurityDashboardViewModel(
            ILogger<SecurityDashboardViewModel> logger,
            IUserRepository userRepository,
            IAuditRepository auditRepository,
            UserSession? currentUser)
        {
            _logger = logger;
            _userRepository = userRepository;
            _auditRepository = auditRepository;
            _currentUser = currentUser;

            _ = LoadSecurityDataAsync();
        }

        private async Task LoadSecurityDataAsync()
        {
            try
            {
                _logger.LogInformation("Loading security dashboard for hospital: {HospitalId}", _currentUser?.HospitalId);
                
                IsLoading = true;
                StatusMessage = "Loading security dashboard...";

                // Load all security data in parallel
                var tasks = new[]
                {
                    LoadUsersAsync(),
                    LoadRecentAuditLogsAsync(),
                    LoadFailedLoginsAsync(),
                    LoadCriticalEventsAsync(),
                    LoadStatisticsAsync()
                };

                await Task.WhenAll(tasks);

                LastRefresh = DateTime.Now;
                StatusMessage = "Security dashboard loaded";
                
                await LogAuditEvent("VIEW", "SecurityDashboard", "Success", "Viewed security dashboard");
                
                _logger.LogInformation("Security dashboard loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading security dashboard");
                StatusMessage = "Error loading security dashboard";
                MessageBox.Show($"Error loading security dashboard: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("VIEW", "SecurityDashboard", "Error", $"Error loading security dashboard: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        private async Task LoadUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                ActiveUsers.Clear();
                foreach (var user in users.Where(u => u.IsActive))
                {
                    ActiveUsers.Add(user);
                }

                TotalUsers = users.Count();
                ActiveUsersCount = ActiveUsers.Count;
                
                _logger.LogInformation("Loaded {Count} active users", ActiveUsers.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading users");
                throw;
            }
        }

        private async Task LoadRecentAuditLogsAsync()
        {
            try
            {
                var auditLogs = await _auditRepository.GetRecentAuditLogsAsync(_currentUser?.HospitalId ?? "DEFAULT", 50);
                
                RecentAuditLogs.Clear();
                foreach (var log in auditLogs.Take(20))
                {
                    RecentAuditLogs.Add(log);
                }
                
                _logger.LogInformation("Loaded {Count} recent audit logs", RecentAuditLogs.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading recent audit logs");
                throw;
            }
        }

        private async Task LoadFailedLoginsAsync()
        {
            try
            {
                var failedLogins = await _auditRepository.GetFailedAuditLogsAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                FailedLogins.Clear();
                foreach (var login in failedLogins.Take(10))
                {
                    FailedLogins.Add(login);
                }

                FailedLoginsCount = failedLogins.Count();
                
                _logger.LogInformation("Loaded {Count} failed logins", FailedLogins.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading failed logins");
                throw;
            }
        }

        private async Task LoadCriticalEventsAsync()
        {
            try
            {
                var criticalEvents = await _auditRepository.GetCriticalAuditLogsAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                CriticalEvents.Clear();
                foreach (var criticalEvent in criticalEvents.Take(10))
                {
                    CriticalEvents.Add(criticalEvent);
                }

                CriticalEventsCount = criticalEvents.Count();
                
                _logger.LogInformation("Loaded {Count} critical events", CriticalEvents.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading critical events");
                throw;
            }
        }

        private async Task LoadStatisticsAsync()
        {
            try
            {
                TotalAuditLogs = await _auditRepository.GetAuditLogCountAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                _logger.LogInformation("Loaded statistics: {TotalAuditLogs} audit logs", TotalAuditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading statistics");
                throw;
            }
        }

        [RelayCommand]
        private async Task RefreshDashboard()
        {
            try
            {
                _logger.LogInformation("Refreshing security dashboard");
                await LoadSecurityDataAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing dashboard");
            }
        }

        [RelayCommand]
        private async Task ViewUserDetails()
        {
            try
            {
                // TODO: Implement user details view
                MessageBox.Show("User details view not yet implemented", "Information", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error viewing user details");
            }
        }

        [RelayCommand]
        private async Task ViewAuditLogDetails()
        {
            try
            {
                // TODO: Implement audit log details view
                MessageBox.Show("Audit log details view not yet implemented", "Information", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error viewing audit log details");
            }
        }

        [RelayCommand]
        private async Task ExportSecurityReport()
        {
            try
            {
                _logger.LogInformation("Exporting security report");
                
                var saveFileDialog = new Microsoft.Win32.SaveFileDialog
                {
                    Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*",
                    FileName = $"Security_Report_{DateTime.Now:yyyyMMdd_HHmmss}.csv"
                };

                if (saveFileDialog.ShowDialog() == true)
                {
                    await GenerateSecurityReportAsync(saveFileDialog.FileName);
                    MessageBox.Show("Security report exported successfully", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                    
                    await LogAuditEvent("EXPORT", "SecurityReport", "Success", $"Exported security report to {saveFileDialog.FileName}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting security report");
                MessageBox.Show($"Error exporting security report: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("EXPORT", "SecurityReport", "Error", $"Error exporting security report: {ex.Message}");
            }
        }

        [RelayCommand]
        private async Task CleanupOldAuditLogs()
        {
            try
            {
                var result = MessageBox.Show(
                    "This will permanently delete audit logs older than 1 year. Are you sure?",
                    "Confirm Cleanup",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Question);

                if (result == MessageBoxResult.Yes)
                {
                    _logger.LogInformation("Starting audit log cleanup");
                    
                    var cutoffDate = DateTime.Now.AddYears(-1);
                    var success = await _auditRepository.CleanupOldAuditLogsAsync(_currentUser?.HospitalId ?? "DEFAULT", cutoffDate);
                    
                    if (success)
                    {
                        MessageBox.Show("Old audit logs cleaned up successfully", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                        await RefreshDashboard();
                        
                        await LogAuditEvent("CLEANUP", "AuditLogs", "Success", $"Cleaned up audit logs older than {cutoffDate:yyyy-MM-dd}");
                    }
                    else
                    {
                        MessageBox.Show("Failed to cleanup old audit logs", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old audit logs");
                MessageBox.Show($"Error cleaning up old audit logs: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("CLEANUP", "AuditLogs", "Error", $"Error cleaning up old audit logs: {ex.Message}");
            }
        }

        private async Task GenerateSecurityReportAsync(string filePath)
        {
            try
            {
                var auditLogs = await _auditRepository.GetAllAuditLogsAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                using (var writer = new System.IO.StreamWriter(filePath))
                {
                    // Write CSV header
                    await writer.WriteLineAsync("Timestamp,User,Action,Entity Type,Status,Severity,Description");
                    
                    // Write audit log data
                    foreach (var log in auditLogs)
                    {
                        await writer.WriteLineAsync($"{log.Timestamp:yyyy-MM-dd HH:mm:ss},{log.UserName},{log.Action},{log.EntityType},{log.Status},{log.Severity},\"{log.Description}\"");
                    }
                }
                
                _logger.LogInformation("Security report generated: {FilePath}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating security report");
                throw;
            }
        }

        private async Task LogAuditEvent(string action, string entityType, string status, string description)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = _currentUser?.UserId ?? "UNKNOWN",
                    UserName = _currentUser?.Username ?? "UNKNOWN",
                    Action = action,
                    EntityType = entityType,
                    HospitalId = _currentUser?.HospitalId ?? "DEFAULT",
                    Status = status,
                    Description = description,
                    IpAddress = GetLocalIpAddress(),
                    UserAgent = "WPF Application",
                    Severity = status == "Error" ? "Error" : "Info"
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
    }
}
