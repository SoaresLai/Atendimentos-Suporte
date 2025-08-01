using System.ComponentModel.DataAnnotations;

namespace SupportDashboard.Models
{
    public class FilterViewModel
    {
        [Display(Name = "Empresa")]
        public string? Empresa { get; set; }
        
        [Display(Name = "Plataforma")]
        public Plataforma? Plataforma { get; set; }
        
        [Display(Name = "Status")]
        public StatusTicket? Status { get; set; }
        
        [Display(Name = "Departamento")]
        public Departamento? Departamento { get; set; }
        
        [Display(Name = "Data Inicial")]
        [DataType(DataType.Date)]
        public DateTime? DataInicial { get; set; }
        
        [Display(Name = "Data Final")]
        [DataType(DataType.Date)]
        public DateTime? DataFinal { get; set; }
        
        [Display(Name = "Apenas Importantes")]
        public bool ApenasImportantes { get; set; }
        
        [Display(Name = "Criado por")]
        public string? CriadoPor { get; set; }
    }
}
