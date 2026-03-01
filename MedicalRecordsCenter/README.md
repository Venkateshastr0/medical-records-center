# Medical Records Center (MRC)

## Overview

Medical Records Center (MRC) is a secure, enterprise-grade desktop application for managing patient medical records in healthcare environments. Built with WPF and .NET 6, it provides comprehensive patient management with enterprise-level security and HIPAA compliance.

## Features

### 🔐 Security Features
- **Windows Authentication** - Active Directory integration
- **Biometric Support** - Windows Hello authentication
- **AES-256 Encryption** - Military-grade data protection
- **Complete Audit Trail** - All operations logged
- **Role-Based Access** - User permission management
- **HIPAA Compliance** - Healthcare data protection

### 👥 Patient Management
- **Complete Patient Records** - Demographics, medical history, allergies
- **Advanced Search** - Real-time patient lookup
- **Filtering System** - Multiple search criteria
- **CRUD Operations** - Add, edit, delete patients
- **Patient Details** - Comprehensive patient information display

### 📊 Security Dashboard
- **Real-time Monitoring** - Live security metrics
- **User Activity Tracking** - Active user monitoring
- **Failed Login Detection** - Security threat monitoring
- **Audit Log Management** - Complete activity tracking
- **Security Reports** - Exportable security analytics

### 🎨 User Interface
- **Material Design** - Modern, professional interface
- **Responsive Layout** - Adaptive to screen sizes
- **Ubuntu Typography** - Clean, readable fonts
- **Intuitive Navigation** - Easy-to-use interface
- **Loading States** - Visual feedback for operations

## Architecture

### 🏗️ Technology Stack
- **.NET 6** - Modern .NET framework
- **WPF** - Windows Presentation Foundation
- **Entity Framework Core** - Data access layer
- **SQLite** - Local database storage
- **Material Design** - UI framework
- **MVVM Pattern** - Clean architecture

### 📁 Project Structure
```
MedicalRecordsCenter/
├── 📁 Models/                 # Data models
├── 📁 ViewModels/             # MVVM view models
├── 📁 Views/                  # WPF views
├── 📁 Repositories/           # Data access layer
├── 📁 Security/               # Security services
├── 📁 Styles/                 # UI styles
├── 📁 Converters/             # Value converters
├── 📁 Helpers/                # Utility classes
├── 📁 Assets/                 # Application assets
└── 📁 Data/                   # Data layer
```

### 🔐 Security Architecture
- **Windows Security Service** - OS-level integration
- **Hospital Authentication** - Multi-tenant access
- **Data Encryption** - AES-256 protection
- **Audit Logging** - Complete activity tracking
- **Session Management** - Secure user sessions

## Installation

### Prerequisites
- Windows 10/11
- .NET 6.0 Runtime
- Active Directory (for authentication)

### Setup
1. Clone the repository
2. Open in Visual Studio 2022
3. Restore NuGet packages
4. Build and run the application

## Configuration

### Application Settings
Configuration is managed through `appsettings.json`:

```json
{
  "Security": {
    "JwtSecret": "your-secret-key",
    "RequireBiometric": false,
    "MaxFailedAttempts": 3
  },
  "Database": {
    "ConnectionString": "Data Source=medical_records.db"
  },
  "Features": {
    "EnablePatientManagement": true,
    "EnableSecurityDashboard": true
  }
}
```

### Security Settings
- **JWT Secret** - Token signing key
- **Biometric Auth** - Windows Hello requirement
- **Session Timeout** - User session duration
- **Password Policies** - Security requirements

## Usage

### Login
1. Launch the application
2. Enter Windows credentials
3. Optional: Use biometric authentication
4. Access granted based on role permissions

### Patient Management
1. Navigate to "Patient Management"
2. Search for existing patients
3. Add new patients with complete information
4. Edit or delete patient records
5. View detailed patient information

### Security Monitoring
1. Navigate to "Security Dashboard"
2. Monitor user activity
3. Review failed login attempts
4. Export security reports
5. Manage audit logs

## Security Features

### Data Protection
- **Encryption** - All sensitive data encrypted
- **Access Control** - Role-based permissions
- **Audit Trail** - Complete activity logging
- **Data Integrity** - Referential constraints

### Authentication
- **Windows Auth** - Active Directory integration
- **Biometric Auth** - Windows Hello support
- **Multi-Factor** - Enhanced security
- **Session Management** - Secure user sessions

### Compliance
- **HIPAA Ready** - Healthcare data protection
- **Audit Logging** - Complete activity tracking
- **Data Retention** - Configurable retention policies
- **Privacy Controls** - Patient data protection

## Development

### Building
```bash
dotnet build
```

### Running
```bash
dotnet run
```

### Testing
```bash
dotnet test
```

### Publishing
```bash
dotnet publish -c Release -r win-x64 --self-contained
```

## Support

### Documentation
- **API Documentation** - Code documentation
- **User Manual** - Application usage guide
- **Security Guide** - Security best practices
- **Troubleshooting** - Common issues and solutions

### Contact
- **Support** - Contact support team
- **Issues** - Report bugs and feature requests
- **Documentation** - Access documentation

## License

This project is proprietary software. All rights reserved.

## Version History

### v1.0.0 (2024)
- Initial release
- Patient management system
- Security dashboard
- Windows authentication
- Material Design interface

## Roadmap

### Future Features
- **Mobile App** - iOS/Android companion
- **Web Portal** - Browser-based access
- **AI Integration** - Smart diagnostics
- **Telemedicine** - Remote consultations
- **Blockchain** - Enhanced security

### Enhancements
- **Multi-Language** - International support
- **Advanced Analytics** - Business intelligence
- **Integration APIs** - Third-party integrations
- **Cloud Sync** - Multi-device synchronization
- **Voice Commands** - Hands-free operation

---

**Medical Records Center** - Secure, compliant, and professional healthcare data management.
