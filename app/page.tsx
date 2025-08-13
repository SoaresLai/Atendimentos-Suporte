"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { userService, ticketService } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface User {
  id: number
  username: string
  name: string
  role: "Supervisor" | "Tecnico"
  department: string
  avatar?: string
  email?: string
}

//Sistema de token
interface AuthToken {
  token: string
  user: User
  expiresAt: number
}

//Gerenciamento de token
const TOKEN_KEY = "auth_token"
const TOKEN_EXPIRY_HOURS = 24

const genereteToken = (user: User): AuthToken => {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  const token = btoa(JSON.stringify({ user, expiresAt }))
  return { token, user, expiresAt }
}

const saveToken = (authToken: AuthToken) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(authToken))
}

const getToken = (): AuthToken | null => {
  try {
    const tokenData = localStorage.getItem(TOKEN_KEY)
    if (!tokenData) return null

    const authToken: AuthToken = JSON.parse(tokenData)

    //Verifica se o token expirou
    if (Date.now() > authToken.expiresAt) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }

    return authToken
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

const isTokenValid = (): boolean => {
  const token = getToken()
  return token !== null
}

// Função utilitária para classes CSS
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

interface Ticket {
  id: number
  ticket_id: string
  empresa: string
  plataforma: "INTERCOM" | "GRONERZAP"
  departamento: string
  descricao: string
  status: "Em Andamento" | "Resolvido" | "Pendente"
  status_atendimento: "Criado" | "Em Atendimento" | "Finalizado"
  em_implementacao: boolean
  criado_por: string
  criado_em: string
  atualizado_em?: string
  atualizado_por?: string
  iniciado_em?: string
  finalizado_em?: string
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

// Função para calcular atividade mensal real
const calculateMonthlyActivity = (tickets: Ticket[]): { mes: string; tickets: number }[] => {
  const monthlyData: { [key: string]: number } = {}

  // Inicializar os últimos 6 meses com 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    monthlyData[monthKey] = 0
  }

  // Contar tickets por mês
  tickets.forEach((ticket) => {
    const ticketDate = new Date(ticket.criado_em)
    const monthKey = ticketDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

    // Só contar se estiver nos últimos 6 meses
    if (monthlyData.hasOwnProperty(monthKey)) {
      monthlyData[monthKey]++
    }
  })

  // Converter para array ordenado
  return Object.entries(monthlyData).map(([mes, tickets]) => ({
    mes,
    tickets,
  }))
}

// Componente para renderizar mensagens em blocos
const MessageBlock = ({ message, isSystem = false }: { message: string; isSystem?: boolean }) => {
  return (
    <div className={`message-block ${isSystem ? "system-message" : "user-message"}`}>
      <div className="message-content">
        {message.split("\n").map((line, index) => (
          <div key={index} className="message-line">
            {line || <br />}
          </div>
        ))}
      </div>
      <div className="message-timestamp">
        {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  )
}

// Componente para exibir descrição como mensagens
const DescriptionMessages = ({ description }: { description: string }) => {
  const messages = description.split("\n\n---\n\n")

  return (
    <div className="messages-container">
      {messages.map((message, index) => (
        <MessageBlock
          key={index}
          message={message.trim()}
          isSystem={index === 0 || message.includes("✅ Seu atendimento")}
        />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

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
    status: "Em Andamento" as "Em Andamento" | "Resolvido" | "Pendente",
  })

  // Estados para edição e filtros
  const [editingTicket, setEditingTicket] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState<"Em Andamento" | "Resolvido" | "Pendente">("Em Andamento")
  const [selectedUserFilter, setSelectedUserFilter] = useState("")

  // Estados para edição de descrição
  const [editingDescription, setEditingDescription] = useState<number | null>(null)
  const [editDescriptionText, setEditDescriptionText] = useState("")

  // Estados para adicionar usuário
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "Tecnico" as "Supervisor" | "Tecnico",
    department: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [addUserError, setAddUserError] = useState("")

  // Estados para editar usuário
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    name: "",
    role: "Tecnico" as "Supervisor" | "Tecnico",
    department: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [editUserError, setEditUserError] = useState("")

  // Estados do perfil
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Estados para esconder/mostrar abas
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([])
  const [showHeaderInfo, setShowHeaderInfo] = useState(false)

  // Estados para atualização automática
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Funções do perfil
  const openProfileModal = () => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setAvatarPreview(currentUser.avatar || "")
      setShowProfileModal(true)
      setProfileError("")
      setProfileSuccess("")
    }
  }

  const closeProfileModal = () => {
    setShowProfileModal(false)
    setProfileForm({
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setAvatarFile(null)
    setAvatarPreview("")
    setProfileError("")
    setProfileSuccess("")
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileSuccess("")

    if (!currentUser) return

    try {
      setLoading(true)

      // Upload de avatar se houver (só funciona se a coluna existir)
      let avatarUrl = currentUser.avatar
      if (avatarFile) {
        try {
          setUploadingAvatar(true)
          avatarUrl = await userService.uploadAvatar(currentUser.id, avatarFile)
          setUploadingAvatar(false)
        } catch (error) {
          console.warn("Avatar upload não disponível ainda:", error)
          setUploadingAvatar(false)
        }
      }

      // Atualizar perfil (só campos que existem)
      try {
        const updatedUser = await userService.updateProfile(currentUser.id, {
          name: profileForm.name,
          email: profileForm.email,
          avatar: avatarUrl,
        })

        // Atualizar usuário atual
        const newUser = {
          ...currentUser,
          name: updatedUser.name,
          email: updatedUser.email || currentUser.email,
          avatar: updatedUser.avatar || currentUser.avatar,
        }

        setCurrentUser(newUser)

        // Atualizar token no localStorage
        const authToken = getToken()
        if (authToken) {
          const newAuthToken = { ...authToken, user: newUser }
          saveToken(newAuthToken)
        }

        setProfileSuccess("Perfil atualizado com sucesso!")
      } catch (error) {
        // Se as colunas não existem, atualizar apenas o nome
        console.warn("Algumas funcionalidades de perfil não estão disponíveis ainda")
        setProfileSuccess("Nome atualizado! Execute os scripts SQL para funcionalidades completas.")
      }

      // Fechar modal após 2 segundos
      setTimeout(() => {
        closeProfileModal()
      }, 2000)
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setProfileError("Erro ao atualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileSuccess("")

    if (!currentUser) return

    // Validações
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setProfileError("As senhas não coincidem")
      return
    }

    if (profileForm.newPassword.length < 6) {
      setProfileError("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      setLoading(true)

      await userService.changePassword(currentUser.id, profileForm.currentPassword, profileForm.newPassword)

      setProfileSuccess("Senha alterada com sucesso!")

      // Limpar campos de senha
      setProfileForm({
        ...profileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      setProfileError(error instanceof Error ? error.message : "Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  // Verificar login salvo
  useEffect(() => {
    const authToken = getToken()

    if (authToken) {
      setCurrentUser(authToken.user)
      setIsLoggedIn(true)
      setActiveTab(authToken.user.role === "Supervisor" ? "tickets" : "novo")
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      const checkTokenInterval = setInterval(() => {
        if (!isTokenValid()) {
          handleLogout()
        }
      }, 60000)

      return () => clearInterval(checkTokenInterval)
    }
  }, [isLoggedIn])

  // Carregar dados iniciais
  useEffect(() => {
    if (isLoggedIn) {
      loadTickets()
      loadUsers()
    }
  }, [isLoggedIn])

  // Carregar tickets
  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await ticketService.getAllTickets()
      setTickets(data)
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
      toast({ description: "Erro ao carregar tickets", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Carregar usuários
  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  // Função para adicionar novo usuário
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddUserError("")

    // Validações
    if (newUser.password !== newUser.confirmPassword) {
      setAddUserError("As senhas não coincidem")
      return
    }

    if (newUser.password.length < 6) {
      setAddUserError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      const usernameExists = await userService.checkUsernameExists(newUser.username)
      if (usernameExists) {
        setAddUserError("Nome de usuário já existe")
        return
      }

      await userService.createUser({
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        email: newUser.email || undefined,
        password: newUser.password,
      })

      // Recarregar lista de usuários
      await loadUsers()

      // Limpar formulário e fechar modal
      setNewUser({
        username: "",
        name: "",
        role: "Tecnico",
        department: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      setShowAddUserModal(false)
      toast({ description: "Usuário adicionado com sucesso!" })
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error)
      setAddUserError("Erro ao adicionar usuário")
    }
  }

  // Função para fechar modal de adicionar
  const closeAddUserModal = () => {
    setShowAddUserModal(false)
    setAddUserError("")
    setNewUser({
      username: "",
      name: "",
      role: "Tecnico",
      department: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  }

  // Função para abrir modal de edição
  const openEditUserModal = async (user: User) => {
    try {
      // Buscar dados completos do usuário
      const fullUser = await userService.getUserById(user.id)
      setEditingUser(fullUser)
      setEditUserForm({
        username: fullUser.username,
        name: fullUser.name,
        role: fullUser.role,
        department: fullUser.department,
        email: fullUser.email || "",
        password: "",
        confirmPassword: "",
      })
      setShowEditUserModal(true)
      setEditUserError("")
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      toast({ description: "Erro ao carregar dados do usuário", variant: "destructive" })
    }
  }

  // Função para fechar modal de edição
  const closeEditUserModal = () => {
    setShowEditUserModal(false)
    setEditingUser(null)
    setEditUserForm({
      username: "",
      name: "",
      role: "Tecnico",
      department: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    setEditUserError("")
  }

  // Função para editar usuário
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditUserError("")

    if (!editingUser) return

    // Validações
    if (editUserForm.password && editUserForm.password !== editUserForm.confirmPassword) {
      setEditUserError("As senhas não coincidem")
      return
    }

    if (editUserForm.password && editUserForm.password.length < 6) {
      setEditUserError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      // Verificar se o username já existe (excluindo o usuário atual)
      if (editUserForm.username !== editingUser.username) {
        const usernameExists = await userService.checkUsernameExists(editUserForm.username, editingUser.id)
        if (usernameExists) {
          setEditUserError("Nome de usuário já existe")
          return
        }
      }

      const updateData: any = {
        username: editUserForm.username,
        name: editUserForm.name,
        role: editUserForm.role,
        department: editUserForm.department,
        email: editUserForm.email || undefined,
      }

      if (editUserForm.password) {
        updateData.password = editUserForm.password
      }

      await userService.updateUser(editingUser.id, updateData)

      // Recarregar lista de usuários
      await loadUsers()

      closeEditUserModal()
      toast({ description: "Usuário atualizado com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      setEditUserError("Erro ao atualizar usuário")
    }
  }

  // Função para excluir usuário
  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast({ description: "Você não pode excluir seu próprio usuário", variant: "destructive" })
      return
    }

    // Verificar se o usuário tem tickets
    const userTickets = tickets.filter((t) => t.criado_por === user.name)
    if (userTickets.length > 0) {
      const confirmDelete = confirm(
        `O usuário ${user.name} possui ${userTickets.length} ticket(s). Tem certeza que deseja excluí-lo? Os tickets permanecerão no sistema.`,
      )
      if (!confirmDelete) return
    } else {
      const confirmDelete = confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)
      if (!confirmDelete) return
    }

    try {
      await userService.deleteUser(user.id)
      await loadUsers()
      toast({ description: "Usuário excluído com sucesso!" })
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({ description: "Erro ao excluir usuário", variant: "destructive" })
    }
  }

  // Aplicar filtros baseados no usuário e filtros selecionados
  useEffect(() => {
    if (!currentUser || tickets.length === 0) return

    const applyFilters = async () => {
      try {
        const data = await ticketService.getFilteredTickets({
          empresa: filters.empresa,
          plataforma: filters.plataforma,
          status: filters.status,
          departamento: filters.departamento,
          dataInicial: filters.dataInicial,
          dataFinal: filters.dataFinal,
          criadoPor: filters.criadoPor,
          apenasEmImplementacao: filters.apenasEmImplementacao,
          userRole: currentUser.role,
          userName: currentUser.name,
        })
        setFilteredTickets(data)
      } catch (error) {
        console.error("Erro ao filtrar tickets:", error)
        setFilteredTickets([])
      }
    }

    applyFilters()
  }, [filters, tickets, currentUser])

  // Carregar estatísticas do usuário
  const loadUserStats = async () => {
    if (!currentUser) return

    setLoadingStats(true)

    try {
      // Determinar quais tickets usar para as estatísticas
      let userTickets = tickets

      if (currentUser.role === "Supervisor" && selectedUserFilter) {
        // Se for supervisor e tiver usuário selecionado, filtrar por esse usuário
        userTickets = tickets.filter((ticket) => ticket.criado_por === selectedUserFilter)
      } else if (currentUser.role === "Tecnico") {
        // Se for técnico, mostrar apenas seus próprios tickets
        userTickets = tickets.filter((ticket) => ticket.criado_por === currentUser.name)
      }
      // Se for supervisor sem filtro, mostra todos os tickets

      const stats: UserStats = {
        totalTickets: userTickets.length,
        resolvidos: userTickets.filter((t) => t.status === "Resolvido").length,
        pendentes: userTickets.filter((t) => t.status === "Pendente").length,
        emAndamento: userTickets.filter((t) => t.status === "Em Andamento").length,
        emImplementacao: userTickets.filter((t) => t.em_implementacao).length,
        ticketsRecentes: userTickets
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
          .slice(0, 5),
        atividadeMensal: calculateMonthlyActivity(userTickets),
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
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoading(true)

    try {
      const user = await userService.validateUser(loginForm.username, loginForm.password)

      if (!user) {
        setLoginError("Usuário ou senha incorretos")
        return
      }

      // Gerar e salvar token
      const authToken = genereteToken(user)
      saveToken(authToken)

      setCurrentUser(user)
      setIsLoggedIn(true)
      setActiveTab(user.role === "Supervisor" ? "tickets" : "novo")

      //limpar forms
      setLoginForm({ username: "", password: "", remember: false })
    } catch (error) {
      console.error("Erro no login:", error)
      setLoginError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const handleLogout = () => {
    removeToken()
    setCurrentUser(null)
    setIsLoggedIn(false)
    setActiveTab("")
    setSelectedUserFilter("")
    setTickets([])
    setFilteredTickets([])
    setUsers([])

    // limpa forms login
    setLoginForm({ username: "", password: "", remember: false })
  }

  // Funções para gerenciar abas
  const toggleTabVisibility = (tabName: string) => {
    setHiddenTabs((prev) => (prev.includes(tabName) ? prev.filter((tab) => tab !== tabName) : [...prev, tabName]))
  }

  const isTabVisible = (tabName: string) => {
    return !hiddenTabs.includes(tabName)
  }

  // Função para atualização automática
  const refreshData = async () => {
    if (isLoggedIn) {
      await loadTickets()
      if (activeTab === "dashboard") {
        await loadUserStats()
      }
      setLastRefresh(new Date())
    }
  }

  // Configurar atualização automática a cada 30 segundos
  useEffect(() => {
    if (!isLoggedIn || !autoRefreshEnabled) return

    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [isLoggedIn, autoRefreshEnabled, activeTab])

  // Redirecionar para uma aba visível se a atual for ocultada
  useEffect(() => {
    if (!isLoggedIn) return

    const availableTabs = []
    if (currentUser?.role === "Tecnico" && isTabVisible("novo")) availableTabs.push("novo")
    if (isTabVisible("tickets")) availableTabs.push("tickets")
    if (isTabVisible("dashboard")) availableTabs.push("dashboard")
    if (currentUser?.role === "Supervisor") availableTabs.push("usuarios")

    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [hiddenTabs, activeTab, isLoggedIn, currentUser])

  // Função para criar novo ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    try {
      setLoading(true)
      await ticketService.createTicket({
        empresa: newTicket.empresa,
        plataforma: newTicket.plataforma,
        departamento: newTicket.departamento,
        descricao: newTicket.descricao,
        em_implementacao: newTicket.emImplementacao,
        criado_por: currentUser.name,
        status: newTicket.status,
      })

      // Recarregar tickets
      await loadTickets()

      setNewTicket({
        empresa: "",
        plataforma: "INTERCOM",
        departamento: "",
        descricao: "",
        emImplementacao: false,
        status: "Em Andamento",
      })

      toast({ description: "Ticket criado com sucesso!" })
    } catch (error) {
      console.error("Erro ao criar ticket", error)
      toast({ description: "Erro ao criar ticket", variant: "destructive" })
    } finally {
      setLoading(false)
    }
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

  // Função para excluir ticket (apenas admin)
  const handleDeleteTicket = async (ticketId: number) => {
    if (currentUser?.role === "Supervisor" && confirm("Tem certeza que deseja excluir este ticket?")) {
      try {
        await ticketService.deleteTicket(ticketId)
        await loadTickets()
        toast({ description: "Ticket excluído com sucesso!" })
      } catch (error) {
        console.error("Erro ao excluir ticket:", error)
        toast({ description: "Erro ao excluir ticket", variant: "destructive" })
      }
    }
  }

  // Função para editar status do ticket
  const handleEditStatus = async (ticketId: number, newStatus: "Em Andamento" | "Resolvido" | "Pendente") => {
    if (!currentUser) return

    try {
      await ticketService.updateTicketStatus(ticketId, newStatus, currentUser.name)
      await loadTickets()
      setEditingTicket(null)
      toast({ description: "Status atualizado com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({ description: "Erro ao atualizar status", variant: "destructive" })
    }
  }

  // Função para editar descrição do ticket
  const handleEditDescription = async (ticketId: number, newDescription: string) => {
    if (!currentUser) return

    try {
      await ticketService.updateTicketDescription(ticketId, newDescription, currentUser.name)
      await loadTickets()
      setEditingDescription(null)
      setEditDescriptionText("")
      toast({ description: "Descrição atualizada com sucesso!" })
    } catch (error) {
      console.error("Erro ao atualizar descrição:", error)
      toast({ description: "Erro ao atualizar descrição", variant: "destructive" })
    }
  }

  // Função para iniciar edição
  const startEditing = (ticketId: number, currentStatus: "Em Andamento" | "Resolvido" | "Pendente") => {
    setEditingTicket(ticketId)
    setEditStatus(currentStatus)
  }

  // Função para iniciar edição de descrição
  const startEditingDescription = (ticketId: number, currentDescription: string) => {
    setEditingDescription(ticketId)
    setEditDescriptionText(currentDescription)
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

  // Função para obter cor do status de atendimento
  const getStatusAtendimentoColor = (status: string) => {
    switch (status) {
      case "Criado":
        return "bg-gray-100 text-gray-800"
      case "Em Atendimento":
        return "bg-blue-100 text-blue-800"
      case "Finalizado":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Função para iniciar atendimento
  const handleIniciarAtendimento = async (ticketId: number) => {
    if (!currentUser) return

    try {
      setLoading(true)
      await ticketService.iniciarAtendimento(ticketId, currentUser.name)
      await loadTickets()
      toast({ description: "Atendimento iniciado com sucesso!" })
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error)
      toast({ description: "Erro ao iniciar atendimento", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Função para finalizar atendimento
  const handleFinalizarAtendimento = async (ticketId: number) => {
    if (!currentUser) return

    try {
      setLoading(true)
      await ticketService.finalizarAtendimento(ticketId, currentUser.name)
      await loadTickets()
      toast({ description: "Atendimento finalizado com sucesso!" })
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error)
      toast({ description: "Erro ao finalizar atendimento", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Cálculos das métricas gerais (baseado nos tickets visíveis para o usuário)
  const visibleTickets =
    currentUser?.role === "Supervisor" ? tickets : tickets.filter((t) => t.criado_por === currentUser?.name)

  // Função para filtrar tickets por data atual
  const getTicketsByDate = (tickets: Ticket[], targetDate?: Date) => {
    const today = targetDate || new Date()
    const todayString = today.toISOString().split("T")[0] // Formato YYYY-MM-DD

    return tickets.filter((ticket) => {
      const ticketDate = new Date(ticket.criado_em)
      const ticketDateString = ticketDate.toISOString().split("T")[0]
      return ticketDateString === todayString
    })
  }

  // Filtrar tickets do dia atual
  const todayTickets = getTicketsByDate(filteredTickets)
  const todayVisibleTickets = getTicketsByDate(visibleTickets)

  // Métricas do dia atual
  const totalAtendimentos = todayTickets.length
  const resolvidos = todayTickets.filter((t) => t.status === "Resolvido").length
  const naoResolvidos = todayTickets.filter((t) => t.status !== "Resolvido").length
  const intercom = todayTickets.filter((t) => t.plataforma === "INTERCOM").length
  const gronerzap = todayTickets.filter((t) => t.plataforma === "GRONERZAP").length
  const conclusaoPercent = totalAtendimentos > 0 ? Math.round((resolvidos / totalAtendimentos) * 100) : 0
  const emImplementacao = todayTickets.filter((t) => t.em_implementacao).length

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="login-container p-8 w-full max-w-md">
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
                className="form-input"
                placeholder="Digite seu usuário"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Senha</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="form-input"
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={loginForm.remember}
                onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Lembrar-me
              </label>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">❌ {loginError}</div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "🔄 Entrando..." : "🚀 Entrar"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Sistema de Acompanhamento - Suporte</h1>
                <p className="text-sm text-gray-600">
                  {currentUser?.role === "Supervisor"
                    ? "Gerencie todos os tickets e acompanhe métricas em tempo real"
                    : "Gerencie seus tickets e acompanhe suas métricas"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Controles de visibilidade das abas */}
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <button
                    onClick={() => toggleTabVisibility("novo")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${isTabVisible("novo") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    ➕
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {isTabVisible("novo") ? "Ocultar Novo Ticket" : "Mostrar Novo Ticket"}
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => toggleTabVisibility("tickets")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${isTabVisible("tickets") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    📋
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {isTabVisible("tickets") ? "Ocultar Meus Tickets" : "Mostrar Meus Tickets"}
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => toggleTabVisibility("dashboard")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${isTabVisible("dashboard") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    📊
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {isTabVisible("dashboard") ? "Ocultar Meu Dashboard" : "Mostrar Meu Dashboard"}
                  </div>
                </div>
              </div>

              {/* Controle de atualização automática */}
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${autoRefreshEnabled ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    🔄
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {autoRefreshEnabled ? "Desativar Auto" : "Ativar Auto"}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Área do usuário com hover */}
              <div
                className="relative"
                onMouseEnter={() => setShowHeaderInfo(true)}
                onMouseLeave={() => setShowHeaderInfo(false)}
              >
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg cursor-pointer transition-all duration-200">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar || "/placeholder.svg"}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                  <span className="hidden sm:inline">{currentUser?.name}</span>
                </div>

                {/* Dropdown com informações do usuário */}
                {showHeaderInfo && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        {currentUser?.avatar ? (
                          <img
                            src={currentUser.avatar || "/placeholder.svg"}
                            alt={currentUser.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">👤</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{currentUser?.name}</p>
                          <p className="text-sm text-gray-600">
                            {currentUser?.role} - {currentUser?.department}
                          </p>
                          {currentUser?.email && <p className="text-xs text-gray-500">{currentUser.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={openProfileModal}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          👤 Meu Perfil
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🚪 Sair
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs - Movidas para o topo */}
        <div className="glass-effect rounded-xl shadow-lg border border-white/20 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {/* Aba Novo Ticket - completamente oculta quando não visível */}
              {currentUser?.role === "Tecnico" && isTabVisible("novo") && (
                <button
                  onClick={() => setActiveTab("novo")}
                  className={cn("tab-button", activeTab === "novo" ? "active" : "")}
                >
                  ➕ Novo Ticket
                  <span className="ml-2 text-gray-400">{activeTab === "novo" ? "˄" : "˅"}</span>
                </button>
              )}

              {/* Aba Tickets */}
              {isTabVisible("tickets") && (
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={cn("tab-button", activeTab === "tickets" ? "active" : "")}
                >
                  📋 {currentUser?.role === "Supervisor" ? "Todos os Tickets" : "Meus Tickets"}
                  <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                    {filteredTickets.length}
                  </span>
                  <span className="ml-2 text-gray-400">{activeTab === "tickets" ? "˄" : "˅"}</span>
                </button>
              )}

              {/* Aba Dashboard */}
              {isTabVisible("dashboard") && (
                <button
                  onClick={() => {
                    setActiveTab("dashboard")
                    loadUserStats()
                  }}
                  className={cn("tab-button", activeTab === "dashboard" ? "active" : "")}
                >
                  📊 Meu Dashboard
                  <span className="ml-2 text-gray-400">{activeTab === "dashboard" ? "˄" : "˅"}</span>
                </button>
              )}

              {/* Aba Usuários - apenas para Supervisores */}
              {currentUser?.role === "Supervisor" && (
                <button
                  onClick={() => setActiveTab("usuarios")}
                  className={cn("tab-button", activeTab === "usuarios" ? "active" : "")}
                >
                  👥 Usuários
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {users.length}
                  </span>
                  <span className="ml-2 text-gray-400">{activeTab === "usuarios" ? "˄" : "˅"}</span>
                </button>
              )}

              {/* Indicador quando todas as abas estão ocultas */}
              {(() => {
                const visibleTabs = []
                if (currentUser?.role === "Tecnico" && isTabVisible("novo")) visibleTabs.push("novo")
                if (isTabVisible("tickets")) visibleTabs.push("tickets")
                if (isTabVisible("dashboard")) visibleTabs.push("dashboard")
                if (currentUser?.role === "Supervisor") visibleTabs.push("usuarios")

                if (visibleTabs.length === 0) {
                  return (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span>👁️</span>
                      <span className="text-sm">Todas as abas estão ocultas</span>
                    </div>
                  )
                }
                return null
              })()}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Novo Ticket - completamente oculta quando não visível */}
            {activeTab === "novo" && currentUser?.role === "Tecnico" && isTabVisible("novo") && (
              <div className="max-w-2xl fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">➕ Criar Novo Ticket</h2>

                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Empresa</label>
                      <input
                        type="text"
                        value={newTicket.empresa}
                        onChange={(e) => setNewTicket({ ...newTicket, empresa: e.target.value })}
                        className="form-input"
                        placeholder="Nome da empresa"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">💬 Plataforma</label>
                      <select
                        value={newTicket.plataforma}
                        onChange={(e) =>
                          setNewTicket({ ...newTicket, plataforma: e.target.value as "INTERCOM" | "GRONERZAP" })
                        }
                        className="form-input"
                        disabled={loading}
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
                        className="form-input"
                        required
                        disabled={loading}
                      >
                        <option value="">Selecione um departamento</option>
                        {departamentos.map((dept) => (
                          <option key={dept} value={dept}>
                            {getDepartmentEmoji(dept)} {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"> 📊 Status</label>
                      <select
                        value={newTicket.status}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            status: e.target.value as "Em Andamento" | "Resolvido" | "Pendente",
                          })
                        }
                        className="form-input"
                        required
                        disabled={loading}
                      >
                        <option value="Em Andamento">🔄 Em Andamento</option>
                        <option value="Resolvido">✅ Resolvido</option>
                        <option value="Pendente">⏳ Pendente</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emImplementacao"
                        checked={newTicket.emImplementacao}
                        onChange={(e) => setNewTicket({ ...newTicket, emImplementacao: e.target.checked })}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        disabled={loading}
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
                      className="form-input"
                      placeholder="Descreva detalhadamente o problema ou solicitação..."
                      required
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "🔄 Criando..." : "✅ Criar Ticket"}
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Lista de Tickets */}
            {activeTab === "tickets" && (
              <div className="fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    📋 {currentUser?.role === "Supervisor" ? "Todos os Tickets" : "Meus Tickets"}
                  </h2>
                  <div className="text-sm text-gray-600">
                    Mostrando {filteredTickets.length} de {visibleTickets.length} tickets
                    {currentUser?.role === "Tecnico" && (
                      <span className="block text-xs text-emerald-600 mt-1">✨ Visualizando apenas seus tickets</span>
                    )}
                  </div>
                </div>

                {/* Filtros */}
                <div className="filter-section mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtros</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Empresa</label>
                      <input
                        type="text"
                        value={filters.empresa}
                        onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                        className="form-input"
                        placeholder="Buscar empresa..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">💬 Plataforma</label>
                      <select
                        value={filters.plataforma}
                        onChange={(e) => setFilters({ ...filters, plataforma: e.target.value })}
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Data Final</label>
                      <input
                        type="date"
                        value={filters.dataFinal}
                        onChange={(e) => setFilters({ ...filters, dataFinal: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    {/* Campo "Criado Por" apenas para supervisores */}
                    {currentUser?.role === "Supervisor" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">👤 Criado Por</label>
                        <input
                          type="text"
                          value={filters.criadoPor}
                          onChange={(e) => setFilters({ ...filters, criadoPor: e.target.value })}
                          className="form-input"
                          placeholder="Nome do usuário..."
                        />
                      </div>
                    )}

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

                  <button onClick={clearFilters} className="btn-secondary">
                    ❌ Limpar Filtros
                  </button>
                </div>

                {/* Lista de Tickets */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="loading-spinner"></div>
                      <span className="ml-3 text-gray-600">Carregando tickets...</span>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="ticket-card slide-up">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">🏢 {ticket.empresa}</h3>
                              <span className="status-badge bg-emerald-100 text-emerald-800">
                                🆔 {ticket.ticket_id}
                              </span>
                              <span
                                className={cn("status-badge", getStatusAtendimentoColor(ticket.status_atendimento))}
                              >
                                {ticket.status_atendimento === "Criado" && "📝"}
                                {ticket.status_atendimento === "Em Atendimento" && "🔄"}
                                {ticket.status_atendimento === "Finalizado" && "✅"} {ticket.status_atendimento}
                              </span>
                              {ticket.em_implementacao && (
                                <span className="status-badge bg-orange-100 text-orange-800">⚙️ Em Implementação</span>
                              )}
                            </div>

                            {/* Descrição como mensagens em blocos */}
                            {editingDescription === ticket.id ? (
                              <div className="mb-3">
                                <textarea
                                  value={editDescriptionText}
                                  onChange={(e) => setEditDescriptionText(e.target.value)}
                                  rows={6}
                                  className="form-input w-full"
                                  placeholder="Edite a descrição..."
                                />
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={() => handleEditDescription(ticket.id, editDescriptionText)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    ✅ Salvar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingDescription(null)
                                      setEditDescriptionText("")
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    ❌ Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <DescriptionMessages description={ticket.descricao} />
                                {(currentUser?.name === ticket.criado_por || currentUser?.role === "Supervisor") && (
                                  <button
                                    onClick={() => startEditingDescription(ticket.id, ticket.descricao)}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    ✏️ Editar descrição
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="status-badge bg-blue-100 text-blue-800">
                                {ticket.plataforma === "INTERCOM" ? "💬" : "📱"} {ticket.plataforma}
                              </span>
                              <span className="status-badge bg-purple-100 text-purple-800">
                                {getDepartmentEmoji(ticket.departamento)} {ticket.departamento}
                              </span>
                              {currentUser?.role === "Supervisor" && (
                                <span className="status-badge bg-gray-100 text-gray-800">👤 {ticket.criado_por}</span>
                              )}
                              <span className="status-badge bg-gray-100 text-gray-800">
                                📅 {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end space-y-2">
                            {editingTicket === ticket.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={editStatus}
                                  onChange={(e) =>
                                    setEditStatus(e.target.value as "Em Andamento" | "Resolvido" | "Pendente")
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="Em Andamento">🔄 Em Andamento</option>
                                  <option value="Resolvido">✅ Resolvido</option>
                                  <option value="Pendente">⏳ Pendente</option>
                                </select>
                                <button
                                  onClick={() => handleEditStatus(ticket.id, editStatus)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={() => setEditingTicket(null)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  ❌
                                </button>
                              </div>
                            ) : (
                              <span className={cn("status-badge", getStatusColor(ticket.status))}>
                                {ticket.status === "Resolvido" && "✅"}
                                {ticket.status === "Em Andamento" && "🔄"}
                                {ticket.status === "Pendente" && "⏳"} {ticket.status}
                              </span>
                            )}

                            <div className="flex space-x-1">
                              {/* Botão de iniciar atendimento */}
                              {ticket.status_atendimento === "Criado" && (
                                <button
                                  onClick={() => handleIniciarAtendimento(ticket.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                  title="Iniciar atendimento"
                                  disabled={loading}
                                >
                                  🚀
                                </button>
                              )}

                              {/* Botão de finalizar atendimento */}
                              {ticket.status_atendimento === "Em Atendimento" && (
                                <button
                                  onClick={() => handleFinalizarAtendimento(ticket.id)}
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
                                  title="Finalizar atendimento"
                                  disabled={loading}
                                >
                                  ✅
                                </button>
                              )}

                              {/* Botão de editar status - apenas para o criador do ticket */}
                              {currentUser?.name === ticket.criado_por && editingTicket !== ticket.id && (
                                <button
                                  onClick={() => startEditing(ticket.id, ticket.status)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                  title="Editar status"
                                >
                                  ✏️
                                </button>
                              )}

                              {/* Botão de excluir - apenas para admin */}
                              {currentUser?.role === "Supervisor" && (
                                <button
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                  title="Excluir ticket"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {!loading && filteredTickets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        {currentUser?.role === "Supervisor"
                          ? "Nenhum ticket encontrado"
                          : "Você ainda não criou tickets"}
                      </h3>
                      <p className="text-gray-600">
                        {currentUser?.role === "Supervisor"
                          ? "Tente ajustar os filtros para encontrar tickets."
                          : "Crie seu primeiro ticket na aba 'Novo Ticket'."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Dashboard do Usuário */}
            {activeTab === "dashboard" && (
              <div className="fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    📊 Dashboard Pessoal - {selectedUserFilter || currentUser?.name}
                  </h2>
                  <div className="flex items-center space-x-4">
                    {currentUser?.role === "Supervisor" && (
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">👤 Filtrar por usuário:</label>
                        <select
                          value={selectedUserFilter}
                          onChange={(e) => setSelectedUserFilter(e.target.value)}
                          className="form-input"
                        >
                          <option value="">Todos os tickets</option>
                          {users
                            .filter((u) => u.role === "Tecnico")
                            .map((user) => (
                              <option key={user.id} value={user.name}>
                                {user.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <button onClick={loadUserStats} className="btn-primary">
                        🔄 Atualizar
                      </button>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {autoRefreshEnabled && (
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Auto</span>
                          </span>
                        )}
                        <span>
                          Última: {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {loadingStats ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="loading-spinner"></div>
                    <span className="ml-3 text-gray-600">Carregando estatísticas...</span>
                  </div>
                ) : userStats ? (
                  <div className="space-y-6">
                    {/* Cards de Métricas */}
                    <div className="stats-grid">
                      <div className="chart-container">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total de Tickets</p>
                            <p className="text-3xl font-bold text-gray-800">{userStats.totalTickets}</p>
                          </div>
                          <div className="text-3xl">📋</div>
                        </div>
                      </div>

                      <div className="chart-container">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                            <p className="text-3xl font-bold text-green-600">{userStats.resolvidos}</p>
                          </div>
                          <div className="text-3xl">✅</div>
                        </div>
                      </div>

                      <div className="chart-container">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                            <p className="text-3xl font-bold text-blue-600">{userStats.emAndamento}</p>
                          </div>
                          <div className="text-3xl">🔄</div>
                        </div>
                      </div>

                      <div className="chart-container">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Pendentes</p>
                            <p className="text-3xl font-bold text-yellow-600">{userStats.pendentes}</p>
                          </div>
                          <div className="text-3xl">⏳</div>
                        </div>
                      </div>

                      <div className="chart-container">
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
                      <div className="chart-container">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          📈 Atividade Mensal (Últimos 6 Meses)
                        </h3>
                        <div className="space-y-3">
                          {userStats.atividadeMensal.map((item, index) => {
                            const maxTickets = Math.max(...userStats.atividadeMensal.map((i) => i.tickets))
                            const percentage = maxTickets > 0 ? (item.tickets / maxTickets) * 100 : 0

                            return (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 w-16">{item.mes}</span>
                                <div className="flex items-center space-x-2 flex-1 mx-4">
                                  <div className="chart-bar">
                                    <div
                                      className="chart-fill bg-emerald-500"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-800 w-8 text-right">
                                    {item.tickets}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {userStats.atividadeMensal.every((item) => item.tickets === 0) && (
                          <div className="text-center py-4 text-gray-500">
                            📊 Nenhum ticket criado nos últimos 6 meses
                          </div>
                        )}
                      </div>

                      {/* Por Plataforma */}
                      <div className="chart-container">
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
                                    className="chart-fill bg-purple-500"
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
                      <div className="chart-container">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Por Departamento</h3>
                        <div className="department-grid">
                          {userStats.porDepartamento.map((item, index) => (
                            <div key={index} className="department-card">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getDepartmentEmoji(item.departamento)}</span>
                                <span className="text-sm text-gray-600">{item.departamento}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-800 bg-white px-2 py-1 rounded mt-2 inline-block">
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tickets Recentes */}
                    {userStats.ticketsRecentes.length > 0 && (
                      <div className="chart-container">
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
                                  {ticket.em_implementacao && <span className="text-orange-500">⚙️</span>}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{ticket.descricao}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <span className={cn("status-badge", getStatusColor(ticket.status))}>
                                  {ticket.status === "Resolvido" && "✅"}
                                  {ticket.status === "Em Andamento" && "🔄"}
                                  {ticket.status === "Pendente" && "⏳"} {ticket.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
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
                    <button onClick={loadUserStats} className="btn-primary">
                      📊 Carregar Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Usuários (apenas para Supervisor) */}
            {activeTab === "usuarios" && currentUser?.role === "Supervisor" && (
              <div className="fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">👥 Gerenciar Usuários</h2>
                  <button onClick={() => setShowAddUserModal(true)} className="btn-primary">
                    ➕ Adicionar Usuário
                  </button>
                </div>

                <div className="chart-container">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Lista de Usuários</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{user.role === "Supervisor" ? "👑" : "🛠️"}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">{user.name}</h4>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span
                              className={cn(
                                "status-badge",
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
                            {tickets.filter((t) => t.criado_por === user.name).length} tickets
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              title="Editar usuário"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                              title="Excluir usuário"
                              disabled={user.id === currentUser?.id}
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard de Métricas Gerais */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📊 Métricas do Dia</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 bg-emerald-100 px-3 py-1 rounded-full">
                📅{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                  title="Atualizar dados"
                >
                  🔄
                </button>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {autoRefreshEnabled && (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Auto</span>
                    </span>
                  )}
                  <span>Última: {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="stats-grid mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {currentUser?.role === "Supervisor" ? "Total Atendimentos (Hoje)" : "Meus Atendimentos (Hoje)"}
                </p>
                <p className="text-3xl font-bold text-gray-800">{totalAtendimentos}</p>
                {filteredTickets.length !== visibleTickets.length && (
                  <p className="text-xs text-gray-500">{visibleTickets.length} total</p>
                )}
                <p className="text-xs text-emerald-600 mt-1">📊 {todayTickets.length} de hoje</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolvidos (Hoje)</p>
                <p className="text-3xl font-bold text-green-600">{resolvidos}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Resolvidos (Hoje)</p>
                <p className="text-3xl font-bold text-red-600">{naoResolvidos}</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão (Hoje)</p>
                <p className="text-3xl font-bold text-emerald-600">{conclusaoPercent}%</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${conclusaoPercent}%` }}></div>
                </div>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </div>
        </div>

        {/* Balanços por Plataforma */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="metric-card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>💬</span> Intercom (Hoje)
            </h3>
            <div className="text-3xl font-bold text-blue-600">{intercom}</div>
          </div>

          <div className="metric-card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>📱</span> GronerZap (Hoje)
            </h3>
            <div className="text-3xl font-bold text-green-600">{gronerzap}</div>
          </div>

          <div className="metric-card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>⚙️</span> Em Implementação (Hoje)
            </h3>
            <div className="text-3xl font-bold text-orange-600">{emImplementacao}</div>
          </div>
        </div>

        {/* Departamentos */}
        <div className="metric-card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏢</span> Distribuição por Departamento (Hoje)
          </h3>
          <div className="department-grid">
            {departamentos.map((dept) => {
              const count = todayTickets.filter((t) => t.departamento === dept).length
              return (
                <div key={dept} className="department-card">
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

        {/* Modal Adicionar Usuário */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">➕ Adicionar Novo Usuário</h3>
                  <button onClick={closeAddUserModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome Completo</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="form-input"
                      placeholder="Ex: João Silva"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Nome de Usuário</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="form-input"
                      placeholder="Ex: joao.silva"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email (Opcional)</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="form-input"
                      placeholder="Ex: joao@empresa.com"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👑 Função</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "Supervisor" | "Tecnico" })}
                      className="form-input"
                      disabled={loading}
                    >
                      <option value="Tecnico">🛠️ Técnico</option>
                      <option value="Supervisor">👑 Supervisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Departamento</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="form-input"
                      required
                      disabled={loading}
                    >
                      <option value="">Selecione um departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept} value={dept}>
                          {getDepartmentEmoji(dept)} {dept}
                        </option>
                      ))}
                      <option value="Geral">🏢 Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Senha</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Confirmar Senha</label>
                    <input
                      type="password"
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      className="form-input"
                      placeholder="Digite a senha novamente"
                      required
                      disabled={loading}
                    />
                  </div>

                  {addUserError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      ❌ {addUserError}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1" disabled={loading}>
                      {loading ? "🔄 Adicionando..." : "✅ Adicionar Usuário"}
                    </button>
                    <button
                      type="button"
                      onClick={closeAddUserModal}
                      className="btn-secondary flex-1"
                      disabled={loading}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">✏️ Editar Usuário</h3>
                  <button onClick={closeEditUserModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome Completo</label>
                    <input
                      type="text"
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="form-input"
                      placeholder="Ex: João Silva"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Nome de Usuário</label>
                    <input
                      type="text"
                      value={editUserForm.username}
                      onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                      className="form-input"
                      placeholder="Ex: joao.silva"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email (Opcional)</label>
                    <input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      className="form-input"
                      placeholder="Ex: joao@empresa.com"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👑 Função</label>
                    <select
                      value={editUserForm.role}
                      onChange={(e) =>
                        setEditUserForm({ ...editUserForm, role: e.target.value as "Supervisor" | "Tecnico" })
                      }
                      className="form-input"
                      disabled={loading || editingUser.id === currentUser?.id}
                    >
                      <option value="Tecnico">🛠️ Técnico</option>
                      <option value="Supervisor">👑 Supervisor</option>
                    </select>
                    {editingUser.id === currentUser?.id && (
                      <p className="text-xs text-gray-500 mt-1">Você não pode alterar sua própria função</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Departamento</label>
                    <select
                      value={editUserForm.department}
                      onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                      className="form-input"
                      required
                      disabled={loading}
                    >
                      <option value="">Selecione um departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept} value={dept}>
                          {getDepartmentEmoji(dept)} {dept}
                        </option>
                      ))}
                      <option value="Geral">🏢 Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Nova Senha (Opcional)</label>
                    <input
                      type="password"
                      value={editUserForm.password}
                      onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                      className="form-input"
                      placeholder="Deixe em branco para manter a atual"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={editUserForm.confirmPassword}
                      onChange={(e) => setEditUserForm({ ...editUserForm, confirmPassword: e.target.value })}
                      className="form-input"
                      placeholder="Confirme a nova senha"
                      disabled={loading}
                    />
                  </div>

                  {editUserError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      ❌ {editUserError}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1" disabled={loading}>
                      {loading ? "🔄 Salvando..." : "💾 Salvar Alterações"}
                    </button>
                    <button
                      type="button"
                      onClick={closeEditUserModal}
                      className="btn-secondary flex-1"
                      disabled={loading}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Perfil */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">👤 Meu Perfil</h2>
                  <button onClick={closeProfileModal} className="text-gray-500 hover:text-gray-700 text-xl">
                    ✕
                  </button>
                </div>

                {/* Avatar Section */}
                <div className="mb-6 text-center">
                  <div className="relative inline-block">
                    <img
                      src={avatarPreview || currentUser?.avatar || "/placeholder-user.jpg"}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                      📷
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Clique na câmera para alterar a foto</p>
                </div>

                {/* Formulário de Perfil */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="form-input"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>

                  {profileSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      ✅ {profileSuccess}
                    </div>
                  )}

                  {profileError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      ❌ {profileError}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary flex-1" disabled={loading || uploadingAvatar}>
                      {loading || uploadingAvatar ? "🔄 Salvando..." : "💾 Salvar Perfil"}
                    </button>
                    <button
                      type="button"
                      onClick={closeProfileModal}
                      className="btn-secondary flex-1"
                      disabled={loading}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>

                {/* Separador */}
                <div className="my-6 border-t border-gray-200"></div>

                {/* Formulário de Alteração de Senha */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔒 Alterar Senha</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Senha Atual</label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      className="form-input"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Nova Senha</label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      className="form-input"
                      placeholder="Digite a nova senha novamente"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? "🔄 Alterando..." : "🔒 Alterar Senha"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .login-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .department-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .department-card {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s;
        }

        .department-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .tab-button {
          padding: 16px 0;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          font-weight: 500;
          transition: all 0.2s;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-button:hover {
          color: #10b981;
          border-bottom-color: #10b981;
        }

        .tab-button.active {
          color: #10b981;
          border-bottom-color: #10b981;
          font-weight: 600;
        }

        .ticket-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .ticket-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
        }

        .filter-section {
          background: rgba(249, 250, 251, 0.8);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .chart-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .chart-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .chart-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .messages-container {
          max-height: 300px;
          overflow-y: auto;
          space-y: 12px;
        }

        .message-block {
          margin-bottom: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          position: relative;
          max-width: 85%;
        }

        .system-message {
          background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
          border: 1px solid #bae6fd;
          margin-left: 0;
          margin-right: auto;
        }

        .user-message {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #bbf7d0;
          margin-left: auto;
          margin-right: 0;
        }

        .message-content {
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }

        .message-line {
          margin-bottom: 4px;
        }

        .message-timestamp {
          font-size: 10px;
          color: #9ca3af;
          text-align: right;
          margin-top: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          color: #1f2937 !important;
        }

        .form-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        * {
          color: inherit;
        }

        body {
          color: #1f2937;
        }

        .text-gray-800 {
          color: #1f2937 !important;
        }

        .text-gray-700 {
          color: #374151 !important;
        }

        .text-gray-600 {
          color: #4b5563 !important;
        }

        .text-gray-500 {
          color: #6b7280 !important;
        }

        .metric-card,
        .ticket-card,
        .chart-container,
        .filter-section,
        .department-card {
          color: #1f2937;
        }

        .metric-card *,
        .ticket-card *,
        .chart-container *,
        .filter-section *,
        .department-card * {
          color: inherit;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .department-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .tab-button {
            font-size: 14px;
            padding: 12px 0;
          }

          .message-block {
            max-width: 95%;
          }
        }
      `}</style>
    </div>
  )
}
