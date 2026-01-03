-- Remove romaneios duplicados criados antes da implementação do campo clientes_adicionais
-- Estes romaneios têm sufixos como -1, -2, etc. no número de requisição

DELETE FROM public.entregas
WHERE requisicao ~ '-[0-9]+$'  -- Regex: termina com hífen seguido de números
AND tipo = 'moto';
