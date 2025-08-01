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
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
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
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .single()

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
      .select("id, username, name, role, department, created_at, is_active")
      .eq("is_active", true)
      .order("name")

    if (error) throw error
    return data || []
  },

  async getAllUsersIncludingInactive() {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, role, department, created_at, is_active, deleted_at, deleted_by")
      .order("name")

    if (error) throw error
    return data || []
  },

  async getUserById(id: number) {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, role, department, created_at, is_active")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
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
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateUser(
    id: number,
    userData: {
      username?: string
      name?: string
      role?: "Supervisor" | "Tecnico"
      department?: string
      password?: string
    },
  ) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (userData.username) updateData.username = userData.username
    if (userData.name) updateData.name = userData.name
    if (userData.role) updateData.role = userData.role
    if (userData.department) updateData.department = userData.department
    if (userData.password) {
      updateData.password_hash = btoa(userData.password + "SaltKey2024")
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async deleteUser(id: number, deletedBy: string) {
    const { error } = await supabase.rpc("soft_delete_user", {
      user_id: id,
      deleted_by_name: deletedBy,
    })

    if (error) throw error
  },

  async reactivateUser(id: number) {
    const { error } = await supabase.rpc("reactivate_user", {
      user_id: id,
    })

    if (error) throw error
  },

  async checkUsernameExists(username: string, excludeId?: number) {
    let query = supabase.from("users").select("id").eq("username", username).eq("is_active", true)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query.single()

    return !error && data
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

  async getTodaysTickets() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .gte("criado_em", startOfDay)
      .lt("criado_em", endOfDay)
      .order("criado_em", { ascending: true }) // Invertido: mais antigos primeiro

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
  }) {
    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          ...ticketData,
          status: "Em Andamento" as const,
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
