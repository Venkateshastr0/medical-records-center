using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;
using MedicalRecordsCenter.Data.Repositories;
using MedicalRecordsCenter.Security;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class EditPatientViewModel : ObservableObject
    {
        private readonly ILogger<EditPatientViewModel> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly UserSession? _currentUser;
        private readonly Patient _patient;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusMessage = "Ready to edit patient";

        public EditPatientViewModel(
            ILogger<EditPatientViewModel> logger,
            IPatientRepository patientRepository,
            IAuditRepository auditRepository,
            UserSession? currentUser,
            Patient patient)
        {
            _logger = logger;
            _patientRepository = patientRepository;
            _auditRepository = auditRepository;
            _currentUser = currentUser;
            _patient = patient;
        }

        [RelayCommand]
        private async Task UpdatePatientAsync(object patientData)
        {
            try
            {
                _logger.LogInformation("Updating patient: {PatientId}", _patient.Id);
                
                IsLoading = true;
                StatusMessage = "Updating patient...";

                // TODO: Implement patient update logic
                await Task.Delay(1000); // Simulate async operation
                
                StatusMessage = "Patient updated successfully";
                
                await LogAuditEvent("UPDATE", "Patient", "Success", $"Updated patient: {_patient.FullName}");
                
                _logger.LogInformation("Patient updated successfully: {PatientId}", _patient.Id);
                
                // Close window with success
                if (Application.Current.Windows.Count > 0)
                {
                    var editPatientWindow = Application.Current.Windows[0];
                    editPatientWindow.DialogResult = true;
                    editPatientWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient: {PatientId}", _patient.Id);
                StatusMessage = "Error updating patient";
                
                await LogAuditEvent("UPDATE", "Patient", "Error", $"Error updating patient: {ex.Message}");
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
                _logger.LogInformation("Cancel patient edit: {PatientId}", _patient.Id);
                
                if (Application.Current.Windows.Count > 0)
                {
                    var editPatientWindow = Application.Current.Windows[0];
                    editPatientWindow.DialogResult = false;
                    editPatientWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling patient edit: {PatientId}", _patient.Id);
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
