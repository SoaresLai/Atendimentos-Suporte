namespace SupportDashboard.Models
{
    public class UserDashboardViewModel
    {
        public User User { get; set; } = new User();
        public UserStats Stats { get; set; } = new UserStats();
        public List<Ticket> RecentTickets { get; set; } = new List<Ticket>();
        public List<Ticket> MyTickets { get; set; } = new List<Ticket>();
        public Dictionary<string, int> MonthlyActivity { get; set; } = new Dictionary<string, int>();
    }
    
    public class UserStats
    {
        public int TotalTicketsCriados { get; set; }
        public int TicketsResolvidos { get; set; }
        public int TicketsPendentes { get; set; }
        public double TaxaResolucao { get; set; }
        public int TicketsHoje { get; set; }
        public int TicketsSemana { get; set; }
        public int TicketsMes { get; set; }
        public Dictionary<Departamento, int> TicketsPorDepartamento { get; set; } = new Dictionary<Departamento, int>();
        public Dictionary<Plataforma, int> TicketsPorPlataforma { get; set; } = new Dictionary<Plataforma, int>();
    }
}
