using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class Patient
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [Required]
        [StringLength(20)]
        public string DateOfBirth { get; set; }

        [StringLength(10)]
        public string Gender { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        [StringLength(50)]
        public string BloodType { get; set; }

        [StringLength(20)]
        public string EmergencyContact { get; set; }

        [StringLength(100)]
        public string Allergies { get; set; }

        [StringLength(1000)]
        public string MedicalHistory { get; set; }

        [StringLength(500)]
        public string CurrentMedications { get; set; }

        [StringLength(50)]
        public string InsuranceProvider { get; set; }

        [StringLength(50)]
        public string InsurancePolicyNumber { get; set; }

        [StringLength(20)]
        public string PrimaryCarePhysician { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }

        [Required]
        public string HospitalId { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";

        [NotMapped]
        public int Age
        {
            get
            {
                if (DateTime.TryParse(DateOfBirth, out DateTime dob))
                {
                    var today = DateTime.Today;
                    var age = today.Year - dob.Year;
                    if (dob.Date > today.AddYears(-age)) age--;
                    return age;
                }
                return 0;
            }
        }

        // Navigation properties
        public virtual ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
        public virtual ICollection<LabResult> LabResults { get; set; } = new List<LabResult>();
    }
}
