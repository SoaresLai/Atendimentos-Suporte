using System.ComponentModel.DataAnnotations;

namespace SupportDashboard.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [Display(Name = "Nome de Usuário")]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [Display(Name = "Senha")]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [Display(Name = "Nome Completo")]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [Display(Name = "Função")]
        public UserRole Role { get; set; }
        
        [Display(Name = "Ativo")]
        public bool IsActive { get; set; } = true;
        
        [Display(Name = "Data de Criação")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        [Display(Name = "Último Login")]
        public DateTime? LastLogin { get; set; }
        
        [Display(Name = "Avatar")]
        public string? Avatar { get; set; }
        
        [Display(Name = "Email")]
        public string? Email { get; set; }
    }
    
    public enum UserRole
    {
        [Display(Name = "Técnico de Suporte")]
        Support,
        
        [Display(Name = "Supervisor/Chefe")]
        Manager
    }
}
