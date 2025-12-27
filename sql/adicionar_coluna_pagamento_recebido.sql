-- Adicionar coluna pagamento_recebido à tabela entregas
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS pagamento_recebido BOOLEAN DEFAULT false;

-- Comentário da coluna
COMMENT ON COLUMN public.entregas.pagamento_recebido IS 'Indica se o pagamento da entrega foi recebido';
