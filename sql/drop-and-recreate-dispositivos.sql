-- ============================================
-- Schema atual: Duas tabelas separadas
-- usuarios = credenciais e dados do usuário
-- dispositivos = autorização por navegador/PC
-- ============================================

-- Passo 1: Deletar tabelas (dispositivos primeiro por causa da FK)
DROP TABLE IF EXISTS dispositivos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Passo 2: Criar tabela de usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL DEFAULT 'atendente'
    CHECK (tipo_usuario IN ('admin', 'atendente', 'motoboy')),
  nome_motoboy TEXT,
  nome_atendente TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passo 3: Criar tabela de dispositivos
CREATE TABLE dispositivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  impressao_digital TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Autorizado', 'Pendente', 'Bloqueado')),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, impressao_digital)
);

-- Passo 4: Criar índices
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_dispositivos_usuario_id ON dispositivos(usuario_id);
CREATE INDEX idx_dispositivos_status ON dispositivos(status);
CREATE INDEX idx_dispositivos_impressao ON dispositivos(impressao_digital);
CREATE INDEX idx_dispositivos_ultimo_acesso ON dispositivos(ultimo_acesso DESC);

-- Passo 5: Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 6: Triggers
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispositivos_updated_at
  BEFORE UPDATE ON dispositivos FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Passo 7: RLS para usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir inserção usuarios" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização usuarios" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão usuarios" ON usuarios FOR DELETE USING (true);

-- Passo 8: RLS para dispositivos
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura dispositivos" ON dispositivos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção dispositivos" ON dispositivos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização dispositivos" ON dispositivos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão dispositivos" ON dispositivos FOR DELETE USING (true);

-- Comentários
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema (credenciais e perfil)';
COMMENT ON COLUMN usuarios.usuario IS 'Nome de login (único)';
COMMENT ON COLUMN usuarios.tipo_usuario IS 'Tipo: admin, atendente ou motoboy';
COMMENT ON COLUMN usuarios.ativo IS 'Se false, o usuário não pode fazer login';

COMMENT ON TABLE dispositivos IS 'Tabela de dispositivos autorizados por usuário';
COMMENT ON COLUMN dispositivos.usuario_id IS 'Referência ao usuário dono do dispositivo';
COMMENT ON COLUMN dispositivos.impressao_digital IS 'Fingerprint do navegador/dispositivo';
COMMENT ON COLUMN dispositivos.status IS 'Autorizado, Pendente ou Bloqueado';
