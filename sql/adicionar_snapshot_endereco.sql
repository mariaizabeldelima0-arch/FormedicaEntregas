-- Adicionar campos de snapshot do endereço na tabela entregas
-- Isso permite que os romaneios mantenham os dados do endereço no momento da criação
-- Mesmo que o endereço seja alterado posteriormente no cadastro do cliente

ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS endereco_logradouro TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT;

COMMENT ON COLUMN public.entregas.endereco_logradouro IS 'Snapshot do logradouro no momento da criação do romaneio';
COMMENT ON COLUMN public.entregas.endereco_numero IS 'Snapshot do número no momento da criação do romaneio';
COMMENT ON COLUMN public.entregas.endereco_complemento IS 'Snapshot do complemento no momento da criação do romaneio';
COMMENT ON COLUMN public.entregas.endereco_bairro IS 'Snapshot do bairro no momento da criação do romaneio';
COMMENT ON COLUMN public.entregas.endereco_cidade IS 'Snapshot da cidade no momento da criação do romaneio';
COMMENT ON COLUMN public.entregas.endereco_cep IS 'Snapshot do CEP no momento da criação do romaneio';
