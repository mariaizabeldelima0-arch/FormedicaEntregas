-- ============================================
-- DADOS DE TESTE - Formédica Entregas
-- ============================================
-- Execute DEPOIS de rodar o supabase-schema.sql

-- ============================================
-- CLIENTES DE TESTE
-- ============================================

-- Cliente 1: João Silva
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('João Silva', '12345678901', '(47) 99999-9999', 'joao@email.com')
ON CONFLICT DO NOTHING;

-- Endereço do Cliente 1
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua das Flores', '123', 'Centro', 'Balneário Camboriú', 'BC', true, 'Rua das Flores, 123 - Centro, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '12345678901'
ON CONFLICT DO NOTHING;

-- Cliente 2: Maria Santos
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('Maria Santos', '98765432109', '(47) 98888-8888', 'maria@email.com')
ON CONFLICT DO NOTHING;

-- Endereços do Cliente 2 (2 endereços)
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Av. Brasil', '456', 'Centro', 'Itajaí', 'ITAJAI', true, 'Av. Brasil, 456 - Centro, Itajaí - SC'
FROM public.clientes WHERE cpf = '98765432109'
ON CONFLICT DO NOTHING;

INSERT INTO public.enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua São Paulo', '789', 'Apto 102', 'Vila Real', 'Itajaí', 'ITAJAI', false, 'Rua São Paulo, 789 - Apto 102 - Vila Real, Itajaí - SC'
FROM public.clientes WHERE cpf = '98765432109'
ON CONFLICT DO NOTHING;

-- Cliente 3: Pedro Oliveira
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('Pedro Oliveira', '11122233344', '(47) 97777-7777', 'pedro@email.com')
ON CONFLICT DO NOTHING;

-- Endereço do Cliente 3
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua Camboriú', '321', 'Centro', 'Balneário Camboriú', 'CAMBORIÚ', true, 'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '11122233344'
ON CONFLICT DO NOTHING;

-- Cliente 4: Ana Costa
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('Ana Costa', '55566677788', '(47) 96666-6666', 'ana@email.com')
ON CONFLICT DO NOTHING;

-- Endereço do Cliente 4
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Av. Atlântica', '1000', 'Praia Brava', 'Balneário Camboriú', 'PRAIA BRAVA', true, 'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '55566677788'
ON CONFLICT DO NOTHING;

-- Cliente 5: Carlos Mendes
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('Carlos Mendes', '99988877766', '(47) 95555-5555', 'carlos@email.com')
ON CONFLICT DO NOTHING;

-- Endereço do Cliente 5
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua Itapema', '555', 'Centro', 'Itapema', 'ITAPEMA', true, 'Rua Itapema, 555 - Centro, Itapema - SC'
FROM public.clientes WHERE cpf = '99988877766'
ON CONFLICT DO NOTHING;

-- ============================================
-- ENTREGAS DE TESTE
-- ============================================

-- Pegar IDs dos motoboys
DO $$
DECLARE
    marcio_id UUID;
    bruno_id UUID;
    joao_id UUID;
    maria_id UUID;
    pedro_id UUID;
    ana_id UUID;
    carlos_id UUID;
    joao_end_id UUID;
    maria_end_id UUID;
    pedro_end_id UUID;
    ana_end_id UUID;
    carlos_end_id UUID;
BEGIN
    -- Buscar IDs
    SELECT id INTO marcio_id FROM public.motoboys WHERE nome = 'Marcio' LIMIT 1;
    SELECT id INTO bruno_id FROM public.motoboys WHERE nome = 'Bruno' LIMIT 1;
    SELECT id INTO joao_id FROM public.clientes WHERE cpf = '12345678901' LIMIT 1;
    SELECT id INTO maria_id FROM public.clientes WHERE cpf = '98765432109' LIMIT 1;
    SELECT id INTO pedro_id FROM public.clientes WHERE cpf = '11122233344' LIMIT 1;
    SELECT id INTO ana_id FROM public.clientes WHERE cpf = '55566677788' LIMIT 1;
    SELECT id INTO carlos_id FROM public.clientes WHERE cpf = '99988877766' LIMIT 1;

    -- Buscar IDs dos endereços
    SELECT id INTO joao_end_id FROM public.enderecos WHERE cliente_id = joao_id LIMIT 1;
    SELECT id INTO maria_end_id FROM public.enderecos WHERE cliente_id = maria_id AND is_principal = true LIMIT 1;
    SELECT id INTO pedro_end_id FROM public.enderecos WHERE cliente_id = pedro_id LIMIT 1;
    SELECT id INTO ana_end_id FROM public.enderecos WHERE cliente_id = ana_id LIMIT 1;
    SELECT id INTO carlos_end_id FROM public.enderecos WHERE cliente_id = carlos_id LIMIT 1;

    -- Entrega 1: Hoje - Produzindo
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        joao_id, joao_end_id, marcio_id, 'REQ-001',
        'Rua das Flores, 123 - Centro, Balneário Camboriú - SC', 'BC',
        CURRENT_DATE, 'Tarde',
        'Produzindo no Laboratório', 'Pago', 9.00, false, false
    ) ON CONFLICT (requisicao) DO NOTHING;

    -- Entrega 2: Hoje - A Caminho
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        maria_id, maria_end_id, bruno_id, 'REQ-002',
        'Av. Brasil, 456 - Centro, Itajaí - SC', 'ITAJAI',
        CURRENT_DATE, 'Tarde',
        'A Caminho', 'Dinheiro', 17.00, true, false
    ) ON CONFLICT (requisicao) DO NOTHING;

    -- Entrega 3: Hoje - Entregue
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        pedro_id, pedro_end_id, marcio_id, 'REQ-003',
        'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC', 'CAMBORIÚ',
        CURRENT_DATE, 'Manhã',
        'Entregue', 'Maquina', 16.00, false, true
    ) ON CONFLICT (requisicao) DO NOTHING;

    -- Entrega 4: Hoje - Produzindo (Item de Geladeira)
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        ana_id, ana_end_id, bruno_id, 'REQ-004',
        'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC', 'PRAIA BRAVA',
        CURRENT_DATE, 'Tarde',
        'Produzindo no Laboratório', 'Pix - Aguardando', 11.50, true, false
    ) ON CONFLICT (requisicao) DO NOTHING;

    -- Entrega 5: Amanhã
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        carlos_id, carlos_end_id, bruno_id, 'REQ-005',
        'Rua Itapema, 555 - Centro, Itapema - SC', 'ITAPEMA',
        CURRENT_DATE + INTERVAL '1 day', 'Manhã',
        'Produzindo no Laboratório', 'Só Entregar', 25.00, false, true
    ) ON CONFLICT (requisicao) DO NOTHING;

    -- Entrega 6: Hoje - A Caminho
    INSERT INTO public.entregas (
        cliente_id, endereco_id, motoboy_id, requisicao,
        endereco_destino, regiao, data_entrega, periodo,
        status, forma_pagamento, valor, item_geladeira, buscar_receita
    ) VALUES (
        joao_id, joao_end_id, marcio_id, 'REQ-006',
        'Rua das Flores, 123 - Centro, Balneário Camboriú - SC', 'BC',
        CURRENT_DATE, 'Tarde',
        'A Caminho', 'Troco P/', 9.00, false, false
    ) ON CONFLICT (requisicao) DO NOTHING;

END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Contar registros inseridos
SELECT 'Clientes cadastrados:' as tabela, COUNT(*) as total FROM public.clientes
UNION ALL
SELECT 'Endereços cadastrados:', COUNT(*) FROM public.enderecos
UNION ALL
SELECT 'Motoboys cadastrados:', COUNT(*) FROM public.motoboys
UNION ALL
SELECT 'Entregas cadastradas:', COUNT(*) FROM public.entregas;

-- ============================================
-- CONCLUÍDO!
-- ============================================
