const db = require('../db/connection');

/**
 * Parâmetros de custo (combustível) e jornada (RN04, RN07).
 * Versionado por vigência: ao criar um novo parâmetro, o vigente anterior
 * é fechado (vigencia_fim = agora), preservando o histórico de cálculos passados.
 */
const ParametroModel = {
  vigente(dataReferencia) {
    const data = dataReferencia || new Date().toISOString();
    return db.prepare(`
      SELECT * FROM parametro
       WHERE vigencia_inicio <= ?
         AND (vigencia_fim IS NULL OR vigencia_fim > ?)
       ORDER BY vigencia_inicio DESC
       LIMIT 1
    `).get(data, data);
  },

  listarHistorico() {
    return db.prepare('SELECT * FROM parametro ORDER BY vigencia_inicio DESC').all();
  },

  criar({ preco_combustivel, jornada_horas_dia }) {
    const agora = new Date().toISOString();

    const transacao = db.transaction(() => {
      // Fecha a vigência do parâmetro anterior, se houver
      db.prepare(`
        UPDATE parametro SET vigencia_fim = ?
         WHERE vigencia_fim IS NULL
      `).run(agora);

      const info = db.prepare(`
        INSERT INTO parametro (preco_combustivel, jornada_horas_dia, vigencia_inicio)
        VALUES (?, ?, ?)
      `).run(preco_combustivel, jornada_horas_dia, agora);

      return info.lastInsertRowid;
    });

    const id = transacao();
    return db.prepare('SELECT * FROM parametro WHERE id = ?').get(id);
  }
};

module.exports = ParametroModel;
