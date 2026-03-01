using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace MedicalRecordsCenter.Security
{
    public class DataEncryptionService : IDataEncryptionService
    {
        private readonly ILogger<DataEncryptionService> _logger;
        private readonly string _encryptionKey;

        public DataEncryptionService(ILogger<DataEncryptionService> logger)
        {
            _logger = logger;
            _encryptionKey = "MRC-SECURE-KEY-2024-DEFAULT-CHANGE-IN-PRODUCTION";
        }

        public async Task<string> EncryptData(string plainText)
        {
            try
            {
                _logger.LogInformation("Encrypting data");
                
                using (var aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
                    aes.GenerateIV();
                    
                    using (var encryptor = aes.CreateEncryptor())
                    {
                        using (var msEncrypt = new MemoryStream())
                        {
                            using (var csEncrypt = new CryptoStream(msEncrypt, CryptoStreamMode.Write, encryptor))
                            {
                                using (var swEncrypt = new StreamWriter(csEncrypt))
                                {
                                    await swEncrypt.WriteAsync(plainText);
                                    await swEncrypt.FlushAsync();
                                }
                            }
                        }
                        
                        return Convert.ToBase64String(msEncrypt.ToArray());
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting data");
                throw;
            }
        }

        public async Task<string> DecryptData(string cipherText)
        {
            try
            {
                _logger.LogInformation("Decrypting data");
                
                var fullCipher = Convert.FromBase64String(cipherText);
                var cipherBytes = Convert.FromBase64String(fullCipher);
                
                using (var aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
                    
                    // Extract IV from the cipher
                    var iv = new byte[16];
                    Array.Copy(cipherBytes, 0, iv, 16);
                    aes.IV = iv;
                    
                    using (var decryptor = aes.CreateDecryptor())
                    {
                        using (var msDecrypt = new MemoryStream())
                        {
                            using (var csDecrypt = new CryptoStream(msDecrypt, CryptoStreamMode.Read, decryptor))
                            {
                                using (var srDecrypt = new StreamReader(csDecrypt))
                                {
                                    return await srDecrypt.ReadToEndAsync();
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting data");
                throw;
            }
        }

        public async Task<string> EncryptPatientData(PatientData patientData)
        {
            try
            {
                _logger.LogInformation("Encrypting patient data for ID: {PatientId}", patientData.PatientId);
                
                // Serialize patient data to JSON
                var json = System.Text.Json.JsonSerializer.Serialize(patientData);
                var encryptedData = await EncryptData(json);
                
                _logger.LogInformation("Patient data encrypted successfully");
                return encryptedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting patient data");
                throw;
            }
        }

        public async Task<PatientData> DecryptPatientData(string encryptedData)
        {
            try
            {
                _logger.LogInformation("Decrypting patient data");
                
                var decryptedJson = await DecryptData(encryptedData);
                var patientData = System.Text.Json.JsonSerializer.Deserialize<PatientData>(decryptedJson);
                
                _logger.LogInformation("Patient data decrypted successfully");
                return patientData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting patient data");
                throw;
            }
        }

        public async Task<string> GenerateSecureKey()
        {
            try
            {
                _logger.LogInformation("Generating secure key");
                
                using (var rng = RandomNumberGenerator.Create())
                {
                    var keyBytes = new byte[32];
                    rng.GetBytes(keyBytes);
                    
                    var key = Convert.ToBase64String(keyBytes);
                    
                    _logger.LogInformation("Secure key generated successfully");
                    return key;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating secure key");
                throw;
            }
        }

        public async Task<bool> ValidateDataIntegrity(string data, string hash)
        {
            try
            {
                _logger.LogInformation("Validating data integrity");
                
                using (var sha256 = SHA256.Create())
                {
                    var dataBytes = Encoding.UTF8.GetBytes(data);
                    var computedHash = await Task.Run(() => Convert.ToBase64String(sha256.ComputeHash(dataBytes)));
                    
                    bool isValid = computedHash.Equals(hash, StringComparison.OrdinalIgnoreCase);
                    
                    if (isValid)
                    {
                        _logger.LogInformation("Data integrity validation passed");
                    }
                    else
                    {
                        _logger.LogWarning("Data integrity validation failed");
                    }
                    
                    return isValid;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating data integrity");
                throw;
            }
        }
    }
}
