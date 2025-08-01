using System.ComponentModel.DataAnnotations;

namespace SupportDashboard.Models
{
    public class Ticket
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Nome da empresa é obrigatório")]
        [Display(Name = "Empresa")]
        public string Empresa { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Assunto é obrigatório")]
        [Display(Name = "Assunto")]
        public string Assunto { get; set; } = string.Empty;
        
        [Display(Name = "Importante")]
        public bool Importante { get; set; }
        
        [Required]
        [Display(Name = "Plataforma")]
        public Plataforma Plataforma { get; set; }
        
        [Required]
        [Display(Name = "Status")]
        public StatusTicket Status { get; set; }
        
        [Required]
        [Display(Name = "Departamento")]
        public Departamento Departamento { get; set; }
        
        [Display(Name = "Data de Criação")]
        public DateTime DataCriacao { get; set; } = DateTime.Now;
    }
    
    public enum Plataforma
    {
        INTERCOM,
        GRONERZAP
    }
    
    public enum StatusTicket
    {
        [Display(Name = "Em Andamento")]
        EmAndamento,
        Resolvido,
        Pendente
    }
    
    public enum Departamento
    {
        CRIACAO,
        PRECIFICACAO,
        FLUXOS,
        AUTOMACOES,
        REUNIAO,
        TECHLEAD,
        SUPORTE,
        ENGENHARIA
    }
}
