using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class LabResult
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string PatientId { get; set; }

        [Required]
        public string DoctorId { get; set; }

        [Required]
        [StringLength(100)]
        public string TestName { get; set; }

        [StringLength(100)]
        public string TestCategory { get; set; }

        [StringLength(100)]
        public string TestType { get; set; }

        public DateTime TestDate { get; set; } = DateTime.UtcNow;

        public DateTime? ResultDate { get; set; }

        [StringLength(1000)]
        public string Result { get; set; }

        [StringLength(100)]
        public string Unit { get; set; }

        [StringLength(50)]
        public string ReferenceRange { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Pending";

        [StringLength(100)]
        public string AbnormalFlag { get; set; }

        [StringLength(1000)]
        public string Interpretation { get; set; }

        [StringLength(100)]
        public string Laboratory { get; set; }

        [StringLength(100)]
        public string Technician { get; set; }

        [StringLength(100)]
        public string Pathologist { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        [StringLength(1000)]
        public string Comments { get; set; }

        [StringLength(100)]
        public string Urgency { get; set; } = "Routine";

        [StringLength(100)]
        public string SpecimenType { get; set; }

        public DateTime? SpecimenCollectionDate { get; set; }

        [StringLength(100)]
        public string AccessionNumber { get; set; }

        [Required]
        public string HospitalId { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public string StatusDisplay => Status switch
        {
            "Pending" => "⏳ Pending",
            "In Progress" => "🔄 In Progress",
            "Completed" => "✅ Completed",
            "Abnormal" => "⚠️ Abnormal",
            "Critical" => "🚨 Critical",
            "Cancelled" => "❌ Cancelled",
            _ => Status
        };

        [NotMapped]
        public string UrgencyDisplay => Urgency switch
        {
            "Routine" => "📋 Routine",
            "Stat" => "🚨 Stat",
            "Urgent" => "⚡ Urgent",
            "Critical" => "🔥 Critical",
            _ => Urgency
        };

        [NotMapped]
        public bool IsAbnormal => !string.IsNullOrEmpty(AbnormalFlag) && 
                                 AbnormalFlag.ToLower() != "normal";

        [NotMapped]
        public bool IsCritical => Status == "Critical" || Urgency == "Critical";

        // Navigation properties
        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual User Doctor { get; set; }
    }
}
