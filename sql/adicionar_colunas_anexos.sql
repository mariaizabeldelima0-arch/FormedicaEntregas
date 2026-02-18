-- Script para adicionar colunas de anexos na tabela entregas

-- Adicionar colunas para Receita
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS receita_anexo TEXT,
ADD COLUMN IF NOT EXISTS receita_descricao TEXT;

-- Adicionar colunas para Pagamento
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS pagamento_anexo TEXT,
ADD COLUMN IF NOT EXISTS pagamento_descricao TEXT;

-- Adicionar colunas para Outros
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS outros_anexo TEXT,
ADD COLUMN IF NOT EXISTS outros_descricao TEXT;

-- Comentários para documentação
COMMENT ON COLUMN entregas.receita_anexo IS 'URL do anexo de receita';
COMMENT ON COLUMN entregas.receita_descricao IS 'Descrição do anexo de receita';
COMMENT ON COLUMN entregas.pagamento_anexo IS 'URL do anexo de comprovante de pagamento';
COMMENT ON COLUMN entregas.pagamento_descricao IS 'Descrição do anexo de pagamento';
COMMENT ON COLUMN entregas.outros_anexo IS 'URL de outros anexos';
COMMENT ON COLUMN entregas.outros_descricao IS 'Descrição de outros anexos';
