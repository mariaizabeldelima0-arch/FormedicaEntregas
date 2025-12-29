-- Criar tabela de dispositivos
CREATE TABLE IF NOT EXISTS dispositivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL,
  impressao_digital TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Autorizado', 'Pendente', 'Bloqueado')),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_dispositivos_status ON dispositivos(status);
CREATE INDEX IF NOT EXISTS idx_dispositivos_usuario ON dispositivos(usuario);
CREATE INDEX IF NOT EXISTS idx_dispositivos_impressao_digital ON dispositivos(impressao_digital);
CREATE INDEX IF NOT EXISTS idx_dispositivos_ultimo_acesso ON dispositivos(ultimo_acesso DESC);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_dispositivos_updated_at ON dispositivos;
CREATE TRIGGER update_dispositivos_updated_at
  BEFORE UPDATE ON dispositivos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados"
  ON dispositivos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados"
  ON dispositivos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados"
  ON dispositivos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados"
  ON dispositivos
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir alguns dados de exemplo (opcional - remova se não quiser)
INSERT INTO dispositivos (nome, usuario, impressao_digital, status, ultimo_acesso) VALUES
  ('Chrome no Windows', 'maria@zabeldel.ma5@gmail.com', 'DEVw6622', 'Pendente', '2025-12-13 10:50:00'),
  ('Chrome no Windows', 'maria@zabeldel.ma0@gmail.com', 'DEVw6623', 'Pendente', '2025-12-13 10:52:00'),
  ('Chrome no Windows', 'maria@zabeldel.ma5@gmail.com', 'DEVw84PR', 'Autorizado', '2025-11-28 17:02:00'),
  ('Safari no macOS', 'maria@zabeldel.ma0@gmail.com', 'DEV2PNFB', 'Autorizado', '2025-03-12 21:37:00'),
  ('Chrome no Windows', 'maria@zabeldel.ma0@gmail.com', 'DEVw84XR', 'Autorizado', '2025-10-12 14:18:00')
ON CONFLICT (impressao_digital) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE dispositivos IS 'Tabela para gerenciar dispositivos autorizados a acessar o sistema';
COMMENT ON COLUMN dispositivos.id IS 'Identificador único do dispositivo';
COMMENT ON COLUMN dispositivos.nome IS 'Nome do dispositivo (ex: Chrome no Windows, Safari no macOS)';
COMMENT ON COLUMN dispositivos.usuario IS 'Email do usuário dono do dispositivo';
COMMENT ON COLUMN dispositivos.impressao_digital IS 'Fingerprint único do dispositivo';
COMMENT ON COLUMN dispositivos.status IS 'Status do dispositivo: Autorizado, Pendente ou Bloqueado';
COMMENT ON COLUMN dispositivos.ultimo_acesso IS 'Data e hora do último acesso do dispositivo';
COMMENT ON COLUMN dispositivos.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN dispositivos.updated_at IS 'Data e hora da última atualização do registro';
