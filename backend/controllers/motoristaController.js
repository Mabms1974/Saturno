const MotoristaModel = require('../models/motoristaModel');

module.exports = {
  listar(req, res) {
    res.json(MotoristaModel.listar());
  },

  buscar(req, res) {
    const m = MotoristaModel.buscarPorId(req.params.id);
    if (!m) return res.status(404).json({ erro: 'Motorista não encontrado' });
    res.json(m);
  },

  criar(req, res) {
    const { nome, telefone, documento, veiculo, rendimento_km_l } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
    try {
      const novo = MotoristaModel.criar({ nome, telefone, documento, veiculo, rendimento_km_l });
      res.status(201).json(novo);
    } catch (e) {
      res.status(400).json({ erro: e.message });
    }
  },

  atualizar(req, res) {
    const existente = MotoristaModel.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ erro: 'Motorista não encontrado' });
    const b = req.body;
    const atualizado = MotoristaModel.atualizar(req.params.id, {
      nome:            b.nome            ?? existente.nome,
      telefone:        b.telefone        ?? existente.telefone,
      documento:       b.documento       ?? existente.documento,
      veiculo:         b.veiculo         ?? existente.veiculo,
      rendimento_km_l: b.rendimento_km_l ?? existente.rendimento_km_l
    });
    res.json(atualizado);
  },

  remover(req, res) {
    MotoristaModel.remover(req.params.id);
    res.status(204).send();
  }
};