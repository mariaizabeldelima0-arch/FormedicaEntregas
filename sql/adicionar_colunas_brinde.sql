-- Adiciona opção de brinde nos romaneios
ALTER TABLE entregas
  ADD COLUMN IF NOT EXISTS enviar_brinde boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS brinde_descricao text;
