namespace SupportDashboard.Models
{
    public class DashboardViewModel
    {
        public List<Ticket> Tickets { get; set; } = new List<Ticket>();
        public DashboardMetrics Metrics { get; set; } = new DashboardMetrics();
        public Ticket NovoTicket { get; set; } = new Ticket();
        public User? CurrentUser { get; set; }
    }
    
    public class DashboardMetrics
    {
        public int TotalAtendimentos { get; set; }
        public int Resolvidos { get; set; }
        public int NaoResolvidos { get; set; }
        public int Intercom { get; set; }
        public int GronerZap { get; set; }
        public double TaxaConclusao { get; set; }
        public int EmImplementacao { get; set; }
        public Dictionary<Departamento, int> ContadorDepartamentos { get; set; } = new Dictionary<Departamento, int>();
    }
}
