"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Building2, CheckCircle, Clock, AlertCircle, Users, TrendingUp, Plus } from "lucide-react"

interface Ticket {
  id: string
  empresa: string
  assunto: string
  imp: "Sim" | "Não"
  plataforma: "INTERCOM" | "GRONERZAP"
  status: "Resolvido" | "Em Andamento" | "Pendente"
  departamento: "CRIAÇÃO" | "PRECIFICAÇÃO" | "FLUXOS" | "AUTOMAÇÕES" | "REUNIÃO" | "TECHLEAD" | "SUPORTE" | "ENGENHARIA"
  data: string
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "1",
      empresa: "Futuro Solar",
      assunto: "Mensagem automática fim de expediente",
      imp: "Não",
      plataforma: "INTERCOM",
      status: "Resolvido",
      departamento: "SUPORTE",
      data: "31/07/2025",
    },
    {
      id: "2",
      empresa: "MV2 Engenharia",
      assunto: "UpSell e DownSell",
      imp: "Não",
      plataforma: "INTERCOM",
      status: "Resolvido",
      departamento: "SUPORTE",
      data: "31/07/2025",
    },
  ])

  const [newTicket, setNewTicket] = useState({
    empresa: "",
    assunto: "",
    imp: "Não" as "Sim" | "Não",
    plataforma: "GRONERZAP" as "INTERCOM" | "GRONERZAP",
    status: "Em Andamento" as "Resolvido" | "Em Andamento" | "Pendente",
    departamento: "SUPORTE" as
      | "CRIAÇÃO"
      | "PRECIFICAÇÃO"
      | "FLUXOS"
      | "AUTOMAÇÕES"
      | "REUNIÃO"
      | "TECHLEAD"
      | "SUPORTE"
      | "ENGENHARIA",
  })

  const handleAddTicket = () => {
    if (newTicket.empresa && newTicket.assunto) {
      const ticket: Ticket = {
        id: Date.now().toString(),
        ...newTicket,
        data: new Date().toLocaleDateString("pt-BR"),
      }
      setTickets([...tickets, ticket])
      setNewTicket({
        empresa: "",
        assunto: "",
        imp: "Não",
        plataforma: "GRONERZAP",
        status: "Em Andamento",
        departamento: "SUPORTE",
      })
    }
  }

  // Cálculos das métricas
  const totalAtendimentos = tickets.length
  const resolvidos = tickets.filter((t) => t.status === "Resolvido").length
  const naoResolvidos = tickets.filter((t) => t.status !== "Resolvido").length
  const intercom = tickets.filter((t) => t.plataforma === "INTERCOM").length
  const gronerzap = tickets.filter((t) => t.plataforma === "GRONERZAP").length
  const conclusaoPercent = totalAtendimentos > 0 ? Math.round((resolvidos / totalAtendimentos) * 100) : 0
  const emImplementacao = tickets.filter((t) => t.status === "Em Andamento").length

  // Contadores por departamento
  const departmentCounts = {
    CRIAÇÃO: tickets.filter((t) => t.departamento === "CRIAÇÃO").length,
    PRECIFICAÇÃO: tickets.filter((t) => t.departamento === "PRECIFICAÇÃO").length,
    FLUXOS: tickets.filter((t) => t.departamento === "FLUXOS").length,
    AUTOMAÇÕES: tickets.filter((t) => t.departamento === "AUTOMAÇÕES").length,
    REUNIÃO: tickets.filter((t) => t.departamento === "REUNIÃO").length,
    TECHLEAD: tickets.filter((t) => t.departamento === "TECHLEAD").length,
    SUPORTE: tickets.filter((t) => t.departamento === "SUPORTE").length,
    ENGENHARIA: tickets.filter((t) => t.departamento === "ENGENHARIA").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Sistema de Acompanhamento - Suporte</h1>
          <p className="text-gray-600">Gerencie tickets e acompanhe métricas em tempo real</p>
        </div>

        {/* Dashboard de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAtendimentos}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvidos}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Resolvidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{naoResolvidos}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{conclusaoPercent}%</div>
              <Progress value={conclusaoPercent} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Balanços por Plataforma */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Intercom</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{intercom}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">GronerZap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{gronerzap}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Em Implementação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{emImplementacao}</div>
            </CardContent>
          </Card>
        </div>

        {/* Departamentos */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Distribuição por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(departmentCounts).map(([dept, count]) => (
                <div key={dept} className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-600">{dept}</div>
                  <div className="text-2xl font-bold mt-1">{count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Formulário e Lista */}
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Novo Ticket</TabsTrigger>
            <TabsTrigger value="list">Lista de Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Cadastrar Novo Ticket
                </CardTitle>
                <CardDescription>Preencha as informações para adicionar um novo ticket ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      placeholder="Nome da empresa"
                      value={newTicket.empresa}
                      onChange={(e) => setNewTicket({ ...newTicket, empresa: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plataforma">Plataforma</Label>
                    <Select
                      value={newTicket.plataforma}
                      onValueChange={(value: "INTERCOM" | "GRONERZAP") =>
                        setNewTicket({ ...newTicket, plataforma: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERCOM">INTERCOM</SelectItem>
                        <SelectItem value="GRONERZAP">GRONERZAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select
                      value={newTicket.departamento}
                      onValueChange={(value: any) => setNewTicket({ ...newTicket, departamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRIAÇÃO">CRIAÇÃO</SelectItem>
                        <SelectItem value="PRECIFICAÇÃO">PRECIFICAÇÃO</SelectItem>
                        <SelectItem value="FLUXOS">FLUXOS</SelectItem>
                        <SelectItem value="AUTOMAÇÕES">AUTOMAÇÕES</SelectItem>
                        <SelectItem value="REUNIÃO">REUNIÃO</SelectItem>
                        <SelectItem value="TECHLEAD">TECHLEAD</SelectItem>
                        <SelectItem value="SUPORTE">SUPORTE</SelectItem>
                        <SelectItem value="ENGENHARIA">ENGENHARIA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newTicket.status}
                      onValueChange={(value: any) => setNewTicket({ ...newTicket, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imp">Importante</Label>
                    <Select
                      value={newTicket.imp}
                      onValueChange={(value: "Sim" | "Não") => setNewTicket({ ...newTicket, imp: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Textarea
                    id="assunto"
                    placeholder="Descreva o assunto do ticket"
                    value={newTicket.assunto}
                    onChange={(e) => setNewTicket({ ...newTicket, assunto: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddTicket} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ticket
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Lista de Tickets
                </CardTitle>
                <CardDescription>Visualize e gerencie todos os tickets cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{ticket.empresa}</h3>
                          <p className="text-gray-600">{ticket.assunto}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={ticket.imp === "Sim" ? "destructive" : "secondary"}>
                            {ticket.imp === "Sim" ? "Importante" : "Normal"}
                          </Badge>
                          <Badge variant={ticket.status === "Resolvido" ? "default" : "outline"}>{ticket.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {ticket.plataforma}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {ticket.departamento}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {ticket.data}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
