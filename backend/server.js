const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db/connection'); // inicializa banco + schema

const motoristaRoutes  = require('./routes/motoristaRoutes');
const roteiroRoutes    = require('./routes/roteiroRoutes');
const pontoRoutes      = require('./routes/pontoRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');
const parametroRoutes  = require('./routes/parametroRoutes');
const relatorioRoutes  = require('./routes/relatorioRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- API ----------
// Camada operacional (campo)
app.use('/api/motoristas', motoristaRoutes);
app.use('/api/roteiros',   roteiroRoutes);
app.use('/api/pontos',     pontoRoutes);

// Camada do gestor
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/parametros', parametroRoutes);
app.use('/api/relatorios', relatorioRoutes);

// Qualquer /api/... que não existir responde JSON (e não uma página HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// ---------- Frontend estático ----------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- Tratamento de erros ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Só sobe servidor quando executado direto (npm start / npm run dev)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🪐 Saturno rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
