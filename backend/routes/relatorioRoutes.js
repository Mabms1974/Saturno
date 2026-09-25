const router = require('express').Router();
const ctrl = require('../controllers/relatorioController');

router.get('/historico', ctrl.historico);
router.get('/exportar', ctrl.exportarCsv);

module.exports = router;
