using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class Prescription
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string PatientId { get; set; }

        [Required]
        public string DoctorId { get; set; }

        [Required]
        [StringLength(100)]
        public string MedicationName { get; set; }

        [StringLength(50)]
        public string Dosage { get; set; }

        [StringLength(200)]
        public string Frequency { get; set; }

        [StringLength(100)]
        public string Route { get; set; }

        [StringLength(500)]
        public string Instructions { get; set; }

        [StringLength(100)]
        public string Duration { get; set; }

        public DateTime PrescriptionDate { get; set; } = DateTime.UtcNow;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [StringLength(20)]
        public string Refills { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Active";

        [StringLength(500)]
        public string Notes { get; set; }

        [StringLength(100)]
        public string Pharmacy { get; set; }

        [StringLength(50)]
        public string PharmacyPhone { get; set; }

        [StringLength(100)]
        public string Diagnosis { get; set; }

        [StringLength(1000)]
        public string SideEffects { get; set; }

        [StringLength(100)]
        public string DrugInteractions { get; set; }

        [Required]
        public string HospitalId { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public string StatusDisplay => Status switch
        {
            "Active" => "✅ Active",
            "Completed" => "✅ Completed",
            "Cancelled" => "❌ Cancelled",
            "On Hold" => "⏸️ On Hold",
            "Expired" => "⏰ Expired",
            _ => Status
        };

        [NotMapped]
        public bool IsExpired => EndDate.HasValue && EndDate.Value < DateTime.Today;

        [NotMapped]
        public bool IsActive => Status == "Active" && !IsExpired;

        // Navigation properties
        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual User Doctor { get; set; }
    }
}
