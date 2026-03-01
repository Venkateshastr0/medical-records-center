using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public class PatientRepository : IPatientRepository
    {
        private readonly MedicalRecordsDbContext _context;
        private readonly ILogger<PatientRepository> _logger;

        public PatientRepository(MedicalRecordsDbContext context, ILogger<PatientRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Patient>> GetAllPatientsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting all patients for hospital: {HospitalId}", hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId)
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients for hospital: {HospitalId}", patients.Count, hospitalId);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all patients for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<Patient> GetPatientByIdAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Getting patient by ID: {PatientId}", patientId);
                
                var patient = await _context.Patients
                    .Include(p => p.MedicalRecords)
                    .Include(p => p.Appointments)
                    .Include(p => p.Prescriptions)
                    .Include(p => p.LabResults)
                    .FirstOrDefaultAsync(p => p.Id == patientId);
                
                if (patient != null)
                {
                    _logger.LogInformation("Retrieved patient: {PatientId} - {FullName}", patientId, patient.FullName);
                }
                else
                {
                    _logger.LogWarning("Patient not found: {PatientId}", patientId);
                }
                
                return patient;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient by ID: {PatientId}", patientId);
                throw;
            }
        }

        public async Task<Patient> GetPatientBySearchAsync(string searchTerm, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Searching patient with term: {SearchTerm} for hospital: {HospitalId}", searchTerm, hospitalId);
                
                var patient = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId &&
                               (p.FirstName.Contains(searchTerm) ||
                                p.LastName.Contains(searchTerm) ||
                                p.PhoneNumber.Contains(searchTerm) ||
                                p.Email.Contains(searchTerm) ||
                                p.Id.Contains(searchTerm)))
                    .FirstOrDefaultAsync();
                
                if (patient != null)
                {
                    _logger.LogInformation("Found patient: {PatientId} - {FullName}", patient.Id, patient.FullName);
                }
                else
                {
                    _logger.LogInformation("No patient found with search term: {SearchTerm}", searchTerm);
                }
                
                return patient;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching patient with term: {SearchTerm}", searchTerm);
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsByDoctorAsync(string doctorId, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients for doctor: {DoctorId} in hospital: {HospitalId}", doctorId, hospitalId);
                
                var patients = await _context.MedicalRecords
                    .Where(mr => mr.DoctorId == doctorId && mr.HospitalId == hospitalId)
                    .Select(mr => mr.Patient)
                    .Distinct()
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients for doctor: {DoctorId}", patients.Count, doctorId);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients for doctor: {DoctorId}", doctorId);
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsByDateRangeAsync(DateTime startDate, DateTime endDate, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients for date range: {StartDate} to {EndDate} in hospital: {HospitalId}", 
                    startDate, endDate, hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId &&
                               p.CreatedAt >= startDate &&
                               p.CreatedAt <= endDate)
                    .OrderBy(p => p.CreatedAt)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients for date range", patients.Count);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients for date range");
                throw;
            }
        }

        public async Task<Patient> CreatePatientAsync(Patient patient)
        {
            try
            {
                _logger.LogInformation("Creating new patient: {FirstName} {LastName}", patient.FirstName, patient.LastName);
                
                patient.Id = Guid.NewGuid().ToString();
                patient.CreatedAt = DateTime.UtcNow;
                patient.UpdatedAt = DateTime.UtcNow;
                
                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created patient successfully: {PatientId} - {FullName}", patient.Id, patient.FullName);
                return patient;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating patient: {FirstName} {LastName}", patient.FirstName, patient.LastName);
                throw;
            }
        }

        public async Task<Patient> UpdatePatientAsync(Patient patient)
        {
            try
            {
                _logger.LogInformation("Updating patient: {PatientId} - {FullName}", patient.Id, patient.FullName);
                
                patient.UpdatedAt = DateTime.UtcNow;
                
                _context.Patients.Update(patient);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated patient successfully: {PatientId}", patient.Id);
                return patient;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient: {PatientId}", patient.Id);
                throw;
            }
        }

        public async Task<bool> DeletePatientAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Deleting patient: {PatientId}", patientId);
                
                var patient = await _context.Patients.FindAsync(patientId);
                if (patient == null)
                {
                    _logger.LogWarning("Patient not found for deletion: {PatientId}", patientId);
                    return false;
                }
                
                _context.Patients.Remove(patient);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Deleted patient successfully: {PatientId}", patientId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient: {PatientId}", patientId);
                throw;
            }
        }

        public async Task<bool> PatientExistsAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Checking if patient exists: {PatientId}", patientId);
                
                var exists = await _context.Patients.AnyAsync(p => p.Id == patientId);
                
                _logger.LogInformation("Patient {PatientId} exists: {Exists}", patientId, exists);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if patient exists: {PatientId}", patientId);
                throw;
            }
        }

        public async Task<int> GetPatientCountAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patient count for hospital: {HospitalId}", hospitalId);
                
                var count = await _context.Patients
                    .CountAsync(p => p.HospitalId == hospitalId);
                
                _logger.LogInformation("Patient count for hospital {HospitalId}: {Count}", hospitalId, count);
                return count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient count for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsWithMedicalRecordsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients with medical records for hospital: {HospitalId}", hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId && p.MedicalRecords.Any())
                    .Include(p => p.MedicalRecords)
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients with medical records", patients.Count);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients with medical records");
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsWithAppointmentsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients with appointments for hospital: {HospitalId}", hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId && p.Appointments.Any())
                    .Include(p => p.Appointments)
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients with appointments", patients.Count);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients with appointments");
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsWithPrescriptionsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients with prescriptions for hospital: {HospitalId}", hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId && p.Prescriptions.Any())
                    .Include(p => p.Prescriptions)
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients with prescriptions", patients.Count);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients with prescriptions");
                throw;
            }
        }

        public async Task<IEnumerable<Patient>> GetPatientsWithLabResultsAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting patients with lab results for hospital: {HospitalId}", hospitalId);
                
                var patients = await _context.Patients
                    .Where(p => p.HospitalId == hospitalId && p.LabResults.Any())
                    .Include(p => p.LabResults)
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} patients with lab results", patients.Count);
                return patients;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients with lab results");
                throw;
            }
        }

        public async Task<bool> ValidatePatientDataAsync(Patient patient)
        {
            try
            {
                _logger.LogInformation("Validating patient data: {PatientId}", patient.Id);
                
                var validationErrors = new List<string>();
                
                if (string.IsNullOrWhiteSpace(patient.FirstName))
                    validationErrors.Add("First name is required");
                
                if (string.IsNullOrWhiteSpace(patient.LastName))
                    validationErrors.Add("Last name is required");
                
                if (string.IsNullOrWhiteSpace(patient.DateOfBirth))
                    validationErrors.Add("Date of birth is required");
                else if (!DateTime.TryParse(patient.DateOfBirth, out DateTime dob))
                    validationErrors.Add("Invalid date of birth format");
                else if (dob > DateTime.Today)
                    validationErrors.Add("Date of birth cannot be in the future");
                
                if (string.IsNullOrWhiteSpace(patient.HospitalId))
                    validationErrors.Add("Hospital ID is required");
                
                if (string.IsNullOrWhiteSpace(patient.CreatedBy))
                    validationErrors.Add("Created by is required");
                
                if (validationErrors.Any())
                {
                    _logger.LogWarning("Patient validation failed: {Errors}", string.Join(", ", validationErrors));
                    return false;
                }
                
                _logger.LogInformation("Patient validation passed: {PatientId}", patient.Id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating patient data: {PatientId}", patient.Id);
                throw;
            }
        }
    }
}
