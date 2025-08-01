using System.ComponentModel.DataAnnotations;

namespace SupportDashboard.Models
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Nome de usuário é obrigatório")]
        [Display(Name = "Nome de Usuário")]
        public string Username { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Senha é obrigatória")]
        [Display(Name = "Senha")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        
        [Display(Name = "Lembrar-me")]
        public bool RememberMe { get; set; }
    }
}
