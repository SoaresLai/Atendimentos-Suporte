-- Script de migração para adicionar ticket_id
-- Execute este script se a tabela tickets já existe

-- Adicionar coluna ticket_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'ticket_id') THEN
        ALTER TABLE tickets ADD COLUMN ticket_id VARCHAR(50);
        
        -- Gerar ticket_id para registros existentes
        UPDATE tickets 
        SET ticket_id = 'TKT-' || id::text || '-' || 
                       substr(md5(random()::text), 1, 5)
        WHERE ticket_id IS NULL;
        
        -- Tornar a coluna NOT NULL e UNIQUE
        ALTER TABLE tickets ALTER COLUMN ticket_id SET NOT NULL;
        ALTER TABLE tickets ADD CONSTRAINT tickets_ticket_id_unique UNIQUE (ticket_id);
    END IF;
END $$;
