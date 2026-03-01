-- Medical Records Database Schema
-- SQL Server Express compatible

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'MedicalRecordsDB')
BEGIN
    CREATE DATABASE MedicalRecordsDB;
END
GO

USE MedicalRecordsDB;
GO

-- Create Hospitals table
CREATE TABLE Hospitals (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Address NVARCHAR(500),
    PhoneNumber NVARCHAR(20),
    Email NVARCHAR(100),
    Website NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Create Users table
CREATE TABLE Users (
    Id NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(100) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Role NVARCHAR(50) NOT NULL,
    Department NVARCHAR(100),
    LicenseNumber NVARCHAR(50),
    HospitalId NVARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1,
    LastLogin DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create Patients table
CREATE TABLE Patients (
    Id NVARCHAR(50) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender NVARCHAR(20),
    PhoneNumber NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    BloodType NVARCHAR(50),
    EmergencyContact NVARCHAR(20),
    Allergies NVARCHAR(100),
    MedicalHistory NVARCHAR(MAX),
    CurrentMedications NVARCHAR(500),
    InsuranceProvider NVARCHAR(50),
    InsurancePolicyNumber NVARCHAR(50),
    PrimaryCarePhysician NVARCHAR(50),
    Notes NVARCHAR(MAX),
    HospitalId NVARCHAR(50) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create MedicalRecords table
CREATE TABLE MedicalRecords (
    Id NVARCHAR(50) PRIMARY KEY,
    PatientId NVARCHAR(50) NOT NULL,
    DoctorId NVARCHAR(50) NOT NULL,
    RecordType NVARCHAR(100) NOT NULL,
    VisitDate DATETIME2 NOT NULL,
    ChiefComplaint NVARCHAR(1000),
    HistoryOfPresentIllness NVARCHAR(MAX),
    PhysicalExamination NVARCHAR(MAX),
    Assessment NVARCHAR(MAX),
    Plan NVARCHAR(MAX),
    Diagnosis NVARCHAR(1000),
    Treatment NVARCHAR(1000),
    FollowUpInstructions NVARCHAR(1000),
    VitalSigns NVARCHAR(500),
    LabResults NVARCHAR(1000),
    ImagingResults NVARCHAR(1000),
    Referrals NVARCHAR(1000),
    Notes NVARCHAR(MAX),
    HospitalId NVARCHAR(50) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientId) REFERENCES Patients(Id),
    FOREIGN KEY (DoctorId) REFERENCES Users(Id),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create Appointments table
CREATE TABLE Appointments (
    Id NVARCHAR(50) PRIMARY KEY,
    PatientId NVARCHAR(50) NOT NULL,
    DoctorId NVARCHAR(50) NOT NULL,
    AppointmentDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Scheduled',
    AppointmentType NVARCHAR(100),
    Reason NVARCHAR(1000),
    Notes NVARCHAR(500),
    RoomNumber NVARCHAR(20),
    Department NVARCHAR(50),
    IsVirtual BIT DEFAULT 0,
    VirtualMeetingLink NVARCHAR(500),
    ReminderSent NVARCHAR(20),
    CheckInTime DATETIME2,
    CheckOutTime DATETIME2,
    HospitalId NVARCHAR(50) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientId) REFERENCES Patients(Id),
    FOREIGN KEY (DoctorId) REFERENCES Users(Id),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create Prescriptions table
CREATE TABLE Prescriptions (
    Id NVARCHAR(50) PRIMARY KEY,
    PatientId NVARCHAR(50) NOT NULL,
    DoctorId NVARCHAR(50) NOT NULL,
    MedicationName NVARCHAR(100) NOT NULL,
    Dosage NVARCHAR(50),
    Frequency NVARCHAR(200),
    Route NVARCHAR(100),
    Instructions NVARCHAR(500),
    Duration NVARCHAR(100),
    PrescriptionDate DATETIME2 DEFAULT GETDATE(),
    StartDate DATE,
    EndDate DATE,
    Refills NVARCHAR(20),
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(500),
    Pharmacy NVARCHAR(100),
    PharmacyPhone NVARCHAR(50),
    Diagnosis NVARCHAR(100),
    SideEffects NVARCHAR(1000),
    DrugInteractions NVARCHAR(100),
    HospitalId NVARCHAR(50) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientId) REFERENCES Patients(Id),
    FOREIGN KEY (DoctorId) REFERENCES Users(Id),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create LabResults table
CREATE TABLE LabResults (
    Id NVARCHAR(50) PRIMARY KEY,
    PatientId NVARCHAR(50) NOT NULL,
    DoctorId NVARCHAR(50) NOT NULL,
    TestName NVARCHAR(100) NOT NULL,
    TestCategory NVARCHAR(100),
    TestType NVARCHAR(100),
    TestDate DATETIME2 DEFAULT GETDATE(),
    ResultDate DATETIME2,
    Result NVARCHAR(1000),
    Unit NVARCHAR(100),
    ReferenceRange NVARCHAR(50),
    Status NVARCHAR(50) DEFAULT 'Pending',
    AbnormalFlag NVARCHAR(100),
    Interpretation NVARCHAR(1000),
    Laboratory NVARCHAR(100),
    Technician NVARCHAR(100),
    Pathologist NVARCHAR(100),
    Notes NVARCHAR(500),
    Comments NVARCHAR(1000),
    Urgency NVARCHAR(100) DEFAULT 'Routine',
    SpecimenType NVARCHAR(100),
    SpecimenCollectionDate DATE,
    AccessionNumber NVARCHAR(100),
    HospitalId NVARCHAR(50) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientId) REFERENCES Patients(Id),
    FOREIGN KEY (DoctorId) REFERENCES Users(Id),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create AuditLogs table
CREATE TABLE AuditLogs (
    Id NVARCHAR(50) PRIMARY KEY,
    UserId NVARCHAR(50) NOT NULL,
    UserName NVARCHAR(100),
    Action NVARCHAR(50) NOT NULL,
    EntityType NVARCHAR(50),
    EntityId NVARCHAR(100),
    Description NVARCHAR(1000),
    OldValues NVARCHAR(1000),
    NewValues NVARCHAR(1000),
    IpAddress NVARCHAR(100),
    UserAgent NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Success',
    ErrorMessage NVARCHAR(500),
    Severity NVARCHAR(50) DEFAULT 'Info',
    HospitalId NVARCHAR(50) NOT NULL,
    Timestamp DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(Id)
);
GO

-- Create indexes for better performance
CREATE INDEX IX_Patients_HospitalId ON Patients(HospitalId);
CREATE INDEX IX_Patients_FirstName ON Patients(FirstName);
CREATE INDEX IX_Patients_LastName ON Patients(LastName);
CREATE INDEX IX_Patients_DateOfBirth ON Patients(DateOfBirth);
CREATE INDEX IX_Patients_PhoneNumber ON Patients(PhoneNumber);
CREATE INDEX IX_Patients_Email ON Patients(Email);

CREATE INDEX IX_Users_HospitalId ON Users(HospitalId);
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);

CREATE INDEX IX_MedicalRecords_PatientId ON MedicalRecords(PatientId);
CREATE INDEX IX_MedicalRecords_DoctorId ON MedicalRecords(DoctorId);
CREATE INDEX IX_MedicalRecords_HospitalId ON MedicalRecords(HospitalId);
CREATE INDEX IX_MedicalRecords_VisitDate ON MedicalRecords(VisitDate);

CREATE INDEX IX_Appointments_PatientId ON Appointments(PatientId);
CREATE INDEX IX_Appointments_DoctorId ON Appointments(DoctorId);
CREATE INDEX IX_Appointments_HospitalId ON Appointments(HospitalId);
CREATE INDEX IX_Appointments_AppointmentDate ON Appointments(AppointmentDate);
CREATE INDEX IX_Appointments_Status ON Appointments(Status);

CREATE INDEX IX_Prescriptions_PatientId ON Prescriptions(PatientId);
CREATE INDEX IX_Prescriptions_DoctorId ON Prescriptions(DoctorId);
CREATE INDEX IX_Prescriptions_HospitalId ON Prescriptions(HospitalId);
CREATE INDEX IX_Prescriptions_MedicationName ON Prescriptions(MedicationName);
CREATE INDEX IX_Prescriptions_Status ON Prescriptions(Status);

CREATE INDEX IX_LabResults_PatientId ON LabResults(PatientId);
CREATE INDEX IX_LabResults_DoctorId ON LabResults(DoctorId);
CREATE INDEX IX_LabResults_HospitalId ON LabResults(HospitalId);
CREATE INDEX IX_LabResults_TestName ON LabResults(TestName);
CREATE INDEX IX_LabResults_Status ON LabResults(Status);
CREATE INDEX IX_LabResults_Urgency ON LabResults(Urgency);

CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE INDEX IX_AuditLogs_HospitalId ON AuditLogs(HospitalId);
CREATE INDEX IX_AuditLogs_Action ON AuditLogs(Action);
CREATE INDEX IX_AuditLogs_EntityType ON AuditLogs(EntityType);
CREATE INDEX IX_AuditLogs_Timestamp ON AuditLogs(Timestamp);
CREATE INDEX IX_AuditLogs_Severity ON AuditLogs(Severity);
GO

-- Insert sample data
INSERT INTO Hospitals (Id, Name, Address, PhoneNumber, Email) VALUES 
('HOSPITAL-001', 'Central Medical Center', '123 Main St, City, State 12345', '(555) 123-4567', 'info@centralmed.com'),
('HOSPITAL-002', 'Westside Hospital', '456 Oak Ave, West City, State 67890', '(555) 987-6543', 'contact@westside.com');

INSERT INTO Users (Id, Username, Email, FirstName, LastName, Role, Department, HospitalId, CreatedBy) VALUES 
('USER-001', 'admin', 'admin@centralmed.com', 'System', 'Administrator', 'Administrator', 'IT', 'HOSPITAL-001', 'SYSTEM'),
('USER-002', 'doctor1', 'dr.smith@centralmed.com', 'John', 'Smith', 'Doctor', 'Internal Medicine', 'HOSPITAL-001', 'USER-001'),
('USER-003', 'nurse1', 'nurse.jones@centralmed.com', 'Sarah', 'Jones', 'Nurse', 'Emergency', 'HOSPITAL-001', 'USER-001');

-- Create stored procedures for common operations
CREATE PROCEDURE sp_GetPatientsByHospital
    @HospitalId NVARCHAR(50)
AS
BEGIN
    SELECT * FROM Patients WHERE HospitalId = @HospitalId ORDER BY LastName, FirstName;
END
GO

CREATE PROCEDURE sp_GetUsersByHospital
    @HospitalId NVARCHAR(50)
AS
BEGIN
    SELECT * FROM Users WHERE HospitalId = @HospitalId AND IsActive = 1 ORDER BY LastName, FirstName;
END
GO

CREATE PROCEDURE sp_GetAuditLogsByDateRange
    @HospitalId NVARCHAR(50),
    @StartDate DATETIME2,
    @EndDate DATETIME2
AS
BEGIN
    SELECT * FROM AuditLogs 
    WHERE HospitalId = @HospitalId 
    AND Timestamp BETWEEN @StartDate AND @EndDate 
    ORDER BY Timestamp DESC;
END
GO

-- Create views for dashboard data
CREATE VIEW v_HospitalStats AS
SELECT 
    h.Id as HospitalId,
    h.Name as HospitalName,
    COUNT(DISTINCT p.Id) as TotalPatients,
    COUNT(DISTINCT u.Id) as TotalUsers,
    COUNT(DISTINCT mr.Id) as TotalMedicalRecords,
    COUNT(DISTINCT a.Id) as TotalAppointments,
    COUNT(DISTINCT pr.Id) as TotalPrescriptions,
    COUNT(DISTINCT lr.Id) as TotalLabResults
FROM Hospitals h
LEFT JOIN Patients p ON h.Id = p.HospitalId
LEFT JOIN Users u ON h.Id = u.HospitalId AND u.IsActive = 1
LEFT JOIN MedicalRecords mr ON h.Id = mr.HospitalId
LEFT JOIN Appointments a ON h.Id = a.HospitalId
LEFT JOIN Prescriptions pr ON h.Id = pr.HospitalId
LEFT JOIN LabResults lr ON h.Id = lr.HospitalId
GROUP BY h.Id, h.Name;
GO

CREATE VIEW v_SecurityMetrics AS
SELECT 
    h.Id as HospitalId,
    h.Name as HospitalName,
    COUNT(CASE WHEN al.Action = 'LOGIN' AND al.Status = 'Success' THEN 1 END) as SuccessfulLogins,
    COUNT(CASE WHEN al.Action = 'LOGIN' AND al.Status = 'Failed' THEN 1 END) as FailedLogins,
    COUNT(CASE WHEN al.Severity = 'Critical' THEN 1 END) as CriticalEvents,
    COUNT(CASE WHEN al.Severity = 'Error' THEN 1 END) as ErrorEvents,
    COUNT(CASE WHEN al.Action = 'CREATE' THEN 1 END) as CreateOperations,
    COUNT(CASE WHEN al.Action = 'UPDATE' THEN 1 END) as UpdateOperations,
    COUNT(CASE WHEN al.Action = 'DELETE' THEN 1 END) as DeleteOperations
FROM Hospitals h
LEFT JOIN AuditLogs al ON h.Id = al.HospitalId
GROUP BY h.Id, h.Name;
GO

PRINT 'Database schema created successfully!';
