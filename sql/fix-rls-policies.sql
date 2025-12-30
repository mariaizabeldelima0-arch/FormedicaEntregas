-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON dispositivos;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON dispositivos;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON dispositivos;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON dispositivos;

-- Criar políticas que permitem acesso público (anon + authenticated)
CREATE POLICY "Permitir leitura pública"
  ON dispositivos
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública"
  ON dispositivos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública"
  ON dispositivos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública"
  ON dispositivos
  FOR DELETE
  USING (true);

-- Inserir dados de exemplo novamente
INSERT INTO dispositivos (nome, usuario, impressao_digital, status, ultimo_acesso) VALUES
  ('Chrome no Windows', 'mariazabeldel.ma5@gmail.com', 'DEVw6622', 'Pendente', '2025-12-13 10:50:00'),
  ('Chrome no Windows', 'mariazabeldel.ma0@gmail.com', 'DEVw6623', 'Pendente', '2025-12-13 10:52:00'),
  ('Chrome no Windows', 'mariazabeldel.ma5@gmail.com', 'DEVw84PR', 'Autorizado', '2025-11-28 17:02:00'),
  ('Safari no macOS', 'mariazabeldel.ma0@gmail.com', 'DEV2PNFB', 'Autorizado', '2025-03-12 21:37:00'),
  ('Chrome no Windows', 'mariazabeldel.ma0@gmail.com', 'DEVw84XR', 'Autorizado', '2025-10-12 14:18:00')
ON CONFLICT (impressao_digital) DO NOTHING;
