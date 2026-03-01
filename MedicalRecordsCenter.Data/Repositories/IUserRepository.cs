using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Data.Repositories
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllUsersAsync(string hospitalId);
        Task<User> GetUserByIdAsync(string userId);
        Task<User> GetUserByUsernameAsync(string username);
        Task<User> GetUserByEmailAsync(string email);
        Task<IEnumerable<User>> GetUsersByRoleAsync(string role, string hospitalId);
        Task<IEnumerable<User>> GetUsersByDepartmentAsync(string department, string hospitalId);
        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(string userId);
        Task<bool> UserExistsAsync(string userId);
        Task<bool> UsernameExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
        Task<int> GetUserCountAsync(string hospitalId);
        Task<bool> UpdateLastLoginAsync(string userId);
        Task<bool> DeactivateUserAsync(string userId);
        Task<bool> ActivateUserAsync(string userId);
        Task<bool> ValidateUserCredentialsAsync(string username, string password);
        Task<bool> ValidateUserDataAsync(User user);
    }
}
