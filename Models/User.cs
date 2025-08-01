using System.ComponentModel.DataAnnotations;

namespace SupportDashboard.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Nome de usuário é obrigatório")]
        [Display(Name = "Nome de Usuário")]
        public string Username { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Senha é obrigatória")]
        [Display(Name = "Senha")]
        public string Password { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Nome completo é obrigatório")]
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
    }
    
    public enum UserRole
    {
        [Display(Name = "Técnico de Suporte")]
        Support = 1,
        
        [Display(Name = "Supervisor/Chefe")]
        Manager = 2
    }
}
