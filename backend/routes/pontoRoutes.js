const router = require('express').Router();
const ctrl   = require('../controllers/pontoController');

// Pontos de um roteiro (usado para montar a tela de campo)
router.get('/roteiro/:roteiroId', ctrl.listarPorRoteiro);

router.get('/:id',    ctrl.buscar);
router.post('/',      ctrl.criar);

// Registro de campo (tela do entregador)
router.post('/:id/chegada', ctrl.registrarChegada);
router.post('/:id/saida',   ctrl.registrarSaida);

router.put('/:id',    ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;