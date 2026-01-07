-- Remover romaneios duplicados (com sufixo -1, -2, -3, etc)
-- Mantém apenas o romaneio principal (sem sufixo)

DELETE FROM public.entregas
WHERE requisicao ~ '-[0-9]+$'  -- Regex: termina com hífen seguido de números
AND tipo = 'moto';

-- Verificar quais seriam removidos antes de executar (comentar DELETE acima e descomentar abaixo):
-- SELECT id, requisicao, cliente_id, data_criacao
-- FROM public.entregas
-- WHERE requisicao ~ '-[0-9]+$'
-- AND tipo = 'moto'
-- ORDER BY requisicao;
