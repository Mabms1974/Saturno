const RoteiroModel = require('../models/roteiroModel');

module.exports = {
  listar(req, res) {
    res.json(RoteiroModel.listar());
  },

  buscar(req, res) {
    const r = RoteiroModel.buscarPorId(req.params.id);
    if (!r) return res.status(404).json({ erro: 'Roteiro não encontrado' });
    res.json(r);
  },

  criar(req, res) {
    const { data, motorista_id, distancia_total_km } = req.body;
    if (!data || !motorista_id) {
      return res.status(400).json({ erro: 'data e motorista_id são obrigatórios' });
    }
    try {
      const novo = RoteiroModel.criar({ data, motorista_id, distancia_total_km });
      res.status(201).json(novo);
    } catch (e) {
      res.status(400).json({ erro: e.message });
    }
  },

  atualizar(req, res) {
    const existente = RoteiroModel.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ erro: 'Roteiro não encontrado' });
    const b = req.body;
    const atualizado = RoteiroModel.atualizar(req.params.id, {
      data:               b.data               ?? existente.data,
      motorista_id:       b.motorista_id       ?? existente.motorista_id,
      distancia_total_km: b.distancia_total_km ?? existente.distancia_total_km
    });
    res.json(atualizado);
  },

  remover(req, res) {
    RoteiroModel.remover(req.params.id);
    res.status(204).send();
  }
};