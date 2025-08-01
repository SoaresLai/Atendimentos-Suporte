"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  TicketIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  XIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  Clock4Icon,
  BarChart3Icon,
  ActivityIcon,
} from "lucide-react"

// Tipos
interface Ticket {
  id: number
  title: string
  description: string
  status: "Aberto" | "Em Implementação" | "Resolvido" | "Fechado"
  priority: "Baixa" | "Média" | "Alta" | "Crítica"
  createdBy: string
  createdAt: string
  updatedAt: string
  category: string
}

interface User {
  id: number
  username: string
  name: string
  role: "Admin" | "Tecnico"
}

interface Filters {
  status: string
  priority: string
  category: string
  createdBy: string
  dateFrom: string
  dateTo: string
  search: string
}

// Dados mockados
const mockUsers: User[] = [
  { id: 1, username: "admin", name: "Administrador", role: "Admin" },
  { id: 2, username: "tecnico1", name: "Maria Santos", role: "Tecnico" },
  { id: 3, username: "tecnico2", name: "Pedro Costa", role: "Tecnico" },
  { id: 4, username: "tecnico3", name: "Ana Oliveira", role: "Tecnico" },
]

const mockTickets: Ticket[] = [
  {
    id: 1,
    title: "Sistema de login não funciona",
    description: "Usuários não conseguem fazer login no sistema",
    status: "Aberto",
    priority: "Alta",
    createdBy: "Maria Santos",
    createdAt: "2024-01-15T10:30:00",
    updatedAt: "2024-01-15T10:30:00",
    category: "Sistema",
  },
  {
    id: 2,
    title: "Erro na impressão de relatórios",
    description: "Relatórios não estão sendo gerados corretamente",
    status: "Em Implementação",
    priority: "Média",
    createdBy: "Pedro Costa",
    createdAt: "2024-01-14T14:20:00",
    updatedAt: "2024-01-15T09:15:00",
    category: "Relatórios",
  },
  {
    id: 3,
    title: "Lentidão no carregamento",
    description: "Sistema está muito lento para carregar páginas",
    status: "Resolvido",
    priority: "Média",
    createdBy: "Ana Oliveira",
    createdAt: "2024-01-13T16:45:00",
    updatedAt: "2024-01-14T11:30:00",
    category: "Performance",
  },
  {
    id: 4,
    title: "Backup automático falhou",
    description: "O backup automático não foi executado ontem",
    status: "Fechado",
    priority: "Crítica",
    createdBy: "Maria Santos",
    createdAt: "2024-01-12T08:00:00",
    updatedAt: "2024-01-13T17:20:00",
    category: "Infraestrutura",
  },
  {
    id: 5,
    title: "Usuário não consegue alterar senha",
    description: "Função de alteração de senha apresenta erro",
    status: "Aberto",
    priority: "Baixa",
    createdBy: "Pedro Costa",
    createdAt: "2024-01-16T13:15:00",
    updatedAt: "2024-01-16T13:15:00",
    category: "Sistema",
  },
  {
    id: 6,
    title: "Integração com API externa",
    description: "Implementar integração com nova API de pagamentos",
    status: "Em Implementação",
    priority: "Alta",
    createdBy: "Administrador",
    createdAt: "2024-01-10T09:30:00",
    updatedAt: "2024-01-15T16:45:00",
    category: "Desenvolvimento",
  },
  {
    id: 7,
    title: "Atualização de segurança",
    description: "Aplicar patches de segurança no servidor",
    status: "Resolvido",
    priority: "Crítica",
    createdBy: "Administrador",
    createdAt: "2024-01-11T07:20:00",
    updatedAt: "2024-01-12T14:10:00",
    category: "Segurança",
  },
]

// Simulação de autenticação
const getCurrentUser = (): User => {
  // Simula diferentes usuários para teste
  const userType = typeof window !== "undefined" ? localStorage.getItem("currentUser") || "admin" : "admin"
  return mockUsers.find((u) => u.username === userType) || mockUsers[0]
}

export default function SupportDashboard() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(mockTickets)
  const [filters, setFilters] = useState<Filters>({
    status: "",
    priority: "",
    category: "",
    createdBy: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  })
  const [editingStatus, setEditingStatus] = useState<number | null>(null)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "Média" as const,
    category: "Sistema",
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Inicializar usuário atual
  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  // Filtrar tickets baseado no usuário e filtros
  useEffect(() => {
    let filtered = tickets

    // Se for técnico, mostrar apenas seus próprios tickets
    if (currentUser.role === "Tecnico") {
      filtered = filtered.filter((ticket) => ticket.createdBy === currentUser.name)
    }

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter((ticket) => ticket.status === filters.status)
    }
    if (filters.priority) {
      filtered = filtered.filter((ticket) => ticket.priority === filters.priority)
    }
    if (filters.category) {
      filtered = filtered.filter((ticket) => ticket.category === filters.category)
    }
    if (filters.createdBy && currentUser.role === "Admin") {
      filtered = filtered.filter((ticket) => ticket.createdBy === filters.createdBy)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.createdBy.toLowerCase().includes(searchLower),
      )
    }
    if (filters.dateFrom) {
      filtered = filtered.filter((ticket) => new Date(ticket.createdAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((ticket) => new Date(ticket.createdAt) <= new Date(filters.dateTo))
    }

    setFilteredTickets(filtered)
  }, [tickets, filters, currentUser])

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "bg-red-100 text-red-800 border-red-200"
      case "Em Implementação":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Resolvido":
        return "bg-green-100 text-green-800 border-green-200"
      case "Fechado":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Crítica":
        return "bg-red-100 text-red-800 border-red-200"
      case "Alta":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Média":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Baixa":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  // Calcular estatísticas baseadas nos tickets visíveis
  const getVisibleTickets = () => {
    if (currentUser.role === "Tecnico") {
      return tickets.filter((ticket) => ticket.createdBy === currentUser.name)
    }
    return tickets
  }

  const visibleTickets = getVisibleTickets()
  const stats = {
    total: visibleTickets.length,
    abertos: visibleTickets.filter((t) => t.status === "Aberto").length,
    emAndamento: visibleTickets.filter((t) => t.status === "Em Implementação").length,
    resolvidos: visibleTickets.filter((t) => t.status === "Resolvido").length,
    fechados: visibleTickets.filter((t) => t.status === "Fechado").length,
  }

  // Handlers
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      category: "",
      createdBy: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    })
  }

  const handleStatusUpdate = (ticketId: number, newStatus: Ticket["status"]) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket,
      ),
    )
    setEditingStatus(null)
    toast.success("Status atualizado com sucesso!")
  }

  const handleDeleteTicket = (ticketId: number) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId))
    toast.success("Ticket excluído com sucesso!")
  }

  const handleCreateTicket = () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error("Título e descrição são obrigatórios!")
      return
    }

    const ticket: Ticket = {
      id: Math.max(...tickets.map((t) => t.id)) + 1,
      title: newTicket.title,
      description: newTicket.description,
      status: "Aberto",
      priority: newTicket.priority,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: newTicket.category,
    }

    setTickets((prev) => [ticket, ...prev])
    setNewTicket({ title: "", description: "", priority: "Média", category: "Sistema" })
    setIsCreateDialogOpen(false)
    toast.success("Ticket criado com sucesso!")
  }

  const switchUser = (username: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", username)
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <TicketIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Suporte</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Simulador de usuários para teste */}
              <Select value={currentUser.username} onValueChange={switchUser}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                <Badge variant={currentUser.role === "Admin" ? "default" : "secondary"}>{currentUser.role}</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentUser.role === "Admin" ? "Total Atendimentos" : "Meus Atendimentos"}
              </CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              {currentUser.role === "Tecnico" && (
                <p className="text-xs text-muted-foreground">✨ Visualizando apenas seus tickets</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertos</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.abertos}</div>
              <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Implementação</CardTitle>
              <Clock4Icon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.emAndamento}</div>
              <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolvidos}</div>
              <p className="text-xs text-muted-foreground">Aguardando validação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados</CardTitle>
              <ActivityIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.fechados}</div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FilterIcon className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Título, descrição..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Aberto">Aberto</SelectItem>
                    <SelectItem value="Em Implementação">Em Implementação</SelectItem>
                    <SelectItem value="Resolvido">Resolvido</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Relatórios">Relatórios</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros adicionais para Admin */}
            {currentUser.role === "Admin" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="createdBy">Criado Por</Label>
                  <Select value={filters.createdBy} onValueChange={(value) => handleFilterChange("createdBy", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">Data Inicial</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">Data Final</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <span className="text-sm text-gray-500">
                {filteredTickets.length} de {visibleTickets.length} tickets
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{currentUser.role === "Admin" ? "Todos os Tickets" : "Meus Tickets"}</CardTitle>
              <CardDescription>
                {currentUser.role === "Admin"
                  ? "Gerencie todos os tickets do sistema"
                  : "Visualize e gerencie seus tickets"}
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket</DialogTitle>
                  <DialogDescription>Preencha as informações do novo ticket de suporte.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Descreva brevemente o problema"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva detalhadamente o problema"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value: any) => setNewTicket((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) => setNewTicket((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sistema">Sistema</SelectItem>
                          <SelectItem value="Relatórios">Relatórios</SelectItem>
                          <SelectItem value="Performance">Performance</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                          <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                          <SelectItem value="Segurança">Segurança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTicket}>Criar Ticket</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentUser.role === "Admin" ? "Nenhum ticket encontrado" : "Você não possui tickets"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {currentUser.role === "Admin"
                    ? "Tente ajustar os filtros ou criar um novo ticket."
                    : "Crie seu primeiro ticket de suporte clicando no botão acima."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            #{ticket.id} - {ticket.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {editingStatus === ticket.id ? (
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={ticket.status}
                                  onValueChange={(value: Ticket["status"]) => handleStatusUpdate(ticket.id, value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Aberto">Aberto</SelectItem>
                                    <SelectItem value="Em Implementação">Em Implementação</SelectItem>
                                    <SelectItem value="Resolvido">Resolvido</SelectItem>
                                    <SelectItem value="Fechado">Fechado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" onClick={() => setEditingStatus(null)}>
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                                {(currentUser.role === "Admin" || ticket.createdBy === currentUser.name) && (
                                  <Button size="sm" variant="ghost" onClick={() => setEditingStatus(ticket.id)}>
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">{ticket.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {currentUser.role === "Admin" && (
                            <div className="flex items-center space-x-1">
                              <UserIcon className="h-4 w-4" />
                              <span>{ticket.createdBy}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Criado: {formatDate(ticket.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>Atualizado: {formatDate(ticket.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {currentUser.role === "Admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o ticket "#{ticket.id} - {ticket.title}"? Esta ação não
                                pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
