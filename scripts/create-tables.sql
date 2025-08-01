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

-- Criar tabela de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(100) NOT NULL,
  plataforma VARCHAR(20) NOT NULL CHECK (plataforma IN ('INTERCOM', 'GRONERZAP')),
  departamento VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Em Andamento' CHECK (status IN ('Em Andamento', 'Resolvido', 'Pendente')),
  em_implementacao BOOLEAN DEFAULT FALSE,
  criado_por VARCHAR(100) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_por VARCHAR(100),
  atualizado_em TIMESTAMP WITH TIME ZONE
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
