const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/chamadoController');
const { authenticate, allow } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();
const id = param('id').isInt({ min: 1 }).toInt().withMessage('ID do chamado inválido.');
const text = (field, label, min, max) => body(field).trim().escape().isLength({ min, max }).withMessage(`${label} deve ter entre ${min} e ${max} caracteres.`);

router.use(authenticate);
router.get('/', asyncHandler(controller.list));
router.post('/', [allow('cliente'), text('titulo', 'Título', 5, 160), text('descricao', 'Descrição', 10, 5000), text('categoria', 'Categoria', 3, 80), body('prioridade').optional().isIn(['Baixa', 'Media', 'Alta', 'Critica']).withMessage('Prioridade inválida.'), validate], asyncHandler(controller.create));
router.get('/:id', [id, validate], asyncHandler(controller.getById));
router.patch('/:id/status', [allow('tecnico'), id, body('status').isIn(['Aberto', 'Em Atendimento', 'Concluído']).withMessage('Status inválido.'), validate], asyncHandler(controller.updateStatus));
router.patch('/:id/encerrar', [id, validate], asyncHandler(controller.close));
router.get('/:id/comentarios', [id, validate], asyncHandler(controller.listComments));
router.post('/:id/comentarios', [id, text('mensagem', 'Mensagem', 1, 3000), validate], asyncHandler(controller.createComment));

module.exports = router;
