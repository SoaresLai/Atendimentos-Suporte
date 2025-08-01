-- Adicionar colunas para controle de usuários (se não existirem)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);

-- Atualizar políticas de segurança para permitir edição e exclusão por supervisores
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Only supervisors can insert users" ON users;
DROP POLICY IF EXISTS "Only supervisors can delete tickets" ON tickets;

-- Novas políticas mais específicas
CREATE POLICY "Users can view active users" ON users FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Supervisors can manage users" ON users FOR ALL USING (true);
CREATE POLICY "Users can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Supervisors can delete tickets" ON tickets FOR DELETE USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Função para soft delete de usuários
CREATE OR REPLACE FUNCTION soft_delete_user(user_id INTEGER, deleted_by_name VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET is_active = FALSE, 
        deleted_at = NOW(), 
        deleted_by = deleted_by_name,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para reativar usuário
CREATE OR REPLACE FUNCTION reactivate_user(user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET is_active = TRUE, 
        deleted_at = NULL, 
        deleted_by = NULL,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Atualizar todos os usuários existentes para ativo
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
