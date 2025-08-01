using SupportDashboard.Models;

namespace SupportDashboard.Services
{
    public class TicketService
    {
        private static List<Ticket> _tickets = new List<Ticket>
        {
            new Ticket
            {
                Id = 1,
                Empresa = "Futuro Solar",
                Assunto = "Mensagem automática fim de expediente",
                Importante = false,
                Plataforma = Plataforma.INTERCOM,
                Status = StatusTicket.Resolvido,
                Departamento = Departamento.SUPORTE,
                DataCriacao = DateTime.Now.AddDays(-1)
            },
            new Ticket
            {
                Id = 2,
                Empresa = "MV2 Engenharia",
                Assunto = "UpSell e DownSell",
                Importante = false,
                Plataforma = Plataforma.INTERCOM,
                Status = StatusTicket.Resolvido,
                Departamento = Departamento.SUPORTE,
                DataCriacao = DateTime.Now.AddDays(-1)
            },
            new Ticket
            {
                Id = 3,
                Empresa = "Nosso Sol",
                Assunto = "Mensagem de bom dia",
                Importante = false,
                Plataforma = Plataforma.GRONERZAP,
                Status = StatusTicket.Resolvido,
                Departamento = Departamento.SUPORTE,
                DataCriacao = DateTime.Now
            }
        };
        
        public List<Ticket> GetAllTickets()
        {
            return _tickets.OrderByDescending(t => t.DataCriacao).ToList();
        }
        
        public void AddTicket(Ticket ticket)
        {
            ticket.Id = _tickets.Count > 0 ? _tickets.Max(t => t.Id) + 1 : 1;
            ticket.DataCriacao = DateTime.Now;
            _tickets.Add(ticket);
        }
        
        public DashboardMetrics GetMetrics()
        {
            var metrics = new DashboardMetrics();
            
            metrics.TotalAtendimentos = _tickets.Count;
            metrics.Resolvidos = _tickets.Count(t => t.Status == StatusTicket.Resolvido);
            metrics.NaoResolvidos = _tickets.Count(t => t.Status != StatusTicket.Resolvido);
            metrics.Intercom = _tickets.Count(t => t.Plataforma == Plataforma.INTERCOM);
            metrics.GronerZap = _tickets.Count(t => t.Plataforma == Plataforma.GRONERZAP);
            metrics.TaxaConclusao = metrics.TotalAtendimentos > 0 
                ? Math.Round((double)metrics.Resolvidos / metrics.TotalAtendimentos * 100, 1) 
                : 0;
            metrics.EmImplementacao = _tickets.Count(t => t.Status == StatusTicket.EmAndamento);
            
            // Contador por departamento
            foreach (Departamento dept in Enum.GetValues<Departamento>())
            {
                metrics.ContadorDepartamentos[dept] = _tickets.Count(t => t.Departamento == dept);
            }
            
            return metrics;
        }
    }
}
