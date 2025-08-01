using Microsoft.AspNetCore.Mvc;
using SupportDashboard.Models;
using SupportDashboard.Services;

namespace SupportDashboard.Controllers
{
    public class HomeController : Controller
    {
        private readonly TicketService _ticketService;
        
        public HomeController(TicketService ticketService)
        {
            _ticketService = ticketService;
        }
        
        public IActionResult Index()
        {
            var viewModel = new DashboardViewModel
            {
                Tickets = _ticketService.GetAllTickets(),
                Metrics = _ticketService.GetMetrics(),
                NovoTicket = new Ticket()
            };
            
            return View(viewModel);
        }
        
        [HttpPost]
        public IActionResult AdicionarTicket(Ticket ticket)
        {
            if (ModelState.IsValid)
            {
                _ticketService.AddTicket(ticket);
                TempData["Success"] = "Ticket adicionado com sucesso!";
                return RedirectToAction("Index");
            }
            
            var viewModel = new DashboardViewModel
            {
                Tickets = _ticketService.GetAllTickets(),
                Metrics = _ticketService.GetMetrics(),
                NovoTicket = ticket
            };
            
            return View("Index", viewModel);
        }
        
        [HttpGet]
        public IActionResult GetMetrics()
        {
            var metrics = _ticketService.GetMetrics();
            return Json(metrics);
        }
    }
}
