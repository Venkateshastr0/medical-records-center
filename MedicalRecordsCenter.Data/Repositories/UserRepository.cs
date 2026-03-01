using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly MedicalRecordsDbContext _context;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(MedicalRecordsDbContext context, ILogger<UserRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting all users for hospital: {HospitalId}", hospitalId);
                
                var users = await _context.Users
                    .Where(u => u.HospitalId == hospitalId)
                    .OrderBy(u => u.LastName)
                    .ThenBy(u => u.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} users for hospital: {HospitalId}", users.Count, hospitalId);
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<User> GetUserByIdAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Getting user by ID: {UserId}", userId);
                
                var user = await _context.Users
                    .Include(u => u.AuditLogs)
                    .FirstOrDefaultAsync(u => u.Id == userId);
                
                if (user != null)
                {
                    _logger.LogInformation("Retrieved user: {UserId} - {FullName}", userId, user.FullName);
                }
                else
                {
                    _logger.LogWarning("User not found: {UserId}", userId);
                }
                
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<User> GetUserByUsernameAsync(string username)
        {
            try
            {
                _logger.LogInformation("Getting user by username: {Username}", username);
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
                
                if (user != null)
                {
                    _logger.LogInformation("Retrieved user by username: {Username} - {FullName}", username, user.FullName);
                }
                else
                {
                    _logger.LogWarning("User not found by username: {Username}", username);
                }
                
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by username: {Username}", username);
                throw;
            }
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            try
            {
                _logger.LogInformation("Getting user by email: {Email}", email);
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
                
                if (user != null)
                {
                    _logger.LogInformation("Retrieved user by email: {Email} - {FullName}", email, user.FullName);
                }
                else
                {
                    _logger.LogWarning("User not found by email: {Email}", email);
                }
                
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by email: {Email}", email);
                throw;
            }
        }

        public async Task<IEnumerable<User>> GetUsersByRoleAsync(string role, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting users by role: {Role} for hospital: {HospitalId}", role, hospitalId);
                
                var users = await _context.Users
                    .Where(u => u.HospitalId == hospitalId && u.Role.Equals(role, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(u => u.LastName)
                    .ThenBy(u => u.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} users with role: {Role}", users.Count, role);
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users by role: {Role}", role);
                throw;
            }
        }

        public async Task<IEnumerable<User>> GetUsersByDepartmentAsync(string department, string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting users by department: {Department} for hospital: {HospitalId}", department, hospitalId);
                
                var users = await _context.Users
                    .Where(u => u.HospitalId == hospitalId && 
                               u.Department.Equals(department, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(u => u.LastName)
                    .ThenBy(u => u.FirstName)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} users in department: {Department}", users.Count, department);
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users by department: {Department}", department);
                throw;
            }
        }

        public async Task<User> CreateUserAsync(User user)
        {
            try
            {
                _logger.LogInformation("Creating new user: {Username} - {FullName}", user.Username, user.FullName);
                
                user.Id = Guid.NewGuid().ToString();
                user.CreatedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                user.IsActive = true;
                
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created user successfully: {UserId} - {Username}", user.Id, user.Username);
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user: {Username}", user.Username);
                throw;
            }
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            try
            {
                _logger.LogInformation("Updating user: {UserId} - {FullName}", user.Id, user.FullName);
                
                user.UpdatedAt = DateTime.UtcNow;
                
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated user successfully: {UserId}", user.Id);
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user: {UserId}", user.Id);
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Deleting user: {UserId}", userId);
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for deletion: {UserId}", userId);
                    return false;
                }
                
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Deleted user successfully: {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> UserExistsAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Checking if user exists: {UserId}", userId);
                
                var exists = await _context.Users.AnyAsync(u => u.Id == userId);
                
                _logger.LogInformation("User {UserId} exists: {Exists}", userId, exists);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user exists: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            try
            {
                _logger.LogInformation("Checking if username exists: {Username}", username);
                
                var exists = await _context.Users.AnyAsync(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
                
                _logger.LogInformation("Username {Username} exists: {Exists}", username, exists);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if username exists: {Username}", username);
                throw;
            }
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            try
            {
                _logger.LogInformation("Checking if email exists: {Email}", email);
                
                var exists = await _context.Users.AnyAsync(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
                
                _logger.LogInformation("Email {Email} exists: {Exists}", email, exists);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if email exists: {Email}", email);
                throw;
            }
        }

        public async Task<int> GetUserCountAsync(string hospitalId)
        {
            try
            {
                _logger.LogInformation("Getting user count for hospital: {HospitalId}", hospitalId);
                
                var count = await _context.Users
                    .CountAsync(u => u.HospitalId == hospitalId);
                
                _logger.LogInformation("User count for hospital {HospitalId}: {Count}", hospitalId, count);
                return count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user count for hospital: {HospitalId}", hospitalId);
                throw;
            }
        }

        public async Task<bool> UpdateLastLoginAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Updating last login for user: {UserId}", userId);
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for last login update: {UserId}", userId);
                    return false;
                }
                
                user.LastLogin = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated last login for user: {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating last login for user: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeactivateUserAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Deactivating user: {UserId}", userId);
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for deactivation: {UserId}", userId);
                    return false;
                }
                
                user.IsActive = false;
                user.UpdatedAt = DateTime.UtcNow;
                
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Deactivated user: {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating user: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> ActivateUserAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Activating user: {UserId}", userId);
                
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for activation: {UserId}", userId);
                    return false;
                }
                
                user.IsActive = true;
                user.UpdatedAt = DateTime.UtcNow;
                
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Activated user: {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating user: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> ValidateUserCredentialsAsync(string username, string password)
        {
            try
            {
                _logger.LogInformation("Validating user credentials for: {Username}", username);
                
                var user = await GetUserByUsernameAsync(username);
                if (user == null)
                {
                    _logger.LogWarning("User not found for credential validation: {Username}", username);
                    return false;
                }
                
                if (!user.IsActive)
                {
                    _logger.LogWarning("User is inactive: {Username}", username);
                    return false;
                }
                
                // In a real implementation, this would use proper password hashing
                // For demo purposes, we'll just check if user exists and is active
                _logger.LogInformation("User credentials validated: {Username}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating user credentials: {Username}", username);
                throw;
            }
        }

        public async Task<bool> ValidateUserDataAsync(User user)
        {
            try
            {
                _logger.LogInformation("Validating user data: {UserId}", user.Id);
                
                var validationErrors = new List<string>();
                
                if (string.IsNullOrWhiteSpace(user.Username))
                    validationErrors.Add("Username is required");
                else if (user.Username.Length < 3)
                    validationErrors.Add("Username must be at least 3 characters");
                
                if (string.IsNullOrWhiteSpace(user.Email))
                    validationErrors.Add("Email is required");
                else if (!user.Email.Contains("@"))
                    validationErrors.Add("Invalid email format");
                
                if (string.IsNullOrWhiteSpace(user.FirstName))
                    validationErrors.Add("First name is required");
                
                if (string.IsNullOrWhiteSpace(user.LastName))
                    validationErrors.Add("Last name is required");
                
                if (string.IsNullOrWhiteSpace(user.Role))
                    validationErrors.Add("Role is required");
                
                if (string.IsNullOrWhiteSpace(user.HospitalId))
                    validationErrors.Add("Hospital ID is required");
                
                if (validationErrors.Any())
                {
                    _logger.LogWarning("User validation failed: {Errors}", string.Join(", ", validationErrors));
                    return false;
                }
                
                _logger.LogInformation("User validation passed: {UserId}", user.Id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating user data: {UserId}", user.Id);
                throw;
            }
        }
    }
}
