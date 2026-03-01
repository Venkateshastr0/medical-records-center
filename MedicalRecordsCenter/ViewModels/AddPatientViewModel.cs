using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Repositories;
using MedicalRecordsCenter.Security;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class AddPatientViewModel : ObservableObject
    {
        private readonly ILogger<AddPatientViewModel> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly UserSession? _currentUser;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusMessage = "Ready to add new patient";

        public AddPatientViewModel(
            ILogger<AddPatientViewModel> logger,
            IPatientRepository patientRepository,
            IAuditRepository auditRepository,
            UserSession? currentUser)
        {
            _logger = logger;
            _patientRepository = patientRepository;
            _auditRepository = auditRepository;
            _currentUser = currentUser;
        }

        [RelayCommand]
        private async Task SavePatientAsync(object patientData)
        {
            try
            {
                _logger.LogInformation("Adding new patient");
                
                IsLoading = true;
                StatusMessage = "Adding patient...";

                // TODO: Implement patient creation logic
                await Task.Delay(1000); // Simulate async operation
                
                StatusMessage = "Patient added successfully";
                
                await LogAuditEvent("CREATE", "Patient", "Success", "New patient added");
                
                _logger.LogInformation("Patient added successfully");
                
                // Close window with success
                if (Application.Current.Windows.Count > 0)
                {
                    var addPatientWindow = Application.Current.Windows[0];
                    addPatientWindow.DialogResult = true;
                    addPatientWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding patient");
                StatusMessage = "Error adding patient";
                
                await LogAuditEvent("CREATE", "Patient", "Error", $"Error adding patient: {ex.Message}");
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
                _logger.LogInformation("Cancel patient addition");
                
                if (Application.Current.Windows.Count > 0)
                {
                    var addPatientWindow = Application.Current.Windows[0];
                    addPatientWindow.DialogResult = false;
                    addPatientWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling patient addition");
            }
        }

        private async Task LogAuditEvent(string action, string entityType, string status, string description)
        {
            try
            {
                var auditLog = new Data.Models.AuditLog
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
