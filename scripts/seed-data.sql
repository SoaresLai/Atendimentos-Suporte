-- Inserir usuários iniciais (apenas se não existirem)
INSERT INTO users (username, name, role, department, password_hash, is_active) 
SELECT 'admin', 'Administrador do Sistema', 'Supervisor', 'Geral', encode(digest('admin123SaltKey2024', 'sha256'), 'base64'), true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, name, role, department, password_hash, is_active) 
SELECT 'suporte1', 'João Silva - Suporte', 'Tecnico', 'Criação', encode(digest('123456SaltKey2024', 'sha256'), 'base64'), true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'suporte1');

INSERT INTO users (username, name, role, department, password_hash, is_active) 
SELECT 'suporte2', 'Maria Santos - Suporte', 'Tecnico', 'Precificação', encode(digest('123456SaltKey2024', 'sha256'), 'base64'), true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'suporte2');

INSERT INTO users (username, name, role, department, password_hash, is_active) 
SELECT 'suporte3', 'Pedro Costa - Suporte', 'Tecnico', 'Fluxos', encode(digest('123456SaltKey2024', 'sha256'), 'base64'), true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'suporte3');

INSERT INTO users (username, name, role, department, password_hash, is_active) 
SELECT 'tecnico1', 'Ana Oliveira - Técnica', 'Tecnico', 'Automações', encode(digest('123456SaltKey2024', 'sha256'), 'base64'), true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tecnico1');

-- Inserir alguns tickets de exemplo (apenas se não existirem)
INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em)
SELECT 'Tech Solutions Ltda', 'INTERCOM', 'Criação', 'Problema com integração de API', 'Em Andamento', true, 'João Silva - Suporte', NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE empresa = 'Tech Solutions Ltda');

INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em)
SELECT 'Inovação Digital', 'GRONERZAP', 'Precificação', 'Erro no cálculo de preços', 'Resolvido', false, 'Maria Santos - Suporte', NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE empresa = 'Inovação Digital');

INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em)
SELECT 'StartUp ABC', 'INTERCOM', 'Fluxos', 'Configuração de workflow', 'Pendente', true, 'Pedro Costa - Suporte', NOW() - INTERVAL '3 hours'
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE empresa = 'StartUp ABC');

INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em)
SELECT 'Empresa XYZ', 'GRONERZAP', 'Automações', 'Customização de template', 'Em Andamento', false, 'Ana Oliveira - Técnica', NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE empresa = 'Empresa XYZ');

INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em)
SELECT 'Global Corp', 'INTERCOM', 'Suporte', 'Integração com sistema de pagamento', 'Resolvido', true, 'João Silva - Suporte', NOW() - INTERVAL '30 minutes'
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE empresa = 'Global Corp');
