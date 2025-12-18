-- Inserir Clientes de Teste
INSERT INTO public.clientes (nome, cpf, telefone, email) VALUES
('João Silva', '12345678901', '(47) 99999-9999', 'joao@email.com'),
('Maria Santos', '98765432109', '(47) 98888-8888', 'maria@email.com'),
('Pedro Oliveira', '11122233344', '(47) 97777-7777', 'pedro@email.com'),
('Ana Costa', '55566677788', '(47) 96666-6666', 'ana@email.com'),
('Carlos Mendes', '99988877766', '(47) 95555-5555', 'carlos@email.com');

-- Inserir Endereços
INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua das Flores', '123', 'Centro', 'Balneário Camboriú', 'BC', true, 'Rua das Flores, 123 - Centro, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '12345678901';

INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Av. Brasil', '456', 'Centro', 'Itajaí', 'ITAJAI', true, 'Av. Brasil, 456 - Centro, Itajaí - SC'
FROM public.clientes WHERE cpf = '98765432109';

INSERT INTO public.enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua São Paulo', '789', 'Apto 102', 'Vila Real', 'Itajaí', 'ITAJAI', false, 'Rua São Paulo, 789 - Apto 102 - Vila Real, Itajaí - SC'
FROM public.clientes WHERE cpf = '98765432109';

INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua Camboriú', '321', 'Centro', 'Balneário Camboriú', 'CAMBORIÚ', true, 'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '11122233344';

INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Av. Atlântica', '1000', 'Praia Brava', 'Balneário Camboriú', 'PRAIA BRAVA', true, 'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC'
FROM public.clientes WHERE cpf = '55566677788';

INSERT INTO public.enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal, endereco_completo)
SELECT id, 'Rua Itapema', '555', 'Centro', 'Itapema', 'ITAPEMA', true, 'Rua Itapema, 555 - Centro, Itapema - SC'
FROM public.clientes WHERE cpf = '99988877766';

-- Inserir Entregas de Teste (para HOJE)
INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Marcio' LIMIT 1),
    'REQ-001',
    'Rua das Flores, 123 - Centro, Balneário Camboriú - SC',
    'BC',
    CURRENT_DATE,
    'Tarde',
    'Produzindo no Laboratório',
    'Pago',
    9.00,
    false,
    false
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '12345678901' AND e.is_principal = true;

INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Bruno' LIMIT 1),
    'REQ-002',
    'Av. Brasil, 456 - Centro, Itajaí - SC',
    'ITAJAI',
    CURRENT_DATE,
    'Tarde',
    'A Caminho',
    'Dinheiro',
    17.00,
    true,
    false
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '98765432109' AND e.is_principal = true;

INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Marcio' LIMIT 1),
    'REQ-003',
    'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC',
    'CAMBORIÚ',
    CURRENT_DATE,
    'Manhã',
    'Entregue',
    'Maquina',
    16.00,
    false,
    true
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '11122233344' AND e.is_principal = true;

INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Bruno' LIMIT 1),
    'REQ-004',
    'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC',
    'PRAIA BRAVA',
    CURRENT_DATE,
    'Tarde',
    'Produzindo no Laboratório',
    'Pix - Aguardando',
    11.50,
    true,
    false
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '55566677788' AND e.is_principal = true;

INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Bruno' LIMIT 1),
    'REQ-005',
    'Rua Itapema, 555 - Centro, Itapema - SC',
    'ITAPEMA',
    CURRENT_DATE + INTERVAL '1 day',
    'Manhã',
    'Produzindo no Laboratório',
    'Só Entregar',
    25.00,
    false,
    true
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '99988877766' AND e.is_principal = true;

INSERT INTO public.entregas (
    cliente_id, endereco_id, motoboy_id, requisicao,
    endereco_destino, regiao, data_entrega, periodo,
    status, forma_pagamento, valor, item_geladeira, buscar_receita
)
SELECT
    c.id,
    e.id,
    (SELECT id FROM public.motoboys WHERE nome = 'Marcio' LIMIT 1),
    'REQ-006',
    'Rua das Flores, 123 - Centro, Balneário Camboriú - SC',
    'BC',
    CURRENT_DATE,
    'Tarde',
    'A Caminho',
    'Troco P/',
    9.00,
    false,
    false
FROM public.clientes c
JOIN public.enderecos e ON c.id = e.cliente_id
WHERE c.cpf = '12345678901' AND e.is_principal = true;

-- Verificar dados inseridos
SELECT 'Clientes cadastrados:' as info, COUNT(*) as total FROM public.clientes
UNION ALL
SELECT 'Endereços cadastrados:', COUNT(*) FROM public.enderecos
UNION ALL
SELECT 'Entregas cadastradas:', COUNT(*) FROM public.entregas;
