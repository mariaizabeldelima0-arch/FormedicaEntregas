-- ============================================
-- MIGRAÇÃO: Separar usuarios e dispositivos
-- Executar no Supabase SQL Editor
-- ============================================

-- Passo 1: Criar tabela de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
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

-- Passo 2: Migrar usuarios distintos da tabela dispositivos antiga
-- Pega um registro por usuario (priorizando Autorizado e mais recente)
INSERT INTO usuarios (nome, usuario, senha, tipo_usuario, nome_motoboy, nome_atendente)
SELECT DISTINCT ON (d.usuario)
  COALESCE(NULLIF(d.nome_atendente, ''), NULLIF(d.nome_motoboy, ''), d.nome, d.usuario) as nome,
  d.usuario,
  d.senha,
  COALESCE(d.tipo_usuario, 'atendente'),
  d.nome_motoboy,
  d.nome_atendente
FROM dispositivos d
WHERE d.senha IS NOT NULL
ORDER BY d.usuario,
  CASE WHEN d.status = 'Autorizado' THEN 0 ELSE 1 END,
  d.ultimo_acesso DESC NULLS LAST
ON CONFLICT (usuario) DO NOTHING;

-- Passo 3: Renomear tabela antiga
ALTER TABLE dispositivos RENAME TO dispositivos_old;

-- Passo 4: Criar nova tabela dispositivos
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

-- Passo 5: Migrar apenas dispositivos com fingerprints reais
INSERT INTO dispositivos (usuario_id, nome, impressao_digital, status, ultimo_acesso, created_at)
SELECT
  u.id as usuario_id,
  d.nome,
  d.impressao_digital,
  d.status,
  d.ultimo_acesso,
  d.created_at
FROM dispositivos_old d
JOIN usuarios u ON u.usuario = d.usuario
WHERE d.impressao_digital NOT LIKE 'manual-%'
  AND d.impressao_digital NOT LIKE 'user-%'
ON CONFLICT (usuario_id, impressao_digital) DO NOTHING;

-- Passo 6: Remover tabela antiga
DROP TABLE dispositivos_old;

-- Passo 7: Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_dispositivos_usuario_id ON dispositivos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_status ON dispositivos(status);
CREATE INDEX IF NOT EXISTS idx_dispositivos_impressao ON dispositivos(impressao_digital);
CREATE INDEX IF NOT EXISTS idx_dispositivos_ultimo_acesso ON dispositivos(ultimo_acesso DESC);

-- Passo 8: RLS para tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir inserção usuarios" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização usuarios" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão usuarios" ON usuarios FOR DELETE USING (true);

-- Passo 9: RLS para tabela dispositivos
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura dispositivos" ON dispositivos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção dispositivos" ON dispositivos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização dispositivos" ON dispositivos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão dispositivos" ON dispositivos FOR DELETE USING (true);

-- Passo 10: Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispositivos_updated_at
  BEFORE UPDATE ON dispositivos FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
