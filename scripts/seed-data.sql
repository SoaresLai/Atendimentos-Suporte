-- Inserir usuários iniciais
INSERT INTO users (username, name, role, department, password_hash) VALUES
('admin', 'João Silva', 'Supervisor', 'Geral', 'MTIzNDU2U2FsdEtleTIwMjQ='),
('tecnico1', 'Maria Santos', 'Tecnico', 'Criação', 'MTIzNDU2U2FsdEtleTIwMjQ='),
('tecnico2', 'Pedro Costa', 'Tecnico', 'Precificação', 'MTIzNDU2U2FsdEtleTIwMjQ='),
('tecnico3', 'Ana Oliveira', 'Tecnico', 'Fluxos', 'MTIzNDU2U2FsdEtleTIwMjQ=')
ON CONFLICT (username) DO NOTHING;

-- Inserir tickets de exemplo
INSERT INTO tickets (empresa, plataforma, departamento, descricao, status, em_implementacao, criado_por, criado_em) VALUES
('Tech Solutions Ltda', 'INTERCOM', 'Criação', 'Problema com integração de API', 'Em Andamento', true, 'Maria Santos', '2024-01-15T10:30:00Z'),
('Inovação Digital', 'GRONERZAP', 'Precificação', 'Erro no cálculo de preços', 'Resolvido', false, 'Pedro Costa', '2024-01-14T14:20:00Z'),
('StartUp ABC', 'INTERCOM', 'Fluxos', 'Configuração de workflow', 'Pendente', true, 'Ana Oliveira', '2024-01-13T09:15:00Z'),
('Empresa XYZ', 'GRONERZAP', 'Criação', 'Customização de template', 'Em Andamento', false, 'Maria Santos', '2024-01-12T16:45:00Z'),
('Global Corp', 'INTERCOM', 'Precificação', 'Integração com sistema de pagamento', 'Resolvido', true, 'Pedro Costa', '2024-01-11T11:30:00Z'),
('Futuro Solar', 'INTERCOM', 'Suporte', 'Mensagem automática fim de expediente', 'Resolvido', false, 'João Silva', '2024-01-10T09:00:00Z'),
('MV2 Engenharia', 'INTERCOM', 'Suporte', 'UpSell e DownSell', 'Em Andamento', true, 'João Silva', '2024-01-09T14:30:00Z'),
('Solar Energy', 'GRONERZAP', 'Automações', 'Configuração de bot', 'Resolvido', false, 'Maria Santos', '2023-12-20T10:30:00Z'),
('Tech Startup', 'INTERCOM', 'Fluxos', 'Otimização de processo', 'Resolvido', true, 'Pedro Costa', '2023-12-15T14:20:00Z'),
('Digital Agency', 'GRONERZAP', 'Criação', 'Design de templates', 'Resolvido', false, 'Ana Oliveira', '2023-11-25T09:15:00Z'),
('E-commerce Plus', 'INTERCOM', 'Precificação', 'Sistema de descontos', 'Resolvido', true, 'Maria Santos', '2023-11-10T16:45:00Z'),
('Marketing Pro', 'GRONERZAP', 'Automações', 'Campanhas automatizadas', 'Resolvido', false, 'Pedro Costa', '2023-10-28T11:30:00Z'),
('Business Solutions', 'INTERCOM', 'Suporte', 'FAQ automatizado', 'Resolvido', true, 'João Silva', '2023-10-15T09:00:00Z'),
('Innovation Lab', 'GRONERZAP', 'TechLead', 'Arquitetura de sistema', 'Resolvido', false, 'Ana Oliveira', '2023-09-20T14:30:00Z'),
('Growth Company', 'INTERCOM', 'Fluxos', 'Processo de onboarding', 'Resolvido', true, 'Maria Santos', '2023-09-05T10:30:00Z');
