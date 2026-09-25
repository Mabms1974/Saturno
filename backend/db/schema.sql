-- ============================================
-- Motoristas / Motoboys
-- ============================================
CREATE TABLE IF NOT EXISTS motorista (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  telefone        TEXT,
  documento       TEXT UNIQUE,
  veiculo         TEXT,
  rendimento_km_l REAL,
  criado_em       TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Roteiros (RN05: um motorista + uma data)
-- ============================================
CREATE TABLE IF NOT EXISTS roteiro (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  data               TEXT NOT NULL,          -- YYYY-MM-DD
  motorista_id       INTEGER NOT NULL,
  distancia_total_km REAL DEFAULT 0,
  criado_em          TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorista_id) REFERENCES motorista(id)
);

-- ============================================
-- Pontos do roteiro
-- (RN06: ordem sequencial 1, 2, 3...)
-- (RN01: ponto com ordem = 1 é a partida, não conta tempo parado)
-- ============================================
CREATE TABLE IF NOT EXISTS ponto (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  roteiro_id        INTEGER NOT NULL,
  ordem             INTEGER NOT NULL,
  endereco          TEXT NOT NULL,
  latitude          REAL,
  longitude         REAL,
  data_hora_chegada TEXT,                    -- ISO 8601
  data_hora_saida   TEXT,                    -- ISO 8601
  tempo_parado_min  INTEGER DEFAULT 0,
  FOREIGN KEY (roteiro_id) REFERENCES roteiro(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ponto_roteiro  ON ponto(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_roteiro_data   ON roteiro(data);
CREATE INDEX IF NOT EXISTS idx_roteiro_motor  ON roteiro(motorista_id);

CREATE TABLE IF NOT EXISTS parametro (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  preco_combustivel  REAL NOT NULL,
  jornada_horas_dia  REAL NOT NULL DEFAULT 8,
  vigencia_inicio    TEXT NOT NULL,
  vigencia_fim       TEXT
);

CREATE INDEX IF NOT EXISTS idx_parametro_vigencia ON parametro(vigencia_inicio, vigencia_fim);
