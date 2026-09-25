const DashboardModel = require('../models/dashboardModel');

function filtroDaQuery(query) {
  const { inicio, fim, motorista_id } = query;
  return {
    inicio: inicio || null,
    fim: fim || null,
    motorista_id: motorista_id ? parseInt(motorista_id, 10) : null
  };
}

module.exports = {
  historico(req, res) {
    const linhas = DashboardModel.historico(filtroDaQuery(req.query));
    res.json(linhas);
  },

  exportarCsv(req, res) {
    const linhas = DashboardModel.historico(filtroDaQuery(req.query));

    const cabecalho = 'roteiro_id,motorista,data,tempo_parado_horas,custo,jornada_horas,horas_extras';
    const corpo = linhas
      .map((l) => [l.roteiro_id, l.motorista, l.data, l.tempo_parado_horas, l.custo, l.jornada_horas, l.horas_extras].join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-rotas.csv');
    res.send(`${cabecalho}\n${corpo}`);
  }
};
