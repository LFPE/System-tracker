-- ══════════════════════════════════════════════
-- TRACKER — Coobrastur — Schema inicial
-- ══════════════════════════════════════════════

-- Usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registros de REATs
CREATE TABLE IF NOT EXISTS reats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_ref TEXT NOT NULL,        -- YYYY-MM-DD
  tipo TEXT NOT NULL,
  data TEXT NOT NULL,            -- DD/MM/YYYY
  hora TEXT NOT NULL,            -- HH:MM
  consultor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Tratativa',
  revertido TEXT DEFAULT '-',
  motivo TEXT DEFAULT '-',
  plano_em_dia TEXT DEFAULT '-',
  plano TEXT DEFAULT '-',
  analise TEXT DEFAULT '',
  texto TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Avaliações de satisfação
CREATE TABLE IF NOT EXISTS satisfacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ramal INTEGER NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,            -- YYYY-MM-DD
  day INTEGER NOT NULL,
  phone TEXT DEFAULT '',
  score INTEGER NOT NULL,
  cat TEXT NOT NULL,             -- BOM | ATENÇÃO | RUIM
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_reats_data_ref ON reats(data_ref);
CREATE INDEX IF NOT EXISTS idx_reats_consultor ON reats(consultor);
CREATE INDEX IF NOT EXISTS idx_reats_status ON reats(status);
CREATE INDEX IF NOT EXISTS idx_satisfacao_date ON satisfacao(date);
CREATE INDEX IF NOT EXISTS idx_satisfacao_name ON satisfacao(name);

-- Usuários padrão (senha: reats2026 e reats123)
-- hash = 'h_' + djb2(salt + pass) em hex
INSERT OR IGNORE INTO users (login, name, pass_hash, role) VALUES
  ('admin',      'Administrador', 'h_b2f4a9c1', 'admin'),
  ('supervisor', 'Supervisor',    'h_7e3d12f8', 'user');
