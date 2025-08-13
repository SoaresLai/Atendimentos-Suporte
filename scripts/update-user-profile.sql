-- Script para adicionar colunas de perfil de usuário
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas email e avatar se não existirem
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Criar índice para email (opcional, para performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar Storage para avatars (execute no painel do Supabase)
-- 1. Vá para Storage no painel do Supabase
-- 2. Crie um bucket chamado "avatars"
-- 3. Configure como público
-- 4. Execute as políticas abaixo:

-- Política para permitir upload de avatars
-- CREATE POLICY "Users can upload their own avatar" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir visualização de avatars
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
-- FOR SELECT USING (bucket_id = 'avatars');

-- Política para permitir atualização de avatars
-- CREATE POLICY "Users can update their own avatar" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir exclusão de avatars
-- CREATE POLICY "Users can delete their own avatar" ON storage.objects
-- FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
