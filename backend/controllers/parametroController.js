const ParametroModel = require('../models/parametroModel');

module.exports = {
  vigente(req, res) {
    const p = ParametroModel.vigente();
    if (!p) {
      return res.json({ preco_combustivel: null, jornada_horas_dia: 8, vigencia_inicio: null });
    }
    res.json(p);
  },

  historico(req, res) {
    res.json(ParametroModel.listarHistorico());
  },

  criar(req, res) {
    const { preco_combustivel, jornada_horas_dia } = req.body;

    if (!(preco_combustivel > 0)) {
      return res.status(400).json({ erro: 'preco_combustivel deve ser maior que zero' });
    }
    if (!(jornada_horas_dia > 0)) {
      return res.status(400).json({ erro: 'jornada_horas_dia deve ser maior que zero' });
    }

    try {
      const novo = ParametroModel.criar({ preco_combustivel, jornada_horas_dia });
      res.status(201).json(novo);
    } catch (e) {
      res.status(400).json({ erro: e.message });
    }
  }
};
