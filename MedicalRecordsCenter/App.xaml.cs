using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Serilog;
using System.Windows;
using MedicalRecordsCenter.Security;
using MedicalRecordsCenter.Data;
using MedicalRecordsCenter.ViewModels;
using MedicalRecordsCenter.Views;

namespace MedicalRecordsCenter
{
    public partial class App : Application
    {
        private IHost? _host;

        protected override void OnStartup(StartupEventArgs e)
        {
            // Configure logging
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File("logs/medical-records-.log", rollingInterval: RollingInterval.Day)
                .WriteTo.EventLog("Medical Records Center")
                .CreateLogger();

            try
            {
                // Create host
                _host = CreateHostBuilder().Build();

                // Start host
                _host.Start();

                // Show main window
                var mainWindow = _host.Services.GetRequiredService<MainWindow>();
                mainWindow.Show();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Application failed to start");
                MessageBox.Show($"Application failed to start: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                Shutdown();
            }
        }

        protected override void OnExit(ExitEventArgs e)
        {
            _host?.Dispose();
            Log.CloseAndFlush();
            base.OnExit(e);
        }

        private IHostBuilder CreateHostBuilder()
        {
            return Host.CreateDefaultBuilder()
                .UseSerilog()
                .ConfigureAppConfiguration((context, config) =>
                {
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                    config.AddJsonFile($"appsettings.{context.HostingEnvironment.EnvironmentName}.json", optional: true);
                    config.AddEnvironmentVariables();
                })
                .ConfigureServices((context, services) =>
                {
                    // Configuration
                    services.AddSingleton(context.Configuration);

                    // Logging
                    services.AddLogging(builder => builder.AddSerilog());

                    // Security Services
                    services.AddSingleton<IWindowsSecurityService, WindowsSecurityService>();
                    services.AddSingleton<IHospitalAuthService, HospitalAuthService>();
                    services.AddSingleton<IDataEncryptionService, DataEncryptionService>();

                    // Data Services
                    services.AddDbContext<MedicalRecordsDbContext>();
                    services.AddSingleton<IPatientRepository, PatientRepository>();
                    services.AddSingleton<IUserRepository, UserRepository>();
                    services.AddSingleton<IAuditRepository, AuditRepository>();

                    // ViewModels
                    services.AddTransient<MainWindowViewModel>();
                    services.AddTransient<LoginViewModel>();
                    services.AddTransient<PatientManagementViewModel>();
                    services.AddTransient<SecurityDashboardViewModel>();

                    // Views
                    services.AddTransient<MainWindow>();
                    services.AddTransient<LoginWindow>();
                    services.AddTransient<PatientManagementWindow>();
                    services.AddTransient<SecurityDashboardWindow>();
                });
        }
    }
}
