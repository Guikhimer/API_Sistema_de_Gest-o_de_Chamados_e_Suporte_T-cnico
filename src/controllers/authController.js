const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

const publicUser = ({ id, nome, email, perfil }) => ({ id, nome, email, perfil });

/**
 * Cadastra um usuário com senha convertida para hash antes da persistência.
 * @async
 * @param {import('express').Request} req Requisição validada com nome, email, senha e perfil.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Usuário criado, sem hash de senha.
 * @throws {Error} Quando o e-mail já estiver registrado ou o banco falhar.
 */
exports.register = async (req, res) => {
  const { nome, email, senha, perfil = 'cliente' } = req.body;
  const existing = await usuarioModel.findByEmail(email);
  if (existing) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });

  const senhaHash = await bcrypt.hash(senha, 12);
  const usuario = await usuarioModel.create({ nome, email, senhaHash, perfil });
  return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso.', usuario });
};

/**
 * Autentica um usuário e cria um JWT assinado para uso no cabeçalho Bearer.
 * @async
 * @param {import('express').Request} req Requisição validada com e-mail e senha.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Token JWT e dados públicos do usuário.
 * @throws {Error} Quando a consulta ao banco ou a assinatura do token falhar.
 */
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await usuarioModel.findByEmail(email);
  const passwordMatches = usuario && await bcrypt.compare(senha, usuario.senha_hash);
  if (!passwordMatches) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });

  const token = jwt.sign(
    { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { subject: String(usuario.id), expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
  return res.json({ token, usuario: publicUser(usuario) });
};
