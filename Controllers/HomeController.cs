using Microsoft.AspNetCore.Mvc;
using SupportDashboard.Models;
using SupportDashboard.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SupportDashboard.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly TicketService _ticketService;
        private readonly UserService _userService;
        
        public HomeController(TicketService ticketService, UserService userService)
        {
            _ticketService = ticketService;
            _userService = userService;
        }
        
        public IActionResult Index()
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUser = _userService.GetUserById(currentUserId);
            
            var viewModel = new DashboardViewModel
            {
                Tickets = _ticketService.GetAllTickets(),
                Metrics = _ticketService.GetMetrics(),
                NovoTicket = new Ticket(),
                CurrentUser = currentUser
            };
            
            return View(viewModel);
        }
        
        [HttpPost]
        public IActionResult AdicionarTicket(Ticket ticket)
        {
            if (ModelState.IsValid)
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var currentUser = _userService.GetUserById(currentUserId);
                
                ticket.CreatedBy = currentUser?.FullName ?? "Sistema";
                _ticketService.AddTicket(ticket);
                TempData["Success"] = "Ticket adicionado com sucesso!";
                return RedirectToAction("Index");
            }
            
            var viewModel = new DashboardViewModel
            {
                Tickets = _ticketService.GetAllTickets(),
                Metrics = _ticketService.GetMetrics(),
                NovoTicket = ticket,
                CurrentUser = _userService.GetUserById(int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0"))
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
