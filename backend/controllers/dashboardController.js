const DashboardModel = require('../models/dashboardModel');

module.exports = {
  indicadores(req, res) {
    const { inicio, fim, motorista_id } = req.query;
    try {
      const dados = DashboardModel.indicadores({
        inicio: inicio || null,
        fim: fim || null,
        motorista_id: motorista_id ? parseInt(motorista_id, 10) : null
      });
      res.json(dados);
    } catch (e) {
      res.status(500).json({ erro: 'Falha ao consultar indicadores' });
    }
  }
};
