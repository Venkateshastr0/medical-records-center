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
    public partial class PatientDetailsViewModel : ObservableObject
    {
        private readonly ILogger<PatientDetailsViewModel> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly UserSession? _currentUser;
        private readonly Patient _patient;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusMessage = "Patient details loaded";

        public Patient Patient => _patient;

        public PatientDetailsViewModel(
            ILogger<PatientDetailsViewModel> logger,
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
        private async Task EditPatientAsync()
        {
            try
            {
                _logger.LogInformation("Opening edit patient dialog for: {PatientId}", _patient.Id);
                
                var editPatientWindow = new Views.EditPatientWindow(_patient);
                var editPatientViewModel = new EditPatientViewModel(_logger, _patientRepository, _auditRepository, _currentUser, _patient);
                editPatientWindow.DataContext = editPatientViewModel;
                
                if (editPatientWindow.ShowDialog() == true)
                {
                    StatusMessage = "Patient updated successfully";
                    await LogAuditEvent("VIEW", "Patient", "Success", $"Edited patient: {_patient.FullName}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing patient: {PatientId}", _patient.Id);
                StatusMessage = "Error editing patient";
                
                await LogAuditEvent("VIEW", "Patient", "Error", $"Error editing patient: {ex.Message}");
            }
        }

        [RelayCommand]
        private async Task PrintPatientAsync()
        {
            try
            {
                _logger.LogInformation("Printing patient details: {PatientId}", _patient.Id);
                
                IsLoading = true;
                StatusMessage = "Printing patient details...";

                // TODO: Implement print functionality
                await Task.Delay(1000); // Simulate print operation
                
                StatusMessage = "Patient details printed successfully";
                
                await LogAuditEvent("PRINT", "Patient", "Success", $"Printed patient details: {_patient.FullName}");
                
                _logger.LogInformation("Patient details printed successfully: {PatientId}", _patient.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error printing patient details: {PatientId}", _patient.Id);
                StatusMessage = "Error printing patient details";
                
                await LogAuditEvent("PRINT", "Patient", "Error", $"Error printing patient details: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private void Close()
        {
            try
            {
                _logger.LogInformation("Closing patient details: {PatientId}", _patient.Id);
                
                if (Application.Current.Windows.Count > 0)
                {
                    var detailsWindow = Application.Current.Windows[0];
                    detailsWindow.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error closing patient details: {PatientId}", _patient.Id);
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
