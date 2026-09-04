const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const validate = require('../middlewares/validate');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();
const name = body('nome').trim().escape().isLength({ min: 3, max: 120 }).withMessage('Informe um nome entre 3 e 120 caracteres.');
const email = body('email').trim().normalizeEmail().isEmail().withMessage('Informe um e-mail válido.');
const password = body('senha').isString().isLength({ min: 8, max: 72 }).withMessage('A senha deve ter entre 8 e 72 caracteres.');

router.post('/register', [name, email, password, body('perfil').optional().isIn(['cliente', 'tecnico']).withMessage('Perfil inválido.'), validate], asyncHandler(controller.register));
router.post('/login', [email, body('senha').isString().notEmpty().withMessage('Informe a senha.'), validate], asyncHandler(controller.login));

module.exports = router;
