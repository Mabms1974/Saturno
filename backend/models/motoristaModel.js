const db = require('../db/connection');

const MotoristaModel = {
  listar() {
    return db.prepare('SELECT * FROM motorista ORDER BY nome').all();
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM motorista WHERE id = ?').get(id);
  },

  criar({ nome, telefone, documento, veiculo, rendimento_km_l }) {
    const info = db.prepare(`
      INSERT INTO motorista (nome, telefone, documento, veiculo, rendimento_km_l)
      VALUES (?, ?, ?, ?, ?)
    `).run(nome, telefone, documento, veiculo, rendimento_km_l);
    return this.buscarPorId(info.lastInsertRowid);
  },

  atualizar(id, { nome, telefone, documento, veiculo, rendimento_km_l }) {
    db.prepare(`
      UPDATE motorista
         SET nome = ?, telefone = ?, documento = ?, veiculo = ?, rendimento_km_l = ?
       WHERE id = ?
    `).run(nome, telefone, documento, veiculo, rendimento_km_l, id);
    return this.buscarPorId(id);
  },

  remover(id) {
    return db.prepare('DELETE FROM motorista WHERE id = ?').run(id);
  }
};

module.exports = MotoristaModel;