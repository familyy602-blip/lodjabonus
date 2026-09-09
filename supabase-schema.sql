-- =====================================================
-- BÓNUS DA LOJA - Schema Supabase
-- Executar no SQL Editor do Supabase
-- =====================================================

-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  codigo_cliente TEXT,
  no_grupo_whatsapp BOOLEAN DEFAULT false,
  total_pecas INTEGER DEFAULT 0,
  total_compras INTEGER DEFAULT 0,
  elegivel BOOLEAN DEFAULT false,
  token TEXT UNIQUE,
  token_usado BOOLEAN DEFAULT false,
  data_token_gerado TIMESTAMPTZ,
  data_sorteio TIMESTAMPTZ,
  ultimo_premio TEXT,
  ultimo_codigo TEXT,
  estado TEXT DEFAULT 'activo',
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPRAS
CREATE TABLE IF NOT EXISTS compras (
  id TEXT PRIMARY KEY,
  cliente_id TEXT REFERENCES clientes(id) ON DELETE CASCADE,
  numero_factura TEXT,
  quantidade_pecas INTEGER NOT NULL DEFAULT 1,
  valor NUMERIC(12,2) DEFAULT 0,
  data DATE DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PREMIOS
CREATE TABLE IF NOT EXISTS premios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  probabilidade NUMERIC(5,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SORTEIOS
CREATE TABLE IF NOT EXISTS sorteios (
  id TEXT PRIMARY KEY,
  cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  token TEXT,
  premio_id TEXT,
  premio_nome TEXT,
  premio_descricao TEXT,
  codigo TEXT UNIQUE,
  data_sorteio TIMESTAMPTZ DEFAULT NOW(),
  estado TEXT DEFAULT 'premio_pendente',
  data_entrega TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONFIG
CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_token ON clientes(token);
CREATE INDEX IF NOT EXISTS idx_clientes_elegivel ON clientes(elegivel);
CREATE INDEX IF NOT EXISTS idx_compras_cliente ON compras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sorteios_cliente ON sorteios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sorteios_codigo ON sorteios(codigo);

-- =====================================================
-- RLS (Row Level Security) - políticas permissivas
-- (para uso interno da loja; pode apertar depois)
-- =====================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorteios ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Permitir tudo para a chave publishable (uso interno da loja)
CREATE POLICY "Permitir tudo clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo compras" ON compras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo premios" ON premios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo sorteios" ON sorteios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo config" ON config FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Prémios padrão
-- =====================================================
INSERT INTO premios (id, nome, descricao, probabilidade, activo, cor) VALUES
  ('p1', '10% de bónus na próxima compra', 'Ganhou 10% de desconto/bónus na próxima compra', 40, true, '#00E676'),
  ('p2', '25% de bónus na próxima compra', 'Ganhou 25% de desconto/bónus na próxima compra', 30, true, '#00B0FF'),
  ('p3', '50% de bónus na próxima compra', 'Ganhou 50% de desconto/bónus na próxima compra', 15, true, '#D500F9'),
  ('p4', 'Paga 1 e leva 2', 'Na próxima compra paga 1 e leva 2', 10, true, '#FF9100'),
  ('p5', 'Peça grátis', 'Ganhou uma peça grátis', 5, true, '#FF1744')
ON CONFLICT (id) DO NOTHING;

-- Config padrão
INSERT INTO config (chave, valor) VALUES
  ('geral', '{"nomeLoja": "Bónus Lodja - Compre e ganhe", "pecasNecessarias": 5, "adminPassword": "admin123"}')
ON CONFLICT (chave) DO NOTHING;

-- 6. BONUS ESPECIAL PARTICIPACOES
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
