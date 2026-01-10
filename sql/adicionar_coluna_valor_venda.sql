-- Adicionar coluna para valor a cobrar na tabela entregas
-- Executar este script no Supabase SQL Editor

-- Adicionar coluna valor_venda (valor a cobrar)
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(10, 2) DEFAULT 0;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.entregas.valor_venda IS 'Valor a cobrar (para formas de pagamento: Receber Dinheiro, Receber Máquina, Pagar MP)';
