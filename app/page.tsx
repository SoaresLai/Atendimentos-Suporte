"use client"

import type React from "react"
import { useState, useEffect } from "react"

// Função utilitária para classes CSS
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

// Tipos
interface User {
  id: number
  username: string
  name: string
  role: "Supervisor" | "Tecnico"
  department: string
}

interface Ticket {
  id: number
  empresa: string
  plataforma: "INTERCOM" | "GRONERZAP"
  departamento: string
  descricao: string
  status: "Em Andamento" | "Resolvido" | "Pendente"
  emImplementacao: boolean
  criadoPor: string
  criadoEm: string
}

interface UserStats {
  totalTickets: number
  resolvidos: number
  pendentes: number
  emAndamento: number
  emImplementacao: number
  ticketsRecentes: Ticket[]
  atividadeMensal: { mes: string; tickets: number }[]
  porPlataforma: { plataforma: string; count: number }[]
  porDepartamento: { departamento: string; count: number }[]
}

// Dados mockados
const mockUsers: User[] = [
  { id: 1, username: "admin", name: "João Silva", role: "Supervisor", department: "Geral" },
  { id: 2, username: "tecnico1", name: "Maria Santos", role: "Tecnico", department: "Criação" },
  { id: 3, username: "tecnico2", name: "Pedro Costa", role: "Tecnico", department: "Precificação" },
  { id: 4, username: "tecnico3", name: "Ana Oliveira", role: "Tecnico", department: "Fluxos" },
]

const mockTickets: Ticket[] = [
  {
    id: 1,
    empresa: "Tech Solutions Ltda",
    plataforma: "INTERCOM",
    departamento: "Criação",
    descricao: "Problema com integração de API",
    status: "Em Andamento",
    emImplementacao: true,
    criadoPor: "Maria Santos",
    criadoEm: "2024-01-15T10:30:00",
  },
  {
    id: 2,
    empresa: "Inovação Digital",
    plataforma: "GRONERZAP",
    departamento: "Precificação",
    descricao: "Erro no cálculo de preços",
    status: "Resolvido",
    emImplementacao: false,
    criadoPor: "Pedro Costa",
    criadoEm: "2024-01-14T14:20:00",
  },
  {
    id: 3,
    empresa: "StartUp ABC",
    plataforma: "INTERCOM",
    departamento: "Fluxos",
    descricao: "Configuração de workflow",
    status: "Pendente",
    emImplementacao: true,
    criadoPor: "Ana Oliveira",
    criadoEm: "2024-01-13T09:15:00",
  },
  {
    id: 4,
    empresa: "Empresa XYZ",
    plataforma: "GRONERZAP",
    departamento: "Criação",
    descricao: "Customização de template",
    status: "Em Andamento",
    emImplementacao: false,
    criadoPor: "Maria Santos",
    criadoEm: "2024-01-12T16:45:00",
  },
  {
    id: 5,
    empresa: "Global Corp",
    plataforma: "INTERCOM",
    departamento: "Precificação",
    descricao: "Integração com sistema de pagamento",
    status: "Resolvido",
    emImplementacao: true,
    criadoPor: "Pedro Costa",
    criadoEm: "2024-01-11T11:30:00",
  },
]

const departamentos = [
  "Criação",
  "Precificação",
  "Fluxos",
  "Automações",
  "Reunião",
  "TechLead",
  "Suporte",
  "Engenharia",
]

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(mockTickets)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Estados do formulário de login
  const [loginForm, setLoginForm] = useState({ username: "", password: "", remember: false })
  const [loginError, setLoginError] = useState("")

  // Estados dos filtros
  const [filters, setFilters] = useState({
    empresa: "",
    plataforma: "",
    status: "",
    departamento: "",
    dataInicial: "",
    dataFinal: "",
    criadoPor: "",
    apenasEmImplementacao: false,
  })

  // Estados do formulário de novo ticket
  const [newTicket, setNewTicket] = useState({
    empresa: "",
    plataforma: "INTERCOM" as "INTERCOM" | "GRONERZAP",
    departamento: "",
    descricao: "",
    emImplementacao: false,
  })

  // Verificar login salvo
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      setIsLoggedIn(true)
      setActiveTab(user.role === "Supervisor" ? "tickets" : "novo")
    }
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let filtered = tickets

    if (filters.empresa) {
      filtered = filtered.filter((ticket) => ticket.empresa.toLowerCase().includes(filters.empresa.toLowerCase()))
    }

    if (filters.plataforma) {
      filtered = filtered.filter((ticket) => ticket.plataforma === filters.plataforma)
    }

    if (filters.status) {
      filtered = filtered.filter((ticket) => ticket.status === filters.status)
    }

    if (filters.departamento) {
      filtered = filtered.filter((ticket) => ticket.departamento === filters.departamento)
    }

    if (filters.criadoPor) {
      filtered = filtered.filter((ticket) => ticket.criadoPor.toLowerCase().includes(filters.criadoPor.toLowerCase()))
    }

    if (filters.apenasEmImplementacao) {
      filtered = filtered.filter((ticket) => ticket.emImplementacao)
    }

    if (filters.dataInicial) {
      filtered = filtered.filter((ticket) => new Date(ticket.criadoEm) >= new Date(filters.dataInicial))
    }

    if (filters.dataFinal) {
      filtered = filtered.filter((ticket) => new Date(ticket.criadoEm) <= new Date(filters.dataFinal))
    }

    setFilteredTickets(filtered)
  }, [filters, tickets])

  // Carregar estatísticas do usuário
  const loadUserStats = async () => {
    if (!currentUser) return

    setLoadingStats(true)

    // Simular carregamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userTickets = tickets.filter((ticket) => ticket.criadoPor === currentUser.name)

    const stats: UserStats = {
      totalTickets: userTickets.length,
      resolvidos: userTickets.filter((t) => t.status === "Resolvido").length,
      pendentes: userTickets.filter((t) => t.status === "Pendente").length,
      emAndamento: userTickets.filter((t) => t.status === "Em Andamento").length,
      emImplementacao: userTickets.filter((t) => t.emImplementacao).length,
      ticketsRecentes: userTickets.slice(0, 5),
      atividadeMensal: [
        { mes: "Ago", tickets: 12 },
        { mes: "Set", tickets: 19 },
        { mes: "Out", tickets: 15 },
        { mes: "Nov", tickets: 22 },
        { mes: "Dez", tickets: 18 },
        { mes: "Jan", tickets: userTickets.length },
      ],
      porPlataforma: [
        { plataforma: "INTERCOM", count: userTickets.filter((t) => t.plataforma === "INTERCOM").length },
        { plataforma: "GRONERZAP", count: userTickets.filter((t) => t.plataforma === "GRONERZAP").length },
      ],
      porDepartamento: departamentos
        .map((dep) => ({
          departamento: dep,
          count: userTickets.filter((t) => t.departamento === dep).length,
        }))
        .filter((item) => item.count > 0),
    }

    setUserStats(stats)
    setLoadingStats(false)
  }

  // Função de login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    const user = mockUsers.find((u) => u.username === loginForm.username)

    if (!user || loginForm.password !== "123456") {
      setLoginError("Usuário ou senha incorretos")
      return
    }

    setCurrentUser(user)
    setIsLoggedIn(true)
    setActiveTab(user.role === "Supervisor" ? "tickets" : "novo")

    if (loginForm.remember) {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
  }

  // Função de logout
  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    setActiveTab("")
    localStorage.removeItem("currentUser")
  }

  // Função para criar novo ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    const ticket: Ticket = {
      id: tickets.length + 1,
      empresa: newTicket.empresa,
      plataforma: newTicket.plataforma,
      departamento: newTicket.departamento,
      descricao: newTicket.descricao,
      status: "Em Andamento",
      emImplementacao: newTicket.emImplementacao,
      criadoPor: currentUser.name,
      criadoEm: new Date().toISOString(),
    }

    setTickets([ticket, ...tickets])
    setNewTicket({
      empresa: "",
      plataforma: "INTERCOM",
      departamento: "",
      descricao: "",
      emImplementacao: false,
    })

    alert("Ticket criado com sucesso!")
  }

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      empresa: "",
      plataforma: "",
      status: "",
      departamento: "",
      dataInicial: "",
      dataFinal: "",
      criadoPor: "",
      apenasEmImplementacao: false,
    })
  }

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolvido":
        return "bg-green-100 text-green-800"
      case "Em Andamento":
        return "bg-blue-100 text-blue-800"
      case "Pendente":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Função para obter emoji do departamento
  const getDepartmentEmoji = (dept: string) => {
    const emojis: { [key: string]: string } = {
      Criação: "🎨",
      Precificação: "💰",
      Fluxos: "🔄",
      Automações: "🤖",
      Reunião: "🤝",
      TechLead: "👨‍💻",
      Suporte: "🛠️",
      Engenharia: "⚙️",
    }
    return emojis[dept] || "📋"
  }

  // Cálculos das métricas gerais
  const totalAtendimentos = filteredTickets.length
  const resolvidos = filteredTickets.filter((t) => t.status === "Resolvido").length
  const naoResolvidos = filteredTickets.filter((t) => t.status !== "Resolvido").length
  const intercom = filteredTickets.filter((t) => t.plataforma === "INTERCOM").length
  const gronerzap = filteredTickets.filter((t) => t.plataforma === "GRONERZAP").length
  const conclusaoPercent = totalAtendimentos > 0 ? Math.round((resolvidos / totalAtendimentos) * 100) : 0
  const emImplementacao = filteredTickets.filter((t) => t.emImplementacao).length

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Suporte</h1>
            <p className="text-gray-600">Faça login para acessar o dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">👤 Usuário</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Senha</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={loginForm.remember}
                onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Lembrar-me
              </label>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">❌ {loginError}</div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-medium"
            >
              🚀 Entrar
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              🧪 <strong>Credenciais de teste:</strong>
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                👑 <strong>Supervisor:</strong> admin / 123456
              </div>
              <div>
                🛠️ <strong>Técnico:</strong> tecnico1 / 123456
              </div>
              <div>
                🛠️ <strong>Técnico:</strong> tecnico2 / 123456
              </div>
              <div>
                🛠️ <strong>Técnico:</strong> tecnico3 / 123456
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Sistema de Acompanhamento - Suporte</h1>
                <p className="text-sm text-gray-600">Gerencie tickets e acompanhe métricas em tempo real</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {currentUser?.role === "Supervisor" ? "👑" : "🛠️"} {currentUser?.name}
                </p>
                <p className="text-xs text-gray-600">
                  {currentUser?.role} - {currentUser?.department}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard de Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Atendimentos</p>
                <p className="text-3xl font-bold text-gray-800">{totalAtendimentos}</p>
                {filteredTickets.length !== tickets.length && (
                  <p className="text-xs text-gray-500">{tickets.length} total</p>
                )}
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                <p className="text-3xl font-bold text-green-600">{resolvidos}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Resolvidos</p>
                <p className="text-3xl font-bold text-red-600">{naoResolvidos}</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-emerald-600">{conclusaoPercent}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${conclusaoPercent}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </div>
        </div>

        {/* Balanços por Plataforma */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>💬</span> Intercom
            </h3>
            <div className="text-3xl font-bold text-blue-600">{intercom}</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>📱</span> GronerZap
            </h3>
            <div className="text-3xl font-bold text-green-600">{gronerzap}</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>⚙️</span> Em Implementação
            </h3>
            <div className="text-3xl font-bold text-orange-600">{emImplementacao}</div>
          </div>
        </div>

        {/* Departamentos */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏢</span> Distribuição por Departamento
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departamentos.map((dept) => {
              const count = filteredTickets.filter((t) => t.departamento === dept).length
              return (
                <div key={dept} className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-600 flex items-center justify-center gap-1">
                    <span>{getDepartmentEmoji(dept)}</span>
                    {dept}
                  </div>
                  <div className="text-2xl font-bold mt-1">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {currentUser?.role === "Tecnico" && (
                <button
                  onClick={() => setActiveTab("novo")}
                  className={cn(
                    "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "novo"
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  )}
                >
                  ➕ Novo Ticket
                </button>
              )}

              <button
                onClick={() => setActiveTab("tickets")}
                className={cn(
                  "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                  activeTab === "tickets"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                📋 Lista de Tickets
                <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                  {filteredTickets.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("dashboard")
                  loadUserStats()
                }}
                className={cn(
                  "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                  activeTab === "dashboard"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                📊 Meu Dashboard
              </button>

              {currentUser?.role === "Supervisor" && (
                <button
                  onClick={() => setActiveTab("usuarios")}
                  className={cn(
                    "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "usuarios"
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  )}
                >
                  👥 Usuários
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {mockUsers.length}
                  </span>
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Novo Ticket */}
            {activeTab === "novo" && currentUser?.role === "Tecnico" && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">➕ Criar Novo Ticket</h2>

                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Empresa</label>
                      <input
                        type="text"
                        value={newTicket.empresa}
                        onChange={(e) => setNewTicket({ ...newTicket, empresa: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Nome da empresa"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">💬 Plataforma</label>
                      <select
                        value={newTicket.plataforma}
                        onChange={(e) =>
                          setNewTicket({ ...newTicket, plataforma: e.target.value as "INTERCOM" | "GRONERZAP" })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="INTERCOM">💬 INTERCOM</option>
                        <option value="GRONERZAP">📱 GRONERZAP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Departamento</label>
                      <select
                        value={newTicket.departamento}
                        onChange={(e) => setNewTicket({ ...newTicket, departamento: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione um departamento</option>
                        {departamentos.map((dept) => (
                          <option key={dept} value={dept}>
                            {getDepartmentEmoji(dept)} {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emImplementacao"
                        checked={newTicket.emImplementacao}
                        onChange={(e) => setNewTicket({ ...newTicket, emImplementacao: e.target.checked })}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emImplementacao" className="ml-2 block text-sm text-gray-700">
                        ⚙️ Marcar como em implementação
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📝 Descrição do Problema</label>
                    <textarea
                      value={newTicket.descricao}
                      onChange={(e) => setNewTicket({ ...newTicket, descricao: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Descreva detalhadamente o problema ou solicitação..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-medium"
                  >
                    ✅ Criar Ticket
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Lista de Tickets */}
            {activeTab === "tickets" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">📋 Lista de Tickets</h2>
                  <div className="text-sm text-gray-600">
                    Mostrando {filteredTickets.length} de {tickets.length} tickets
                  </div>
                </div>

                {/* Filtros */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtros</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Empresa</label>
                      <input
                        type="text"
                        value={filters.empresa}
                        onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="Buscar empresa..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">💬 Plataforma</label>
                      <select
                        value={filters.plataforma}
                        onChange={(e) => setFilters({ ...filters, plataforma: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      >
                        <option value="">Todas</option>
                        <option value="INTERCOM">💬 INTERCOM</option>
                        <option value="GRONERZAP">📱 GRONERZAP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📊 Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      >
                        <option value="">Todos</option>
                        <option value="Em Andamento">🔄 Em Andamento</option>
                        <option value="Resolvido">✅ Resolvido</option>
                        <option value="Pendente">⏳ Pendente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Departamento</label>
                      <select
                        value={filters.departamento}
                        onChange={(e) => setFilters({ ...filters, departamento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      >
                        <option value="">Todos</option>
                        {departamentos.map((dept) => (
                          <option key={dept} value={dept}>
                            {getDepartmentEmoji(dept)} {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Data Inicial</label>
                      <input
                        type="date"
                        value={filters.dataInicial}
                        onChange={(e) => setFilters({ ...filters, dataInicial: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Data Final</label>
                      <input
                        type="date"
                        value={filters.dataFinal}
                        onChange={(e) => setFilters({ ...filters, dataFinal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">👤 Criado Por</label>
                      <input
                        type="text"
                        value={filters.criadoPor}
                        onChange={(e) => setFilters({ ...filters, criadoPor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="Nome do usuário..."
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.apenasEmImplementacao}
                          onChange={(e) => setFilters({ ...filters, apenasEmImplementacao: e.target.checked })}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">⚙️ Apenas Em Implementação</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={clearFilters}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
                  >
                    ❌ Limpar Filtros
                  </button>
                </div>

                {/* Lista de Tickets */}
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">🏢 {ticket.empresa}</h3>
                            {ticket.emImplementacao && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                                ⚙️ Em Implementação
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{ticket.descricao}</p>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ticket.plataforma === "INTERCOM" ? "💬" : "📱"} {ticket.plataforma}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {getDepartmentEmoji(ticket.departamento)} {ticket.departamento}
                            </span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">👤 {ticket.criadoPor}</span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              📅 {new Date(ticket.criadoEm).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={cn("px-3 py-1 rounded-full text-sm font-medium", getStatusColor(ticket.status))}
                          >
                            {ticket.status === "Resolvido" && "✅"}
                            {ticket.status === "Em Andamento" && "🔄"}
                            {ticket.status === "Pendente" && "⏳"} {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTickets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum ticket encontrado</h3>
                      <p className="text-gray-600">Tente ajustar os filtros para encontrar tickets.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Dashboard do Usuário */}
            {activeTab === "dashboard" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard Pessoal - {currentUser?.name}</h2>
                  <button
                    onClick={loadUserStats}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    🔄 Atualizar
                  </button>
                </div>

                {loadingStats ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    <span className="ml-3 text-gray-600">Carregando estatísticas...</span>
                  </div>
                ) : userStats ? (
                  <div className="space-y-6">
                    {/* Cards de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total de Tickets</p>
                            <p className="text-3xl font-bold text-gray-800">{userStats.totalTickets}</p>
                          </div>
                          <div className="text-3xl">📋</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                            <p className="text-3xl font-bold text-green-600">{userStats.resolvidos}</p>
                          </div>
                          <div className="text-3xl">✅</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                            <p className="text-3xl font-bold text-blue-600">{userStats.emAndamento}</p>
                          </div>
                          <div className="text-3xl">🔄</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Pendentes</p>
                            <p className="text-3xl font-bold text-yellow-600">{userStats.pendentes}</p>
                          </div>
                          <div className="text-3xl">⏳</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Em Implementação</p>
                            <p className="text-3xl font-bold text-orange-600">{userStats.emImplementacao}</p>
                          </div>
                          <div className="text-3xl">⚙️</div>
                        </div>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Atividade Mensal */}
                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Atividade Mensal</h3>
                        <div className="space-y-3">
                          {userStats.atividadeMensal.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{item.mes}</span>
                              <div className="flex items-center space-x-2 flex-1 mx-4">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${(item.tickets / Math.max(...userStats.atividadeMensal.map((i) => i.tickets))) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-800">{item.tickets}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Por Plataforma */}
                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 Por Plataforma</h3>
                        <div className="space-y-4">
                          {userStats.porPlataforma.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{item.plataforma === "INTERCOM" ? "💬" : "📱"}</span>
                                <span className="text-sm text-gray-600">{item.plataforma}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${userStats.totalTickets > 0 ? (item.count / userStats.totalTickets) * 100 : 0}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-800 w-8 text-right">{item.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Por Departamento */}
                    {userStats.porDepartamento.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Por Departamento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {userStats.porDepartamento.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getDepartmentEmoji(item.departamento)}</span>
                                <span className="text-sm text-gray-600">{item.departamento}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-800 bg-white px-2 py-1 rounded">
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tickets Recentes */}
                    {userStats.ticketsRecentes.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🕒 Tickets Recentes</h3>
                        <div className="space-y-3">
                          {userStats.ticketsRecentes.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-800">🏢 {ticket.empresa}</span>
                                  {ticket.emImplementacao && <span className="text-orange-500">⚙️</span>}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{ticket.descricao}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <span
                                  className={cn("px-2 py-1 rounded text-xs font-medium", getStatusColor(ticket.status))}
                                >
                                  {ticket.status === "Resolvido" && "✅"}
                                  {ticket.status === "Em Andamento" && "🔄"}
                                  {ticket.status === "Pendente" && "⏳"} {ticket.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(ticket.criadoEm).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Dashboard Personalizado</h3>
                    <p className="text-gray-600 mb-4">Clique em "Atualizar" para carregar suas estatísticas.</p>
                    <button
                      onClick={loadUserStats}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      📊 Carregar Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Usuários (apenas para Supervisor) */}
            {activeTab === "usuarios" && currentUser?.role === "Supervisor" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 Gerenciar Usuários</h2>

                <div className="bg-white rounded-lg shadow-md border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Lista de Usuários</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {mockUsers.map((user) => (
                      <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{user.role === "Supervisor" ? "👑" : "🛠️"}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">{user.name}</h4>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                user.role === "Supervisor"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800",
                              )}
                            >
                              {user.role === "Supervisor" ? "👑 Supervisor" : "🛠️ Técnico"}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{user.department}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {tickets.filter((t) => t.criadoPor === user.name).length} tickets
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                    ➕ Adicionar Usuário
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
