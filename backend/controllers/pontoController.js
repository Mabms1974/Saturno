const PontoModel = require('../models/pontoModel');

module.exports = {
  listarPorRoteiro(req, res) {
    res.json(PontoModel.listarPorRoteiro(req.params.roteiroId));
  },

  buscar(req, res) {
    const p = PontoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Ponto não encontrado' });
    res.json(p);
  },

  criar(req, res) {
    const { roteiro_id, endereco } = req.body;
    if (!roteiro_id || !endereco) {
      return res.status(400).json({ erro: 'roteiro_id e endereco são obrigatórios' });
    }
    try {
      res.status(201).json(PontoModel.criar(req.body));
    } catch (e) {
      res.status(400).json({ erro: e.message });
    }
  },

  registrarChegada(req, res) {
    const { data_hora_chegada, latitude, longitude } = req.body;
    if (!data_hora_chegada) {
      return res.status(400).json({ erro: 'data_hora_chegada é obrigatória' });
    }
    const p = PontoModel.registrarChegada(req.params.id, data_hora_chegada, latitude, longitude);
    if (!p) return res.status(404).json({ erro: 'Ponto não encontrado' });
    res.json(p);
  },

  registrarSaida(req, res) {
    const { data_hora_saida, latitude, longitude } = req.body;
    if (!data_hora_saida) {
      return res.status(400).json({ erro: 'data_hora_saida é obrigatória' });
    }
    const p = PontoModel.registrarSaida(req.params.id, data_hora_saida, latitude, longitude);
    if (!p) return res.status(404).json({ erro: 'Ponto não encontrado' });
    res.json(p);
  },

  atualizar(req, res) {
    const p = PontoModel.atualizar(req.params.id, req.body);
    if (!p) return res.status(404).json({ erro: 'Ponto não encontrado' });
    res.json(p);
  },

  remover(req, res) {
    PontoModel.remover(req.params.id);
    res.status(204).send();
  }
};