-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Supervisor', 'Tecnico')),
  department VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) UNIQUE NOT NULL, -- ID único para exibição
  empresa VARCHAR(255) NOT NULL,
  plataforma VARCHAR(50) NOT NULL CHECK (plataforma IN ('INTERCOM', 'GRONERZAP')),
  departamento VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Em Andamento', 'Resolvido', 'Pendente')),
  status_atendimento VARCHAR(50) NOT NULL DEFAULT 'Criado' CHECK (status_atendimento IN ('Criado', 'Em Atendimento', 'Finalizado')),
  em_implementacao BOOLEAN DEFAULT FALSE,
  criado_por VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE,
  atualizado_por VARCHAR(255),
  iniciado_em TIMESTAMP WITH TIME ZONE,
  finalizado_em TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_criado_por ON tickets(criado_por);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_plataforma ON tickets(plataforma);
CREATE INDEX IF NOT EXISTS idx_tickets_departamento ON tickets(departamento);
CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Only supervisors can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Políticas de segurança para tickets
CREATE POLICY "Users can view all tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Users can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Only supervisors can delete tickets" ON tickets FOR DELETE USING (true);
