using System.Threading.Tasks;

namespace MedicalRecordsCenter.Security
{
    public interface IDataEncryptionService
    {
        Task<string> EncryptData(string plainText);
        Task<string> DecryptData(string cipherText);
        Task<string> EncryptPatientData(PatientData patientData);
        Task<PatientData> DecryptPatientData(string encryptedData);
        Task<string> GenerateSecureKey();
        Task<bool> ValidateDataIntegrity(string data, string hash);
    }

    public class PatientData
    {
        public string PatientId { get; set; }
        public string Name { get; set; }
        public string DateOfBirth { get; set; }
        public string MedicalHistory { get; set; }
        public string Prescriptions { get; set; }
        public string Allergies { get; set; }
        public string ContactInfo { get; set; }
    }
}
