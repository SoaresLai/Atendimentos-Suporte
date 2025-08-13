# Sistema de Acompanhamento - Suporte

Sistema de acompanhamento e gerenciamento de tickets de suporte integrado com Supabase.

## Funcionalidades

### Tickets com ID Único
- Cada ticket recebe automaticamente um ID único no formato `TKT-{timestamp}-{random}` (ex: `TKT-LM5N2P-ABC12`)
- O ID é exibido em destaque na interface para fácil identificação

### Sistema de Atendimento
- **Status de Atendimento**: Criado → Em Atendimento → Finalizado
- **Botões de Ação**: 
  - 🚀 Iniciar Atendimento (quando status = "Criado")
  - ✅ Finalizar Atendimento (quando status = "Em Atendimento")

### Mensagens Automáticas

#### Mensagem Inicial (ao criar ticket)
\`\`\`
Você está na fila para atendimento com o Time de Suporte Groner.

Atualmente, estamos ajudando outros clientes que entraram antes, mas assim que chegar sua vez o [Nome do Analista] vai falar com você.

💡 Pra agilizar: já nos conte aqui o que está acontecendo, assim começamos preparados. 😉

⏳ Previsão de início: 30 minutos
💬 Próximo passo: o [Nome do Analista] enviará mensagem quando iniciar seu atendimento.

🆔 Ticket ID: [ID_UNICO]

---

[Descrição original do ticket]
\`\`\`

#### Mensagem de Início de Atendimento
\`\`\`
✅ Seu atendimento com o Time de Suporte Groner foi iniciado!
Eu sou o [Nome do Analista] e vou acompanhar sua solicitação.

Temos até [X] horas para concluir a resolução do seu problema. Para aproveitar ao máximo esse tempo, poderia confirmar ou complementar as informações que já nos enviou? Assim conseguimos agir de forma mais rápida e eficiente. 😉
\`\`\`

**Tempo por Departamento:**
- **Engenharia**: 8 horas
- **Outros departamentos**: 4 horas

## Configuração do Banco de Dados

### Nova Instalação
Execute o script `scripts/create-tables.sql` para criar as tabelas com todos os campos necessários.

### Migração de Instalação Existente
Se você já tem uma instalação existente, execute os scripts de migração:

\`\`\`sql
-- Execute no seu banco Supabase
\i scripts/migrate-add-ticket-id.sql
\i scripts/migrate-add-attendance-status.sql
\`\`\`

## Estrutura do Banco

### Tabela `tickets`
- `id`: ID interno (SERIAL)
- `ticket_id`: ID único para exibição (VARCHAR(50), UNIQUE)
- `empresa`: Nome da empresa
- `plataforma`: INTERCOM ou GRONERZAP
- `departamento`: Departamento responsável
- `descricao`: Descrição com mensagens automáticas + descrição original
- `status`: Em Andamento, Resolvido ou Pendente
- `status_atendimento`: Criado, Em Atendimento ou Finalizado
- `em_implementacao`: Boolean para tickets em implementação
- `criado_por`: Nome do analista que criou
- `criado_em`: Data/hora de criação
- `atualizado_em`: Data/hora da última atualização
- `atualizado_por`: Nome de quem atualizou
- `iniciado_em`: Data/hora de início do atendimento
- `finalizado_em`: Data/hora de finalização do atendimento

## Fluxo de Atendimento

1. **Criar Ticket**: Status "Criado" + mensagem inicial automática
2. **Iniciar Atendimento**: Status "Em Atendimento" + mensagem de início
3. **Finalizar Atendimento**: Status "Finalizado"

## Tecnologias

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS, Radix UI
- **Autenticação**: Sistema de tokens locais

## Instalação

1. Clone o repositório
2. Configure as variáveis de ambiente do Supabase
3. Execute os scripts SQL para configurar o banco
4. Instale as dependências: `npm install`
5. Execute: `npm run dev`

## Uso

1. Faça login com suas credenciais
2. Crie tickets na aba "Novo Ticket"
3. Visualize e gerencie tickets na aba "Tickets"
4. Use os botões 🚀 e ✅ para gerenciar o atendimento
5. Acompanhe métricas no "Dashboard"
6. Gerencie usuários (apenas Supervisores)
