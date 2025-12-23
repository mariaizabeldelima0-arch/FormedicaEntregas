-- Script para configurar o bucket de storage para anexos
-- Execute este script no Supabase SQL Editor

-- Criar bucket de storage (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('entregas-anexos', 'entregas-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso ao bucket

-- Política para permitir upload (INSERT)
CREATE POLICY "Permitir upload de anexos autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'entregas-anexos');

-- Política para permitir leitura pública (SELECT)
CREATE POLICY "Permitir leitura pública de anexos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entregas-anexos');

-- Política para permitir atualização (UPDATE)
CREATE POLICY "Permitir atualização de anexos autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'entregas-anexos');

-- Política para permitir exclusão (DELETE)
CREATE POLICY "Permitir exclusão de anexos autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'entregas-anexos');
