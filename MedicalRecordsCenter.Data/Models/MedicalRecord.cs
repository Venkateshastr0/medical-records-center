using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class MedicalRecord
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string PatientId { get; set; }

        [Required]
        public string DoctorId { get; set; }

        [Required]
        [StringLength(100)]
        public string RecordType { get; set; }

        [Required]
        public DateTime VisitDate { get; set; }

        [StringLength(1000)]
        public string ChiefComplaint { get; set; }

        [StringLength(2000)]
        public string HistoryOfPresentIllness { get; set; }

        [StringLength(2000)]
        public string PhysicalExamination { get; set; }

        [StringLength(2000)]
        public string Assessment { get; set; }

        [StringLength(2000)]
        public string Plan { get; set; }

        [StringLength(1000)]
        public string Diagnosis { get; set; }

        [StringLength(1000)]
        public string Treatment { get; set; }

        [StringLength(1000)]
        public string FollowUpInstructions { get; set; }

        [StringLength(500)]
        public string VitalSigns { get; set; }

        [StringLength(1000)]
        public string LabResults { get; set; }

        [StringLength(1000)]
        public string ImagingResults { get; set; }

        [StringLength(1000)]
        public string Referrals { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }

        [Required]
        public string HospitalId { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual User Doctor { get; set; }
    }
}
