using SupportDashboard.Models;
using System.Security.Cryptography;
using System.Text;

namespace SupportDashboard.Services
{
    public class UserService
    {
        private static List<User> _users = new List<User>
        {
            new User
            {
                Id = 1,
                Username = "admin",
                Password = HashPassword("admin123"),
                FullName = "Administrador do Sistema",
                Role = UserRole.Manager,
                IsActive = true,
                CreatedAt = DateTime.Now.AddDays(-30)
            },
            new User
            {
                Id = 2,
                Username = "suporte1",
                Password = HashPassword("suporte123"),
                FullName = "João Silva - Suporte",
                Role = UserRole.Support,
                IsActive = true,
                CreatedAt = DateTime.Now.AddDays(-25)
            },
            new User
            {
                Id = 3,
                Username = "suporte2",
                Password = HashPassword("suporte123"),
                FullName = "Maria Santos - Suporte",
                Role = UserRole.Support,
                IsActive = true,
                CreatedAt = DateTime.Now.AddDays(-20)
            },
            new User
            {
                Id = 4,
                Username = "suporte3",
                Password = HashPassword("suporte123"),
                FullName = "Pedro Costa - Suporte",
                Role = UserRole.Support,
                IsActive = true,
                CreatedAt = DateTime.Now.AddDays(-15)
            }
        };
        
        public User? ValidateUser(string username, string password)
        {
            var user = _users.FirstOrDefault(u => u.Username == username && u.IsActive);
            if (user != null && VerifyPassword(password, user.Password))
            {
                user.LastLogin = DateTime.Now;
                return user;
            }
            return null;
        }
        
        public User? GetUserById(int id)
        {
            return _users.FirstOrDefault(u => u.Id == id && u.IsActive);
        }
        
        public User? GetUserByUsername(string username)
        {
            return _users.FirstOrDefault(u => u.Username == username && u.IsActive);
        }
        
        public List<User> GetAllUsers()
        {
            return _users.Where(u => u.IsActive).OrderBy(u => u.FullName).ToList();
        }
        
        public bool IsManager(User user)
        {
            return user.Role == UserRole.Manager;
        }
        
        public bool IsSupport(User user)
        {
            return user.Role == UserRole.Support;
        }
        
        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "SaltKey2024"));
                return Convert.ToBase64String(hashedBytes);
            }
        }
        
        private static bool VerifyPassword(string password, string hashedPassword)
        {
            return HashPassword(password) == hashedPassword;
        }
    }
}
