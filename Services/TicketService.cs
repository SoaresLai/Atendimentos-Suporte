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
                DataCriacao = DateTime.Now.AddDays(-1),
                CreatedBy = "João Silva - Suporte"
            },
            new Ticket
            {
                Id = 2,
                Empresa = "MV2 Engenharia",
                Assunto = "UpSell e DownSell",
                Importante = true,
                Plataforma = Plataforma.INTERCOM,
                Status = StatusTicket.Resolvido,
                Departamento = Departamento.SUPORTE,
                DataCriacao = DateTime.Now.AddDays(-1),
                CreatedBy = "Maria Santos - Suporte"
            },
            new Ticket
            {
                Id = 3,
                Empresa = "Nosso Sol",
                Assunto = "Mensagem de bom dia",
                Importante = false,
                Plataforma = Plataforma.GRONERZAP,
                Status = StatusTicket.EmAndamento,
                Departamento = Departamento.SUPORTE,
                DataCriacao = DateTime.Now,
                CreatedBy = "Pedro Costa - Suporte"
            },
            new Ticket
            {
                Id = 4,
                Empresa = "Solar Tech",
                Assunto = "Configuração de automação",
                Importante = true,
                Plataforma = Plataforma.GRONERZAP,
                Status = StatusTicket.Pendente,
                Departamento = Departamento.AUTOMACOES,
                DataCriacao = DateTime.Now.AddHours(-3),
                CreatedBy = "João Silva - Suporte"
            },
            new Ticket
            {
                Id = 5,
                Empresa = "Green Energy",
                Assunto = "Problema no fluxo de vendas",
                Importante = false,
                Plataforma = Plataforma.INTERCOM,
                Status = StatusTicket.EmAndamento,
                Departamento = Departamento.FLUXOS,
                DataCriacao = DateTime.Now.AddHours(-5),
                CreatedBy = "Maria Santos - Suporte"
            }
        };
        
        public List<Ticket> GetAllTickets()
        {
            return _tickets.OrderByDescending(t => t.DataCriacao).ToList();
        }
        
        public List<Ticket> GetFilteredTickets(FilterViewModel? filter)
        {
            var query = _tickets.AsQueryable();
            
            if (filter != null)
            {
                if (!string.IsNullOrEmpty(filter.Empresa))
                {
                    query = query.Where(t => t.Empresa.Contains(filter.Empresa, StringComparison.OrdinalIgnoreCase));
                }
                
                if (filter.Plataforma.HasValue)
                {
                    query = query.Where(t => t.Plataforma == filter.Plataforma.Value);
                }
                
                if (filter.Status.HasValue)
                {
                    query = query.Where(t => t.Status == filter.Status.Value);
                }
                
                if (filter.Departamento.HasValue)
                {
                    query = query.Where(t => t.Departamento == filter.Departamento.Value);
                }
                
                if (filter.DataInicial.HasValue)
                {
                    query = query.Where(t => t.DataCriacao.Date >= filter.DataInicial.Value.Date);
                }
                
                if (filter.DataFinal.HasValue)
                {
                    query = query.Where(t => t.DataCriacao.Date <= filter.DataFinal.Value.Date);
                }
                
                if (filter.ApenasImportantes)
                {
                    query = query.Where(t => t.Importante);
                }
                
                if (!string.IsNullOrEmpty(filter.CriadoPor))
                {
                    query = query.Where(t => t.CreatedBy.Contains(filter.CriadoPor, StringComparison.OrdinalIgnoreCase));
                }
            }
            
            return query.OrderByDescending(t => t.DataCriacao).ToList();
        }
        
        public List<Ticket> GetRecentTickets(int count)
        {
            return _tickets.OrderByDescending(t => t.DataCriacao).Take(count).ToList();
        }
        
        public List<Ticket> GetTicketsByUser(string userName)
        {
            return _tickets.Where(t => t.CreatedBy == userName)
                          .OrderByDescending(t => t.DataCriacao)
                          .ToList();
        }
        
        public UserStats GetUserStats(string userName)
        {
            var userTickets = _tickets.Where(t => t.CreatedBy == userName).ToList();
            var today = DateTime.Today;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);
            
            var stats = new UserStats
            {
                TotalTicketsCriados = userTickets.Count,
                TicketsResolvidos = userTickets.Count(t => t.Status == StatusTicket.Resolvido),
                TicketsPendentes = userTickets.Count(t => t.Status != StatusTicket.Resolvido),
                TicketsHoje = userTickets.Count(t => t.DataCriacao.Date == today),
                TicketsSemana = userTickets.Count(t => t.DataCriacao.Date >= weekStart),
                TicketsMes = userTickets.Count(t => t.DataCriacao.Date >= monthStart)
            };
            
            stats.TaxaResolucao = stats.TotalTicketsCriados > 0 
                ? Math.Round((double)stats.TicketsResolvidos / stats.TotalTicketsCriados * 100, 1) 
                : 0;
            
            // Tickets por departamento
            foreach (Departamento dept in Enum.GetValues<Departamento>())
            {
                stats.TicketsPorDepartamento[dept] = userTickets.Count(t => t.Departamento == dept);
            }
            
            // Tickets por plataforma
            foreach (Plataforma plat in Enum.GetValues<Plataforma>())
            {
                stats.TicketsPorPlataforma[plat] = userTickets.Count(t => t.Plataforma == plat);
            }
            
            return stats;
        }
        
        public Dictionary<string, int> GetMonthlyActivity(string userName)
        {
            var userTickets = _tickets.Where(t => t.CreatedBy == userName).ToList();
            var monthlyActivity = new Dictionary<string, int>();
            
            for (int i = 5; i >= 0; i--)
            {
                var month = DateTime.Now.AddMonths(-i);
                var monthKey = month.ToString("MMM/yyyy");
                var count = userTickets.Count(t => t.DataCriacao.Month == month.Month && t.DataCriacao.Year == month.Year);
                monthlyActivity[monthKey] = count;
            }
            
            return monthlyActivity;
        }
        
        public List<string> GetAvailableCreators()
        {
            return _tickets.Select(t => t.CreatedBy).Distinct().OrderBy(c => c).ToList();
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
