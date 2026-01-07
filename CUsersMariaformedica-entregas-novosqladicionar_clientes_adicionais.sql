-- Adicionar coluna para armazenar clientes adicionais em um romaneio
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS clientes_adicionais JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.entregas.clientes_adicionais IS 'Array de IDs de clientes adicionais associados a este romaneio (além do cliente_id principal)';

-- Criar índice para busca eficiente
CREATE INDEX IF NOT EXISTS idx_entregas_clientes_adicionais ON public.entregas USING GIN (clientes_adicionais);
