-- Adiciona rastreamento de impressão nos romaneios
ALTER TABLE entregas
  ADD COLUMN IF NOT EXISTS impresso boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_impressao timestamptz;
