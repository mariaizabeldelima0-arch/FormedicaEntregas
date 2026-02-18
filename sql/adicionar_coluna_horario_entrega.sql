-- Adicionar coluna horario_entrega na tabela entregas
-- Armazena o horário de entrega como texto formatado
-- Exemplos: "de 8H até 12H", "até 14H", "antes das 10H", "depois das 16H"
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS horario_entrega TEXT;
