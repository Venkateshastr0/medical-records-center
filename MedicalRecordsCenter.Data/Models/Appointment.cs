using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class Appointment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string PatientId { get; set; }

        [Required]
        public string DoctorId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [Required]
        [StringLength(20)]
        public string StartTime { get; set; }

        [Required]
        [StringLength(20)]
        public string EndTime { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Scheduled";

        [StringLength(100)]
        public string AppointmentType { get; set; }

        [StringLength(1000)]
        public string Reason { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        [StringLength(20)]
        public string RoomNumber { get; set; }

        [StringLength(50)]
        public string Department { get; set; }

        public bool IsVirtual { get; set; } = false;

        [StringLength(500)]
        public string VirtualMeetingLink { get; set; }

        [StringLength(20)]
        public string ReminderSent { get; set; }

        public DateTime? CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        [Required]
        public string HospitalId { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public string Duration
        {
            get
            {
                if (TimeSpan.TryParse(StartTime, out TimeSpan start) && 
                    TimeSpan.TryParse(EndTime, out TimeSpan end))
                {
                    return $"{(end - start).TotalMinutes} minutes";
                }
                return "Unknown";
            }
        }

        [NotMapped]
        public string StatusDisplay => Status switch
        {
            "Scheduled" => "📅 Scheduled",
            "Confirmed" => "✅ Confirmed",
            "In Progress" => "🔄 In Progress",
            "Completed" => "✅ Completed",
            "Cancelled" => "❌ Cancelled",
            "No Show" => "❓ No Show",
            _ => Status
        };

        // Navigation properties
        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual User Doctor { get; set; }
    }
}
