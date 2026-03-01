using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public interface IPatientRepository
    {
        Task<IEnumerable<Patient>> GetAllPatientsAsync(string hospitalId);
        Task<Patient> GetPatientByIdAsync(string patientId);
        Task<Patient> GetPatientBySearchAsync(string searchTerm, string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsByDoctorAsync(string doctorId, string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsByDateRangeAsync(DateTime startDate, DateTime endDate, string hospitalId);
        Task<Patient> CreatePatientAsync(Patient patient);
        Task<Patient> UpdatePatientAsync(Patient patient);
        Task<bool> DeletePatientAsync(string patientId);
        Task<bool> PatientExistsAsync(string patientId);
        Task<int> GetPatientCountAsync(string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsWithMedicalRecordsAsync(string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsWithAppointmentsAsync(string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsWithPrescriptionsAsync(string hospitalId);
        Task<IEnumerable<Patient>> GetPatientsWithLabResultsAsync(string hospitalId);
        Task<bool> ValidatePatientDataAsync(Patient patient);
    }
}
