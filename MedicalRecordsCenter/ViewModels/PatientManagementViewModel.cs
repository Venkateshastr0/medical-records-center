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
using MedicalRecordsCenter.Views;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class PatientManagementViewModel : ObservableObject
    {
        private readonly ILogger<PatientManagementViewModel> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly UserSession? _currentUser;

        [ObservableProperty]
        private ObservableCollection<Patient> _patients = new();

        [ObservableProperty]
        private Patient? _selectedPatient;

        [ObservableProperty]
        private string _searchTerm = string.Empty;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusMessage = "Loading patients...";

        [ObservableProperty]
        private int _totalPatients;

        [ObservableProperty]
        private string _filterStatus = "All";

        public ObservableCollection<string> FilterOptions { get; } = new()
        {
            "All",
            "Active",
            "Recent",
            "With Medical Records",
            "With Appointments"
        };

        public PatientManagementViewModel(
            ILogger<PatientManagementViewModel> logger,
            IPatientRepository patientRepository,
            IAuditRepository auditRepository,
            UserSession? currentUser)
        {
            _logger = logger;
            _patientRepository = patientRepository;
            _auditRepository = auditRepository;
            _currentUser = currentUser;

            _ = LoadPatientsAsync();
        }

        private async Task LoadPatientsAsync()
        {
            try
            {
                _logger.LogInformation("Loading patients for hospital: {HospitalId}", _currentUser?.HospitalId);
                
                IsLoading = true;
                StatusMessage = "Loading patients...";

                var patients = await _patientRepository.GetAllPatientsAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                Patients.Clear();
                foreach (var patient in patients)
                {
                    Patients.Add(patient);
                }

                TotalPatients = Patients.Count;
                StatusMessage = $"Loaded {TotalPatients} patients";
                
                await LogAuditEvent("VIEW", "Patient", "Success", $"Viewed patient list ({TotalPatients} patients)");
                
                _logger.LogInformation("Loaded {Count} patients successfully", patients.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading patients");
                StatusMessage = "Error loading patients";
                MessageBox.Show($"Error loading patients: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("VIEW", "Patient", "Error", $"Error loading patients: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task SearchPatients()
        {
            try
            {
                _logger.LogInformation("Searching patients with term: {SearchTerm}", SearchTerm);
                
                if (string.IsNullOrWhiteSpace(SearchTerm))
                {
                    await LoadPatientsAsync();
                    return;
                }

                IsLoading = true;
                StatusMessage = "Searching patients...";

                var patient = await _patientRepository.GetPatientBySearchAsync(SearchTerm, _currentUser?.HospitalId ?? "DEFAULT");
                
                Patients.Clear();
                if (patient != null)
                {
                    Patients.Add(patient);
                    StatusMessage = $"Found patient: {patient.FullName}";
                }
                else
                {
                    StatusMessage = "No patients found";
                }

                TotalPatients = Patients.Count;
                
                await LogAuditEvent("SEARCH", "Patient", "Success", $"Searched patients: {SearchTerm}");
                
                _logger.LogInformation("Search completed: {Count} patients found", Patients.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching patients");
                StatusMessage = "Error searching patients";
                MessageBox.Show($"Error searching patients: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("SEARCH", "Patient", "Error", $"Error searching patients: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task ClearSearch()
        {
            try
            {
                _logger.LogInformation("Clearing search");
                
                SearchTerm = string.Empty;
                await LoadPatientsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing search");
            }
        }

        [RelayCommand]
        private async Task AddPatient()
        {
            try
            {
                _logger.LogInformation("Opening add patient dialog");
                
                var addPatientWindow = new AddPatientWindow();
                var addPatientViewModel = new AddPatientViewModel(_logger, _patientRepository, _auditRepository, _currentUser);
                addPatientWindow.DataContext = addPatientViewModel;
                
                if (addPatientWindow.ShowDialog() == true)
                {
                    await LoadPatientsAsync();
                    StatusMessage = "Patient added successfully";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding patient");
                MessageBox.Show($"Error adding patient: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        [RelayCommand]
        private async Task EditPatient()
        {
            try
            {
                if (SelectedPatient == null)
                {
                    MessageBox.Show("Please select a patient to edit", "Information", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                _logger.LogInformation("Opening edit patient dialog for: {PatientId}", SelectedPatient.Id);
                
                var editPatientWindow = new EditPatientWindow();
                var editPatientViewModel = new EditPatientViewModel(_logger, _patientRepository, _auditRepository, _currentUser, SelectedPatient);
                editPatientWindow.DataContext = editPatientViewModel;
                
                if (editPatientWindow.ShowDialog() == true)
                {
                    await LoadPatientsAsync();
                    StatusMessage = "Patient updated successfully";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing patient");
                MessageBox.Show($"Error editing patient: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        [RelayCommand]
        private async Task DeletePatient()
        {
            try
            {
                if (SelectedPatient == null)
                {
                    MessageBox.Show("Please select a patient to delete", "Information", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                var result = MessageBox.Show(
                    $"Are you sure you want to delete patient {SelectedPatient.FullName}? This action cannot be undone.",
                    "Confirm Delete",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Question);

                if (result == MessageBoxResult.Yes)
                {
                    _logger.LogInformation("Deleting patient: {PatientId}", SelectedPatient.Id);
                    
                    IsLoading = true;
                    StatusMessage = "Deleting patient...";

                    var success = await _patientRepository.DeletePatientAsync(SelectedPatient.Id);
                    
                    if (success)
                    {
                        Patients.Remove(SelectedPatient);
                        SelectedPatient = null;
                        TotalPatients = Patients.Count;
                        StatusMessage = "Patient deleted successfully";
                        
                        await LogAuditEvent("DELETE", "Patient", "Success", $"Deleted patient: {SelectedPatient?.FullName}");
                        
                        _logger.LogInformation("Patient deleted successfully: {PatientId}", SelectedPatient?.Id);
                    }
                    else
                    {
                        StatusMessage = "Error deleting patient";
                        MessageBox.Show("Failed to delete patient", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient");
                StatusMessage = "Error deleting patient";
                MessageBox.Show($"Error deleting patient: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                
                await LogAuditEvent("DELETE", "Patient", "Error", $"Error deleting patient: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task ViewPatientDetails()
        {
            try
            {
                if (SelectedPatient == null)
                {
                    MessageBox.Show("Please select a patient to view details", "Information", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                _logger.LogInformation("Opening patient details for: {PatientId}", SelectedPatient.Id);
                
                var detailsWindow = new PatientDetailsWindow();
                var detailsViewModel = new PatientDetailsViewModel(_logger, _patientRepository, _auditRepository, _currentUser, SelectedPatient);
                detailsWindow.DataContext = detailsViewModel;
                
                detailsWindow.ShowDialog();
                
                await LogAuditEvent("VIEW", "Patient", "Success", $"Viewed patient details: {SelectedPatient.FullName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error viewing patient details");
                MessageBox.Show($"Error viewing patient details: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        [RelayCommand]
        private async Task RefreshPatients()
        {
            try
            {
                _logger.LogInformation("Refreshing patient list");
                await LoadPatientsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing patients");
            }
        }

        [RelayCommand]
        private async Task ApplyFilter()
        {
            try
            {
                _logger.LogInformation("Applying filter: {FilterStatus}", FilterStatus);
                
                IsLoading = true;
                StatusMessage = "Applying filter...";

                var allPatients = await _patientRepository.GetAllPatientsAsync(_currentUser?.HospitalId ?? "DEFAULT");
                
                IEnumerable<Patient> filteredPatients = FilterStatus switch
                {
                    "Active" => allPatients.Where(p => p.CreatedAt >= DateTime.Now.AddDays(-30)),
                    "Recent" => allPatients.Where(p => p.CreatedAt >= DateTime.Now.AddDays(-7)),
                    "With Medical Records" => await _patientRepository.GetPatientsWithMedicalRecordsAsync(_currentUser?.HospitalId ?? "DEFAULT"),
                    "With Appointments" => await _patientRepository.GetPatientsWithAppointmentsAsync(_currentUser?.HospitalId ?? "DEFAULT"),
                    _ => allPatients
                };

                Patients.Clear();
                foreach (var patient in filteredPatients)
                {
                    Patients.Add(patient);
                }

                TotalPatients = Patients.Count;
                StatusMessage = $"Filtered: {TotalPatients} patients";
                
                _logger.LogInformation("Filter applied: {Count} patients", Patients.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying filter");
                StatusMessage = "Error applying filter";
                MessageBox.Show($"Error applying filter: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                IsLoading = false;
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

        partial void OnSearchTermChanged(string value)
        {
            // Auto-search after a delay
            _ = Task.Run(async () =>
            {
                await Task.Delay(500);
                if (!string.IsNullOrWhiteSpace(value))
                {
                    await SearchPatients();
                }
            });
        }
    }
}
