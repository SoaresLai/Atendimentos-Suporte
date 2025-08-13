import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: number
  username: string
  name: string
  role: "Supervisor" | "Tecnico"
  department: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  ticket_id: string // ID único para exibição
  empresa: string
  plataforma: "INTERCOM" | "GRONERZAP"
  departamento: string
  descricao: string
  status: "Em Andamento" | "Resolvido" | "Pendente"
  status_atendimento: "Criado" | "Em Atendimento" | "Finalizado" // Novo campo
  em_implementacao: boolean
  criado_por: string
  criado_em: string
  atualizado_em?: string
  atualizado_por?: string
  iniciado_em?: string // Quando o atendimento foi iniciado
  finalizado_em?: string // Quando o atendimento foi finalizado
}

// Funções para usuários
export const userService = {
  async validateUser(username: string, password: string) {
    const { data, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !data) return null

    // Em produção, use bcrypt para comparar senhas
    // Por simplicidade, mantendo a validação simples
    if (data.password_hash === btoa(password + "SaltKey2024")) {
      return {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role as "Supervisor" | "Tecnico",
        department: data.department,
      }
    }
    return null
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, role, department, created_at")
      .order("name")

    if (error) throw error
    return data || []
  },

  async createUser(userData: {
    username: string
    name: string
    role: "Supervisor" | "Tecnico"
    department: string
    password: string
  }) {
    const passwordHash = btoa(userData.password + "SaltKey2024")

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: userData.username,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          password_hash: passwordHash,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async checkUsernameExists(username: string) {
    const { data, error } = await supabase.from("users").select("id").eq("username", username).single()

    return !error && data
  },

  async updateProfile(userId: number, updates: {
    name?: string
    email?: string
    avatar?: string
  }) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    // Primeiro, verificar a senha atual
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single()

    if (fetchError) throw fetchError

    // Verificar senha atual
    const currentPasswordHash = btoa(currentPassword + "SaltKey2024")
    if (user.password_hash !== currentPasswordHash) {
      throw new Error("Senha atual incorreta")
    }

    // Atualizar para nova senha
    const newPasswordHash = btoa(newPassword + "SaltKey2024")
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId)

    if (updateError) throw updateError
  },

  async uploadAvatar(userId: number, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) throw error

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Atualizar perfil do usuário
    await this.updateProfile(userId, { avatar: publicUrl })
    
    return publicUrl
  },
}

// Função para gerar ID único de ticket
const generateTicketId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `TKT-${timestamp}-${random}`.toUpperCase()
}

// Função para gerar mensagem automática
const generateAutoMessage = (analystName: string, ticketId: string) => {
  return `Você está na fila para atendimento com o Time de Suporte Groner.

Atualmente, estamos ajudando outros clientes que entraram antes, mas assim que chegar sua vez o ${analystName} vai falar com você.

💡 Pra agilizar: já nos conte aqui o que está acontecendo, assim começamos preparados. 😉

⏳ Previsão de início: 30 minutos
💬 Próximo passo: o ${analystName} enviará mensagem quando iniciar seu atendimento.

🆔 Ticket ID: ${ticketId}`
}

// Função para gerar mensagem de início de atendimento
const generateStartMessage = (analystName: string, departamento: string) => {
  const horas = departamento === "Engenharia" ? 8 : 4
  return `✅ Seu atendimento com o Time de Suporte Groner foi iniciado!
Eu sou o ${analystName} e vou acompanhar sua solicitação.

Temos até ${horas} horas para concluir a resolução do seu problema. Para aproveitar ao máximo esse tempo, poderia confirmar ou complementar as informações que já nos enviou? Assim conseguimos agir de forma mais rápida e eficiente. 😉`
}

// Função para obter tempo por departamento
const getTempoPorDepartamento = (departamento: string) => {
  return departamento === "Engenharia" ? 8 : 4
}

// Funções para tickets
export const ticketService = {
  async getAllTickets() {
    const { data, error } = await supabase.from("tickets").select("*").order("criado_em", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getTicketsByUser(userName: string) {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("criado_por", userName)
      .order("criado_em", { ascending: false })

    if (error) throw error
    return data || []
  },

  async createTicket(ticketData: {
    empresa: string
    plataforma: "INTERCOM" | "GRONERZAP"
    departamento: string
    descricao: string
    em_implementacao: boolean
    criado_por: string
    status: "Em Andamento" | "Resolvido" | "Pendente"
  }) {
    const ticketId = generateTicketId()
    const autoMessage = generateAutoMessage(ticketData.criado_por, ticketId)
    
    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          ...ticketData,
          ticket_id: ticketId,
          status_atendimento: "Criado",
          descricao: `${autoMessage}\n\n---\n\n${ticketData.descricao}`,
          criado_em: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async iniciarAtendimento(ticketId: number, analystName: string) {
    // Buscar o ticket para obter o departamento
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("departamento, descricao")
      .eq("id", ticketId)
      .single()

    if (fetchError) throw fetchError

    const startMessage = generateStartMessage(analystName, ticket.departamento)
    const novaDescricao = `${ticket.descricao}\n\n---\n\n${startMessage}`

    const { data, error } = await supabase
      .from("tickets")
      .update({
        status_atendimento: "Em Atendimento",
        iniciado_em: new Date().toISOString(),
        descricao: novaDescricao,
        atualizado_por: analystName,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async finalizarAtendimento(ticketId: number, analystName: string) {
    const { data, error } = await supabase
      .from("tickets")
      .update({
        status_atendimento: "Finalizado",
        finalizado_em: new Date().toISOString(),
        atualizado_por: analystName,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTicketStatus(ticketId: number, status: "Em Andamento" | "Resolvido" | "Pendente", updatedBy: string) {
    const { data, error } = await supabase
      .from("tickets")
      .update({
        status,
        atualizado_por: updatedBy,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteTicket(ticketId: number) {
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId)

    if (error) throw error
  },

  async getFilteredTickets(filters: {
    empresa?: string
    plataforma?: string
    status?: string
    departamento?: string
    dataInicial?: string
    dataFinal?: string
    criadoPor?: string
    apenasEmImplementacao?: boolean
    userRole?: "Supervisor" | "Tecnico"
    userName?: string
  }) {
    let query = supabase.from("tickets").select("*")

    // Se for técnico, filtrar apenas seus tickets
    if (filters.userRole === "Tecnico" && filters.userName) {
      query = query.eq("criado_por", filters.userName)
    }

    if (filters.empresa) {
      query = query.ilike("empresa", `%${filters.empresa}%`)
    }

    if (filters.plataforma) {
      query = query.eq("plataforma", filters.plataforma)
    }

    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.departamento) {
      query = query.eq("departamento", filters.departamento)
    }

    if (filters.criadoPor) {
      query = query.ilike("criado_por", `%${filters.criadoPor}%`)
    }

    if (filters.apenasEmImplementacao) {
      query = query.eq("em_implementacao", true)
    }

    if (filters.dataInicial) {
      query = query.gte("criado_em", filters.dataInicial)
    }

    if (filters.dataFinal) {
      query = query.lte("criado_em", filters.dataFinal + "T23:59:59")
    }

    query = query.order("criado_em", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  },
}
