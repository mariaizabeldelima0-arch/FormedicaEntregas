-- Popular os campos de snapshot de endereço em todos os romaneios existentes
-- Isso garante que alterações futuras nos endereços não afetem romaneios antigos

UPDATE public.entregas e
SET
  endereco_logradouro = endereco.logradouro,
  endereco_numero = endereco.numero,
  endereco_complemento = endereco.complemento,
  endereco_bairro = endereco.bairro,
  endereco_cidade = endereco.cidade,
  endereco_cep = endereco.cep
FROM public.enderecos endereco
WHERE e.endereco_id = endereco.id
  AND e.endereco_logradouro IS NULL  -- Só atualizar se ainda não tem snapshot
  AND e.tipo = 'moto';

-- Verificar quantos foram atualizados
SELECT COUNT(*) as total_atualizados
FROM public.entregas
WHERE endereco_logradouro IS NOT NULL
  AND tipo = 'moto';
