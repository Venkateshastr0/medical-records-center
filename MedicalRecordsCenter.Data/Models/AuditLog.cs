using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalRecordsCenter.Data.Models
{
    public class AuditLog
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; }

        [StringLength(100)]
        public string UserName { get; set; }

        [Required]
        [StringLength(50)]
        public string Action { get; set; }

        [StringLength(50)]
        public string EntityType { get; set; }

        [StringLength(100)]
        public string EntityId { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [StringLength(1000)]
        public string OldValues { get; set; }

        [StringLength(1000)]
        public string NewValues { get; set; }

        [StringLength(100)]
        public string IpAddress { get; set; }

        [StringLength(100)]
        public string UserAgent { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Success";

        [StringLength(500)]
        public string ErrorMessage { get; set; }

        [StringLength(100)]
        public string Severity { get; set; } = "Info";

        [Required]
        public string HospitalId { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public string ActionDisplay => Action switch
        {
            "CREATE" => "➕ Created",
            "UPDATE" => "✏️ Updated",
            "DELETE" => "🗑️ Deleted",
            "VIEW" => "👁️ Viewed",
            "LOGIN" => "🔐 Login",
            "LOGOUT" => "🚪 Logout",
            "EXPORT" => "📤 Export",
            "PRINT" => "🖨️ Print",
            "SEARCH" => "🔍 Search",
            _ => Action
        };

        [NotMapped]
        public string StatusDisplay => Status switch
        {
            "Success" => "✅ Success",
            "Failed" => "❌ Failed",
            "Warning" => "⚠️ Warning",
            "Error" => "🚨 Error",
            _ => Status
        };

        [NotMapped]
        public string SeverityDisplay => Severity switch
        {
            "Info" => "ℹ️ Info",
            "Warning" => "⚠️ Warning",
            "Error" => "❌ Error",
            "Critical" => "🚨 Critical",
            _ => Severity
        };

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
