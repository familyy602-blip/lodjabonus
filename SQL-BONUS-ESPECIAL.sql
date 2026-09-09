-- Executar no SQL Editor do Supabase (uma vez)
CREATE TABLE IF NOT EXISTS bonus_especial_participacoes (
  id TEXT PRIMARY KEY,
  campanha_id TEXT NOT NULL,
  cliente_id TEXT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  device_id TEXT NOT NULL,
  premio_id TEXT,
  premio_nome TEXT,
  premio_descricao TEXT,
  codigo TEXT,
  data_participacao TIMESTAMPTZ DEFAULT NOW(),
  estado TEXT DEFAULT 'concluido'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bonus_esp_campanha_device
  ON bonus_especial_participacoes (campanha_id, device_id);

CREATE INDEX IF NOT EXISTS idx_bonus_esp_campanha ON bonus_especial_participacoes (campanha_id);
CREATE INDEX IF NOT EXISTS idx_bonus_esp_telefone ON bonus_especial_participacoes (cliente_telefone);

ALTER TABLE bonus_especial_participacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo bonus especial" ON bonus_especial_participacoes;
CREATE POLICY "Permitir tudo bonus especial" ON bonus_especial_participacoes FOR ALL USING (true) WITH CHECK (true);
