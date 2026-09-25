const router = require('express').Router();
const ctrl = require('../controllers/parametroController');

router.get('/vigente', ctrl.vigente);
router.get('/historico', ctrl.historico);
router.post('/', ctrl.criar);

module.exports = router;
