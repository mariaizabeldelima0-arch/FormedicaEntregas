-- Adicionar colunas para controle de troco na tabela entregas
-- Executar este script no Supabase SQL Editor

-- Adicionar coluna precisa_troco
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS precisa_troco BOOLEAN DEFAULT false;

-- Adicionar coluna valor_troco
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS valor_troco DECIMAL(10, 2) DEFAULT 0;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN public.entregas.precisa_troco IS 'Indica se o cliente precisa de troco (apenas para forma_pagamento = Receber Dinheiro)';
COMMENT ON COLUMN public.entregas.valor_troco IS 'Valor com o qual o cliente irá pagar (para calcular o troco)';
