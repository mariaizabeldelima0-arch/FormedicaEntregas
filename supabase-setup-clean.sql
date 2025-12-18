DROP TABLE IF EXISTS public.entregas CASCADE;
DROP TABLE IF EXISTS public.enderecos CASCADE;
DROP TABLE IF EXISTS public.motoboys CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Admin', 'Atendente', 'Motoboy')),
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.clientes (
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

CREATE TABLE public.enderecos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    endereco_completo TEXT,
    logradouro TEXT NOT NULL,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT NOT NULL,
    estado TEXT DEFAULT 'SC',
    cep TEXT,
    regiao TEXT,
    is_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.motoboys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    endereco_id UUID REFERENCES public.enderecos(id) ON DELETE SET NULL,
    motoboy_id UUID REFERENCES public.motoboys(id) ON DELETE SET NULL,
    atendente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    requisicao TEXT UNIQUE NOT NULL,
    endereco_destino TEXT,
    regiao TEXT,
    outra_cidade TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    data_entrega DATE NOT NULL,
    periodo TEXT CHECK (periodo IN ('Manhã', 'Tarde')),
    tipo TEXT DEFAULT 'moto' CHECK (tipo IN ('moto', 'carro')),
    status TEXT DEFAULT 'Produzindo no Laboratório',
    forma_pagamento TEXT,
    valor DECIMAL(10, 2) DEFAULT 0,
    item_geladeira BOOLEAN DEFAULT false,
    buscar_receita BOOLEAN DEFAULT false,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.motoboys (nome, telefone, ativo) VALUES
    ('Marcio', NULL, true),
    ('Bruno', NULL, true);

INSERT INTO public.usuarios (nome, cpf, senha, tipo, ativo) VALUES
    ('Administrador', '00000000000', 'admin123', 'Admin', true);
