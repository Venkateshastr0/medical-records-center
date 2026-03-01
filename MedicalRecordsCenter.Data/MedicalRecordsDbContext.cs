using Microsoft.EntityFrameworkCore;
using MedicalRecordsCenter.Data.Models;
using Microsoft.Extensions.Logging;

namespace MedicalRecordsCenter.Data
{
    public class MedicalRecordsDbContext : DbContext
    {
        private readonly ILogger<MedicalRecordsDbContext> _logger;

        public MedicalRecordsDbContext(DbContextOptions<MedicalRecordsDbContext> options, ILogger<MedicalRecordsDbContext> logger = null)
            : base(options)
        {
            _logger = logger;
        }

        // DbSets
        public DbSet<Patient> Patients { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<LabResult> LabResults { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // Default configuration for development
                optionsBuilder.UseSqlite("Data Source=medical_records.db");
                optionsBuilder.EnableSensitiveDataLogging(false);
                optionsBuilder.EnableServiceProviderCaching();
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Patient entity
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DateOfBirth).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Gender).HasMaxLength(20);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.BloodType).HasMaxLength(50);
                entity.Property(e => e.EmergencyContact).HasMaxLength(20);
                entity.Property(e => e.Allergies).HasMaxLength(100);
                entity.Property(e => e.MedicalHistory).HasMaxLength(1000);
                entity.Property(e => e.CurrentMedications).HasMaxLength(500);
                entity.Property(e => e.InsuranceProvider).HasMaxLength(50);
                entity.Property(e => e.InsurancePolicyNumber).HasMaxLength(50);
                entity.Property(e => e.PrimaryCarePhysician).HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.FirstName);
                entity.HasIndex(e => e.LastName);
                entity.HasIndex(e => e.DateOfBirth);
                entity.HasIndex(e => e.PhoneNumber);
                entity.HasIndex(e => e.Email);
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.Department).HasMaxLength(100);
                entity.Property(e => e.LicenseNumber).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.Role);
            });

            // Configure MedicalRecord entity
            modelBuilder.Entity<MedicalRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.PatientId).IsRequired();
                entity.Property(e => e.DoctorId).IsRequired();
                entity.Property(e => e.RecordType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ChiefComplaint).HasMaxLength(1000);
                entity.Property(e => e.HistoryOfPresentIllness).HasMaxLength(2000);
                entity.Property(e => e.PhysicalExamination).HasMaxLength(2000);
                entity.Property(e => e.Assessment).HasMaxLength(2000);
                entity.Property(e => e.Plan).HasMaxLength(2000);
                entity.Property(e => e.Diagnosis).HasMaxLength(1000);
                entity.Property(e => e.Treatment).HasMaxLength(1000);
                entity.Property(e => e.FollowUpInstructions).HasMaxLength(1000);
                entity.Property(e => e.VitalSigns).HasMaxLength(500);
                entity.Property(e => e.LabResults).HasMaxLength(1000);
                entity.Property(e => e.ImagingResults).HasMaxLength(1000);
                entity.Property(e => e.Referrals).HasMaxLength(1000);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.PatientId);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.VisitDate);
                entity.HasIndex(e => e.RecordType);

                // Foreign keys
                entity.HasOne(e => e.Patient)
                      .WithMany(p => p.MedicalRecords)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany()
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Appointment entity
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.PatientId).IsRequired();
                entity.Property(e => e.DoctorId).IsRequired();
                entity.Property(e => e.StartTime).IsRequired().HasMaxLength(20);
                entity.Property(e => e.EndTime).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Scheduled");
                entity.Property(e => e.AppointmentType).HasMaxLength(100);
                entity.Property(e => e.Reason).HasMaxLength(1000);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.RoomNumber).HasMaxLength(20);
                entity.Property(e => e.Department).HasMaxLength(50);
                entity.Property(e => e.VirtualMeetingLink).HasMaxLength(500);
                entity.Property(e => e.ReminderSent).HasMaxLength(20);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.PatientId);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.AppointmentDate);
                entity.HasIndex(e => e.Status);

                // Foreign keys
                entity.HasOne(e => e.Patient)
                      .WithMany(p => p.Appointments)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany()
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Prescription entity
            modelBuilder.Entity<Prescription>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.PatientId).IsRequired();
                entity.Property(e => e.DoctorId).IsRequired();
                entity.Property(e => e.MedicationName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Dosage).HasMaxLength(50);
                entity.Property(e => e.Frequency).HasMaxLength(200);
                entity.Property(e => e.Route).HasMaxLength(100);
                entity.Property(e => e.Instructions).HasMaxLength(500);
                entity.Property(e => e.Duration).HasMaxLength(100);
                entity.Property(e => e.Refills).HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Active");
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.Pharmacy).HasMaxLength(100);
                entity.Property(e => e.PharmacyPhone).HasMaxLength(50);
                entity.Property(e => e.Diagnosis).HasMaxLength(100);
                entity.Property(e => e.SideEffects).HasMaxLength(1000);
                entity.Property(e => e.DrugInteractions).HasMaxLength(100);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.PatientId);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.MedicationName);
                entity.HasIndex(e => e.Status);

                // Foreign keys
                entity.HasOne(e => e.Patient)
                      .WithMany(p => p.Prescriptions)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany()
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure LabResult entity
            modelBuilder.Entity<LabResult>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.PatientId).IsRequired();
                entity.Property(e => e.DoctorId).IsRequired();
                entity.Property(e => e.TestName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.TestCategory).HasMaxLength(100);
                entity.Property(e => e.TestType).HasMaxLength(100);
                entity.Property(e => e.Result).HasMaxLength(1000);
                entity.Property(e => e.Unit).HasMaxLength(100);
                entity.Property(e => e.ReferenceRange).HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.AbnormalFlag).HasMaxLength(100);
                entity.Property(e => e.Interpretation).HasMaxLength(1000);
                entity.Property(e => e.Laboratory).HasMaxLength(100);
                entity.Property(e => e.Technician).HasMaxLength(100);
                entity.Property(e => e.Pathologist).HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.Comments).HasMaxLength(1000);
                entity.Property(e => e.Urgency).IsRequired().HasMaxLength(100).HasDefaultValue("Routine");
                entity.Property(e => e.SpecimenType).HasMaxLength(100);
                entity.Property(e => e.AccessionNumber).HasMaxLength(100);
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.PatientId);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.TestName);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Urgency);

                // Foreign keys
                entity.HasOne(e => e.Patient)
                      .WithMany(p => p.LabResults)
                      .HasForeignKey(e => e.PatientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Doctor)
                      .WithMany()
                      .HasForeignKey(e => e.DoctorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure AuditLog entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.UserName).HasMaxLength(100);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityType).HasMaxLength(50);
                entity.Property(e => e.EntityId).HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.OldValues).HasMaxLength(1000);
                entity.Property(e => e.NewValues).HasMaxLength(1000);
                entity.Property(e => e.IpAddress).HasMaxLength(100);
                entity.Property(e => e.UserAgent).HasMaxLength(100);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Success");
                entity.Property(e => e.ErrorMessage).HasMaxLength(500);
                entity.Property(e => e.Severity).IsRequired().HasMaxLength(50).HasDefaultValue("Info");
                entity.Property(e => e.HospitalId).IsRequired();
                entity.Property(e => e.Timestamp).HasDefaultValueSql("datetime('now')");

                // Indexes
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.HospitalId);
                entity.HasIndex(e => e.Action);
                entity.HasIndex(e => e.EntityType);
                entity.HasIndex(e => e.Timestamp);
                entity.HasIndex(e => e.Severity);

                // Foreign keys
                entity.HasOne(e => e.User)
                      .WithMany(u => u.AuditLogs)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            _logger?.LogInformation("Database model configured successfully");
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var entries = ChangeTracker.Entries()
                    .Where(e => e.Entity is IAuditableEntity && 
                               (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted));

                foreach (var entry in entries)
                {
                    var auditableEntity = (IAuditableEntity)entry.Entity;
                    
                    if (entry.State == EntityState.Added)
                    {
                        auditableEntity.CreatedAt = DateTime.UtcNow;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        auditableEntity.UpdatedAt = DateTime.UtcNow;
                    }
                }

                var result = await base.SaveChangesAsync(cancellationToken);
                _logger?.LogInformation("Database changes saved successfully");
                return result;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error saving database changes");
                throw;
            }
        }
    }

    public interface IAuditableEntity
    {
        DateTime CreatedAt { get; set; }
        DateTime UpdatedAt { get; set; }
    }

    // Extend existing entities to implement IAuditableEntity
    public partial class Patient : IAuditableEntity { }
    public partial class User : IAuditableEntity { }
    public partial class MedicalRecord : IAuditableEntity { }
    public partial class Appointment : IAuditableEntity { }
    public partial class Prescription : IAuditableEntity { }
    public partial class LabResult : IAuditableEntity { }
}
