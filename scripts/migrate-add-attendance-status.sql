-- Script de migração para adicionar campos de status de atendimento
-- Execute este script se a tabela tickets já existe

-- Adicionar coluna status_atendimento se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'status_atendimento') THEN
        ALTER TABLE tickets ADD COLUMN status_atendimento VARCHAR(50) DEFAULT 'Criado';
        
        -- Adicionar constraint
        ALTER TABLE tickets ADD CONSTRAINT tickets_status_atendimento_check 
        CHECK (status_atendimento IN ('Criado', 'Em Atendimento', 'Finalizado'));
    END IF;
END $$;

-- Adicionar coluna iniciado_em se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'iniciado_em') THEN
        ALTER TABLE tickets ADD COLUMN iniciado_em TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Adicionar coluna finalizado_em se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'finalizado_em') THEN
        ALTER TABLE tickets ADD COLUMN finalizado_em TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
