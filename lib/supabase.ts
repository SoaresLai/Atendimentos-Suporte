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
  empresa: string
  plataforma: "INTERCOM" | "GRONERZAP"
  departamento: string
  descricao: string
  status: "Em Andamento" | "Resolvido" | "Pendente"
  em_implementacao: boolean
  criado_por: string
  criado_em: string
  atualizado_em?: string
  atualizado_por?: string
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
    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          ...ticketData,
          criado_em: new Date().toISOString(),
        },
      ])
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
