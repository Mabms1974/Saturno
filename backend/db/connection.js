const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Os testes definem DB_PATH para usar um banco isolado (data/test.db).
// Sem essa variável, usa o banco real.
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'tempo_parado.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// aplica schema a cada inicialização (idempotente por causa do IF NOT EXISTS)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
