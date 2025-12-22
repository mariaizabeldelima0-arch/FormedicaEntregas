-- Criar tabela sedex_disktenha para gerenciar entregas via correios
CREATE TABLE IF NOT EXISTS public.sedex_disktenha (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL DEFAULT 'SEDEX', -- SEDEX, PAC ou DISKTENHA
  cliente VARCHAR(255) NOT NULL,
  remetente VARCHAR(255),
  codigo_rastreio VARCHAR(100) NOT NULL UNIQUE,
  valor DECIMAL(10,2) DEFAULT 0,
  forma_pagamento VARCHAR(50) DEFAULT 'Pago',
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'Pendente', -- Pendente, Saiu, Entregue
  data_saida DATE NOT NULL,
  data_entrega DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sedex_disktenha_data_saida ON public.sedex_disktenha(data_saida);
CREATE INDEX IF NOT EXISTS idx_sedex_disktenha_status ON public.sedex_disktenha(status);
CREATE INDEX IF NOT EXISTS idx_sedex_disktenha_codigo_rastreio ON public.sedex_disktenha(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_sedex_disktenha_cliente ON public.sedex_disktenha(cliente);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_sedex_disktenha_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS sedex_disktenha_updated_at_trigger ON public.sedex_disktenha;
CREATE TRIGGER sedex_disktenha_updated_at_trigger
  BEFORE UPDATE ON public.sedex_disktenha
  FOR EACH ROW
  EXECUTE FUNCTION update_sedex_disktenha_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.sedex_disktenha ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
-- Usuários autenticados podem ver todas as entregas
CREATE POLICY "Usuários autenticados podem visualizar entregas sedex/disktenha"
  ON public.sedex_disktenha
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir entregas
CREATE POLICY "Usuários autenticados podem inserir entregas sedex/disktenha"
  ON public.sedex_disktenha
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem atualizar entregas
CREATE POLICY "Usuários autenticados podem atualizar entregas sedex/disktenha"
  ON public.sedex_disktenha
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem deletar entregas
CREATE POLICY "Usuários autenticados podem deletar entregas sedex/disktenha"
  ON public.sedex_disktenha
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO public.sedex_disktenha (tipo, cliente, codigo_rastreio, valor, forma_pagamento, status, data_saida, remetente)
VALUES
  ('SEDEX', 'João Silva', 'BR123456789BR', 15.50, 'Pago', 'Saiu', CURRENT_DATE, 'Formédica'),
  ('PAC', 'Ana Costa', 'BR999888777BR', 10.00, 'Pago', 'Pendente', CURRENT_DATE, 'Formédica'),
  ('DISKTENHA', 'Maria Santos', 'DK987654321BR', 12.00, 'A Pagar', 'Pendente', CURRENT_DATE, 'Formédica'),
  ('SEDEX', 'Pedro Oliveira', 'BR111222333BR', 18.00, 'Pago', 'Entregue', CURRENT_DATE - INTERVAL '1 day', 'Formédica')
ON CONFLICT (codigo_rastreio) DO NOTHING;
