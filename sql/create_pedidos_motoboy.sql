-- Tabela de pedidos do motoboy na farmácia
CREATE TABLE IF NOT EXISTS public.pedidos_motoboy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motoboy_id UUID NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
    registrado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nome_formula TEXT NOT NULL,
    numero_requisicao TEXT NOT NULL,
    data_pedido DATE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    num_parcelas INTEGER NOT NULL DEFAULT 1,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_pedidos_motoboy_motoboy ON public.pedidos_motoboy(motoboy_id);
CREATE INDEX idx_pedidos_motoboy_data ON public.pedidos_motoboy(data_pedido);
CREATE INDEX idx_pedidos_motoboy_registrado ON public.pedidos_motoboy(registrado_por);

-- Tabela de parcelas dos pedidos
CREATE TABLE IF NOT EXISTS public.parcelas_pedido_motoboy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos_motoboy(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL DEFAULT 1,
    valor_parcela DECIMAL(10, 2) NOT NULL DEFAULT 0,
    semana_inicio DATE NOT NULL,  -- Data da terça-feira que inicia a semana
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'descontado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_parcelas_pedido ON public.parcelas_pedido_motoboy(pedido_id);
CREATE INDEX idx_parcelas_semana ON public.parcelas_pedido_motoboy(semana_inicio);
CREATE INDEX idx_parcelas_status ON public.parcelas_pedido_motoboy(status);

-- Triggers de updated_at
CREATE TRIGGER update_pedidos_motoboy_updated_at
    BEFORE UPDATE ON public.pedidos_motoboy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelas_pedido_motoboy_updated_at
    BEFORE UPDATE ON public.parcelas_pedido_motoboy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.pedidos_motoboy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_pedido_motoboy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de pedidos" ON public.pedidos_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pedidos" ON public.pedidos_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pedidos" ON public.pedidos_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de pedidos" ON public.pedidos_motoboy FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de parcelas" ON public.parcelas_pedido_motoboy FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de parcelas" ON public.parcelas_pedido_motoboy FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de parcelas" ON public.parcelas_pedido_motoboy FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de parcelas" ON public.parcelas_pedido_motoboy FOR DELETE USING (true);
