const db = require('../db/connection');

/**
 * RN01: ponto de partida (ordem = 1) NÃO conta tempo parado.
 * RN02: tempo parado = horário de saída − horário de chegada.
 * Retorna sempre um inteiro em MINUTOS.
 */
function calcularTempoParadoMin(chegadaISO, saidaISO, ordem) {
  if (ordem === 1) return 0;                      // RN01
  if (!chegadaISO || !saidaISO) return 0;

  const chegada = new Date(chegadaISO).getTime();
  const saida   = new Date(saidaISO).getTime();
  if (isNaN(chegada) || isNaN(saida) || saida < chegada) return 0;

  return Math.round((saida - chegada) / 60000);   // RN02
}

const PontoModel = {
  listarPorRoteiro(roteiroId) {
    return db.prepare(`
      SELECT * FROM ponto WHERE roteiro_id = ? ORDER BY ordem
    `).all(roteiroId);
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM ponto WHERE id = ?').get(id);
  },

  // RN06: próxima ordem = último + 1
  proximaOrdem(roteiroId) {
    const row = db.prepare(`
      SELECT COALESCE(MAX(ordem), 0) AS ultimo FROM ponto WHERE roteiro_id = ?
    `).get(roteiroId);
    return row.ultimo + 1;
  },

  criar({ roteiro_id, ordem, endereco, latitude, longitude,
          data_hora_chegada, data_hora_saida }) {
    const ordemFinal = ordem || this.proximaOrdem(roteiro_id);
    const tempo_parado_min = calcularTempoParadoMin(
      data_hora_chegada, data_hora_saida, ordemFinal
    );

    const info = db.prepare(`
      INSERT INTO ponto
        (roteiro_id, ordem, endereco, latitude, longitude,
         data_hora_chegada, data_hora_saida, tempo_parado_min)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      roteiro_id, ordemFinal, endereco, latitude, longitude,
      data_hora_chegada, data_hora_saida, tempo_parado_min
    );

    return this.buscarPorId(info.lastInsertRowid);
  },

  // Aceita latitude/longitude opcionais para atualizar a posição real da chegada
  registrarChegada(id, data_hora_chegada, latitude, longitude) {
    const p = this.buscarPorId(id);
    if (!p) return null;

    db.prepare(`
      UPDATE ponto
         SET data_hora_chegada = ?,
             latitude  = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude)
       WHERE id = ?
    `).run(data_hora_chegada, latitude ?? null, longitude ?? null, id);

    return this.buscarPorId(id);
  },

  // Aceita latitude/longitude opcionais e recalcula o tempo parado
  registrarSaida(id, data_hora_saida, latitude, longitude) {
    const ponto = this.buscarPorId(id);
    if (!ponto) return null;

    const tempo_parado_min = calcularTempoParadoMin(
      ponto.data_hora_chegada, data_hora_saida, ponto.ordem
    );

    db.prepare(`
      UPDATE ponto
         SET data_hora_saida = ?,
             tempo_parado_min = ?,
             latitude  = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude)
       WHERE id = ?
    `).run(data_hora_saida, tempo_parado_min, latitude ?? null, longitude ?? null, id);

    return this.buscarPorId(id);
  },

  atualizar(id, campos) {
    const p = this.buscarPorId(id);
    if (!p) return null;

    const chegada = campos.data_hora_chegada ?? p.data_hora_chegada;
    const saida   = campos.data_hora_saida   ?? p.data_hora_saida;
    const ordem   = campos.ordem             ?? p.ordem;

    const tempo_parado_min = calcularTempoParadoMin(chegada, saida, ordem);

    db.prepare(`
      UPDATE ponto
         SET ordem = ?, endereco = ?, latitude = ?, longitude = ?,
             data_hora_chegada = ?, data_hora_saida = ?, tempo_parado_min = ?
       WHERE id = ?
    `).run(
      ordem,
      campos.endereco  ?? p.endereco,
      campos.latitude  ?? p.latitude,
      campos.longitude ?? p.longitude,
      chegada, saida, tempo_parado_min, id
    );

    return this.buscarPorId(id);
  },

  remover(id) {
    return db.prepare('DELETE FROM ponto WHERE id = ?').run(id);
  }
};

module.exports = PontoModel;