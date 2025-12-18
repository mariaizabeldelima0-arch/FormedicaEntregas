-- ============================================
-- FORMEDICA ENTREGAS - Schema SQL Completo
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: usuarios
-- Para login e controle de acesso
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL, -- Armazene hash bcrypt
    tipo TEXT NOT NULL CHECK (tipo IN ('Admin', 'Atendente', 'Motoboy')),
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para performance
CREATE INDEX idx_usuarios_cpf ON public.usuarios(cpf);
CREATE INDEX idx_usuarios_tipo ON public.usuarios(tipo);

-- ============================================
-- 2. TABELA: clientes
-- Informações dos clientes
-- ============================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    email TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para busca rápida
CREATE INDEX idx_clientes_nome ON public.clientes USING gin(nome gin_trgm_ops);
CREATE INDEX idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);

-- Habilitar busca por texto (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 3. TABELA: enderecos
-- Múltiplos endereços por cliente
-- ============================================
CREATE TABLE IF NOT EXISTS public.enderecos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,

    -- Endereço completo formatado
    endereco_completo TEXT,

    -- Campos separados
    logradouro TEXT NOT NULL,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT NOT NULL,
    estado TEXT DEFAULT 'SC',
    cep TEXT,

    -- Região para cálculo de frete
    regiao TEXT, -- BC, NOVA ESPERANÇA, CAMBORIÚ, etc.

    -- Endereço principal do cliente
    is_principal BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices
CREATE INDEX idx_enderecos_cliente ON public.enderecos(cliente_id);
CREATE INDEX idx_enderecos_regiao ON public.enderecos(regiao);

-- ============================================
-- 4. TABELA: motoboys
-- Informações dos motoboys
-- ============================================
CREATE TABLE IF NOT EXISTS public.motoboys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices
CREATE INDEX idx_motoboys_nome ON public.motoboys(nome);
CREATE INDEX idx_motoboys_usuario ON public.motoboys(usuario_id);

-- ============================================
-- 5. TABELA: entregas
-- Romaneios e entregas
-- ============================================
CREATE TABLE IF NOT EXISTS public.entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relacionamentos
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    endereco_id UUID REFERENCES public.enderecos(id) ON DELETE SET NULL,
    motoboy_id UUID REFERENCES public.motoboys(id) ON DELETE SET NULL,
    atendente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,

    -- Informações da requisição
    requisicao TEXT UNIQUE NOT NULL,

    -- Endereço (compatibilidade + fallback)
    endereco_destino TEXT, -- Texto livre se não usar enderecos cadastrados
    regiao TEXT,
    outra_cidade TEXT, -- Quando região = 'OUTRO'

    -- Datas
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    data_entrega DATE NOT NULL,
    periodo TEXT CHECK (periodo IN ('Manhã', 'Tarde')),

    -- Tipo e Status
    tipo TEXT DEFAULT 'moto' CHECK (tipo IN ('moto', 'carro')),
    status TEXT DEFAULT 'Produzindo no Laboratório',

    -- Pagamento
    forma_pagamento TEXT,
    valor DECIMAL(10, 2) DEFAULT 0,

    -- Flags especiais
    item_geladeira BOOLEAN DEFAULT false,
    buscar_receita BOOLEAN DEFAULT false,

    -- Observações
    observacoes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para performance
CREATE INDEX idx_entregas_cliente ON public.entregas(cliente_id);
CREATE INDEX idx_entregas_motoboy ON public.entregas(motoboy_id);
CREATE INDEX idx_entregas_atendente ON public.entregas(atendente_id);
CREATE INDEX idx_entregas_data_entrega ON public.entregas(data_entrega);
CREATE INDEX idx_entregas_status ON public.entregas(status);
CREATE INDEX idx_entregas_requisicao ON public.entregas(requisicao);
CREATE INDEX idx_entregas_regiao ON public.entregas(regiao);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enderecos_updated_at BEFORE UPDATE ON public.enderecos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motoboys_updated_at BEFORE UPDATE ON public.motoboys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON public.entregas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir motoboys (Marcio e Bruno)
INSERT INTO public.motoboys (nome, telefone, ativo) VALUES
    ('Marcio', NULL, true),
    ('Bruno', NULL, true)
ON CONFLICT DO NOTHING;

-- Inserir usuário admin padrão (IMPORTANTE: trocar a senha!)
-- Senha: "admin123" (hash bcrypt - TROQUE ISSO EM PRODUÇÃO!)
INSERT INTO public.usuarios (nome, cpf, senha, tipo, ativo) VALUES
    ('Administrador', '00000000000', '$2b$10$rKJ0YwJQz9YRHqVJYxZ3.OYxJ0YwJQz9YRHqVJYxZ3.OYxJ0YwJQz', 'Admin', true)
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Descomente se quiser ativar RLS

-- ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.motoboys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Exemplo de política: todos podem ler clientes (ajuste conforme necessário)
-- CREATE POLICY "Permitir leitura de clientes" ON public.clientes FOR SELECT USING (true);
-- CREATE POLICY "Permitir inserção de clientes" ON public.clientes FOR INSERT WITH CHECK (true);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Entregas com informações completas
CREATE OR REPLACE VIEW entregas_completas AS
SELECT
    e.id,
    e.requisicao,
    e.data_entrega,
    e.periodo,
    e.status,
    e.valor,
    e.forma_pagamento,
    e.item_geladeira,
    e.buscar_receita,
    e.regiao,
    e.outra_cidade,
    e.observacoes,
    e.created_at,

    -- Cliente
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,

    -- Endereço
    COALESCE(end.endereco_completo, e.endereco_destino) as endereco,
    end.cidade as endereco_cidade,
    end.bairro as endereco_bairro,

    -- Motoboy
    m.nome as motoboy_nome,

    -- Atendente
    u.nome as atendente_nome

FROM public.entregas e
LEFT JOIN public.clientes c ON e.cliente_id = c.id
LEFT JOIN public.enderecos end ON e.endereco_id = end.id
LEFT JOIN public.motoboys m ON e.motoboy_id = m.id
LEFT JOIN public.usuarios u ON e.atendente_id = u.id;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função: Buscar clientes por termo (nome, CPF, telefone)
CREATE OR REPLACE FUNCTION buscar_clientes(search_term TEXT)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    cpf TEXT,
    telefone TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.nome, c.cpf, c.telefone, c.email
    FROM public.clientes c
    WHERE
        c.ativo = true
        AND (
            c.nome ILIKE '%' || search_term || '%'
            OR c.cpf ILIKE '%' || search_term || '%'
            OR c.telefone ILIKE '%' || search_term || '%'
        )
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Depois, configure as permissões (RLS) conforme necessário
