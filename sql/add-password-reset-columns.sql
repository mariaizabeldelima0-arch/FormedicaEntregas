-- Adiciona suporte ao fluxo de troca de senha obrigatória e redefinição pelo admin
-- Executar no Supabase SQL Editor

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS solicitacao_redefinicao BOOLEAN DEFAULT false;
