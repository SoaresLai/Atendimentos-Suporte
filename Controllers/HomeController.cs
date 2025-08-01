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
        
        public IActionResult Index(FilterViewModel? filter)
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUser = _userService.GetUserById(currentUserId);
            
            var tickets = _ticketService.GetFilteredTickets(filter);
            
            var viewModel = new DashboardViewModel
            {
                Tickets = tickets,
                Metrics = _ticketService.GetMetrics(),
                NovoTicket = new Ticket(),
                CurrentUser = currentUser,
                Filter = filter ?? new FilterViewModel()
            };
            
            return View(viewModel);
        }
        
        public IActionResult UserDashboard()
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUser = _userService.GetUserById(currentUserId);
            
            if (currentUser == null)
            {
                return RedirectToAction("Login", "Auth");
            }
            
            var viewModel = new UserDashboardViewModel
            {
                User = currentUser,
                Stats = _ticketService.GetUserStats(currentUser.FullName),
                RecentTickets = _ticketService.GetRecentTickets(5),
                MyTickets = _ticketService.GetTicketsByUser(currentUser.FullName),
                MonthlyActivity = _ticketService.GetMonthlyActivity(currentUser.FullName)
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
                CurrentUser = _userService.GetUserById(int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0")),
                Filter = new FilterViewModel()
            };
            
            return View("Index", viewModel);
        }
        
        [HttpGet]
        public IActionResult GetMetrics()
        {
            var metrics = _ticketService.GetMetrics();
            return Json(metrics);
        }
        
        [HttpPost]
        public IActionResult ClearFilters()
        {
            return RedirectToAction("Index");
        }
    }
}
