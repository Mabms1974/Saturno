const db = require('../db/connection');

const RoteiroModel = {
  listar() {
    return db.prepare(`
      SELECT r.*, m.nome AS motorista_nome
        FROM roteiro r
        JOIN motorista m ON m.id = r.motorista_id
       ORDER BY r.data DESC, r.id DESC
    `).all();
  },

  buscarPorId(id) {
    const roteiro = db.prepare(`
      SELECT r.*, m.nome AS motorista_nome
        FROM roteiro r
        JOIN motorista m ON m.id = r.motorista_id
       WHERE r.id = ?
    `).get(id);
    if (!roteiro) return null;

    roteiro.pontos = db.prepare(`
      SELECT * FROM ponto WHERE roteiro_id = ? ORDER BY ordem
    `).all(id);

    // RN03: soma o tempo parado de TODOS os pontos, exceto o ponto de partida (ordem 1)
    roteiro.tempo_total_parado_min = db.prepare(`
      SELECT COALESCE(SUM(tempo_parado_min), 0) AS total
        FROM ponto
       WHERE roteiro_id = ? AND ordem > 1
    `).get(id).total;

    return roteiro;
  },

  criar({ data, motorista_id, distancia_total_km }) {
    const info = db.prepare(`
      INSERT INTO roteiro (data, motorista_id, distancia_total_km)
      VALUES (?, ?, ?)
    `).run(data, motorista_id, distancia_total_km || 0);
    return this.buscarPorId(info.lastInsertRowid);
  },

  atualizar(id, { data, motorista_id, distancia_total_km }) {
    db.prepare(`
      UPDATE roteiro SET data = ?, motorista_id = ?, distancia_total_km = ?
       WHERE id = ?
    `).run(data, motorista_id, distancia_total_km, id);
    return this.buscarPorId(id);
  },

  remover(id) {
    return db.prepare('DELETE FROM roteiro WHERE id = ?').run(id);
  }
};

module.exports = RoteiroModel;