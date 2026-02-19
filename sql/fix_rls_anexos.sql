-- Adicionar políticas de UPDATE e DELETE na tabela anexos
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard > SQL Editor

-- Política para permitir atualização pública (UPDATE)
CREATE POLICY "Permitir atualização pública de anexos"
  ON anexos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão pública (DELETE)
CREATE POLICY "Permitir exclusão pública de anexos"
  ON anexos
  FOR DELETE
  USING (true);
