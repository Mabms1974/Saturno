const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');

router.get('/', ctrl.indicadores);

module.exports = router;
