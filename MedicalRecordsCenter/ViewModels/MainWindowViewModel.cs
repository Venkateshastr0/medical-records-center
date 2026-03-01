using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;
using MedicalRecordsCenter.Views;

namespace MedicalRecordsCenter.ViewModels
{
    public partial class MainWindowViewModel : ObservableObject
    {
        private readonly ILogger<MainWindowViewModel> _logger;
        private readonly IHospitalAuthService _authService;
        private readonly IPatientRepository _patientRepository;
        private readonly IUserRepository _userRepository;
        private readonly IAuditRepository _auditRepository;

        [ObservableProperty]
        private object? _currentView;

        [ObservableProperty]
        private UserSession? _currentUser;

        [ObservableProperty]
        private string _statusMessage = "Ready";

        [ObservableProperty]
        private string _connectionStatus = "Connected";

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _windowTitle = "Medical Records Center";

        public ObservableCollection<NavigationItem> NavigationItems { get; }

        public MainWindowViewModel(
            ILogger<MainWindowViewModel> logger,
            IHospitalAuthService authService,
            IPatientRepository patientRepository,
            IUserRepository userRepository,
            IAuditRepository auditRepository)
        {
            _logger = logger;
            _authService = authService;
            _patientRepository = patientRepository;
            _userRepository = userRepository;
            _auditRepository = auditRepository;

            NavigationItems = new ObservableCollection<NavigationItem>
            {
                new NavigationItem { Name = "Patient Management", Icon = "AccountMultiple", Command = NavigateToPatientManagementCommand },
                new NavigationItem { Name = "Medical Records", Icon = "FileDocument", Command = NavigateToMedicalRecordsCommand },
                new NavigationItem { Name = "Appointments", Icon = "Calendar", Command = NavigateToAppointmentsCommand },
                new NavigationItem { Name = "Prescriptions", Icon = "Medicine", Command = NavigateToPrescriptionsCommand },
                new NavigationItem { Name = "Lab Results", Icon = "TestTube", Command = NavigateToLabResultsCommand },
                new NavigationItem { Name = "Security Dashboard", Icon = "Security", Command = NavigateToSecurityCommand },
                new NavigationItem { Name = "Audit Logs", Icon = "History", Command = NavigateToAuditCommand },
                new NavigationItem { Name = "Settings", Icon = "Settings", Command = NavigateToSettingsCommand }
            };

            _ = InitializeAsync();
        }

        private async Task InitializeAsync()
        {
            try
            {
                _logger.LogInformation("Initializing MainWindowViewModel");
                
                // Check if user is authenticated
                var session = await _authService.GetCurrentSession();
                if (session == null)
                {
                    _logger.LogInformation("No active session, showing login");
                    await ShowLoginWindow();
                    return;
                }

                CurrentUser = session;
                WindowTitle = $"Medical Records Center - {CurrentUser.Username}";
                StatusMessage = $"Welcome, {CurrentUser.Username}";
                
                // Load initial view
                await NavigateToPatientManagement();
                
                _logger.LogInformation("MainWindowViewModel initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing MainWindowViewModel");
                StatusMessage = "Initialization failed";
                MessageBox.Show($"Error initializing application: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async Task ShowLoginWindow()
        {
            try
            {
                _logger.LogInformation("Showing login window");
                
                var loginWindow = new LoginWindow();
                var loginViewModel = new LoginViewModel(_logger, _authService, _userRepository, _auditRepository);
                loginWindow.DataContext = loginViewModel;
                
                if (loginWindow.ShowDialog() == true)
                {
                    CurrentUser = await _authService.GetCurrentSession();
                    if (CurrentUser != null)
                    {
                        WindowTitle = $"Medical Records Center - {CurrentUser.Username}";
                        StatusMessage = $"Welcome, {CurrentUser.Username}";
                        await NavigateToPatientManagement();
                    }
                }
                else
                {
                    // User cancelled login, close application
                    Application.Current.Shutdown();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error showing login window");
                MessageBox.Show($"Error showing login: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                Application.Current.Shutdown();
            }
        }

        [RelayCommand]
        private async Task NavigateToPatientManagement()
        {
            try
            {
                _logger.LogInformation("Navigating to patient management");
                IsLoading = true;
                StatusMessage = "Loading patient management...";

                var patientViewModel = new PatientManagementViewModel(_logger, _patientRepository, _auditRepository, CurrentUser);
                CurrentView = patientViewModel;
                
                StatusMessage = "Patient management loaded";
                _logger.LogInformation("Navigated to patient management successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to patient management");
                StatusMessage = "Error loading patient management";
                MessageBox.Show($"Error loading patient management: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToMedicalRecords()
        {
            try
            {
                _logger.LogInformation("Navigating to medical records");
                IsLoading = true;
                StatusMessage = "Loading medical records...";

                // TODO: Implement MedicalRecordsViewModel
                StatusMessage = "Medical records not yet implemented";
                _logger.LogInformation("Medical records not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to medical records");
                StatusMessage = "Error loading medical records";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToAppointments()
        {
            try
            {
                _logger.LogInformation("Navigating to appointments");
                IsLoading = true;
                StatusMessage = "Loading appointments...";

                // TODO: Implement AppointmentsViewModel
                StatusMessage = "Appointments not yet implemented";
                _logger.LogInformation("Appointments not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to appointments");
                StatusMessage = "Error loading appointments";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToPrescriptions()
        {
            try
            {
                _logger.LogInformation("Navigating to prescriptions");
                IsLoading = true;
                StatusMessage = "Loading prescriptions...";

                // TODO: Implement PrescriptionsViewModel
                StatusMessage = "Prescriptions not yet implemented";
                _logger.LogInformation("Prescriptions not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to prescriptions");
                StatusMessage = "Error loading prescriptions";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToLabResults()
        {
            try
            {
                _logger.LogInformation("Navigating to lab results");
                IsLoading = true;
                StatusMessage = "Loading lab results...";

                // TODO: Implement LabResultsViewModel
                StatusMessage = "Lab results not yet implemented";
                _logger.LogInformation("Lab results not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to lab results");
                StatusMessage = "Error loading lab results";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToSecurity()
        {
            try
            {
                _logger.LogInformation("Navigating to security dashboard");
                IsLoading = true;
                StatusMessage = "Loading security dashboard...";

                var securityViewModel = new SecurityDashboardViewModel(_logger, _userRepository, _auditRepository, CurrentUser);
                CurrentView = securityViewModel;
                
                StatusMessage = "Security dashboard loaded";
                _logger.LogInformation("Navigated to security dashboard successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to security dashboard");
                StatusMessage = "Error loading security dashboard";
                MessageBox.Show($"Error loading security dashboard: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToAudit()
        {
            try
            {
                _logger.LogInformation("Navigating to audit logs");
                IsLoading = true;
                StatusMessage = "Loading audit logs...";

                // TODO: Implement AuditLogsViewModel
                StatusMessage = "Audit logs not yet implemented";
                _logger.LogInformation("Audit logs not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to audit logs");
                StatusMessage = "Error loading audit logs";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task NavigateToSettings()
        {
            try
            {
                _logger.LogInformation("Navigating to settings");
                IsLoading = true;
                StatusMessage = "Loading settings...";

                // TODO: Implement SettingsViewModel
                StatusMessage = "Settings not yet implemented";
                _logger.LogInformation("Settings not yet implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error navigating to settings");
                StatusMessage = "Error loading settings";
            }
            finally
            {
                IsLoading = false;
            }
        }

        [RelayCommand]
        private async Task Logout()
        {
            try
            {
                _logger.LogInformation("User logging out: {UserId}", CurrentUser?.UserId);
                
                var result = MessageBox.Show("Are you sure you want to logout?", "Logout", MessageBoxButton.YesNo, MessageBoxImage.Question);
                if (result == MessageBoxResult.Yes)
                {
                    await _authService.Logout();
                    CurrentUser = null;
                    WindowTitle = "Medical Records Center";
                    StatusMessage = "Logged out";
                    
                    // Show login window again
                    await ShowLoginWindow();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                MessageBox.Show($"Error during logout: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        partial void OnCurrentUserChanged(UserSession? value)
        {
            if (value != null)
            {
                WindowTitle = $"Medical Records Center - {value.Username}";
                StatusMessage = $"Welcome, {value.Username}";
            }
            else
            {
                WindowTitle = "Medical Records Center";
                StatusMessage = "Not logged in";
            }
        }
    }

    public class NavigationItem
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public ICommand? Command { get; set; }
    }
}
