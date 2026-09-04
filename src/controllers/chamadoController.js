const chamadoModel = require('../models/chamadoModel');
const comentarioModel = require('../models/comentarioModel');

const permitted = (chamado, usuario) => usuario.perfil === 'tecnico' || chamado.cliente_id === usuario.id;
const notFound = (res) => res.status(404).json({ erro: 'Chamado não encontrado.' });

/**
 * Lista os chamados acessíveis ao usuário autenticado.
 * @async
 * @param {import('express').Request} req Requisição com `usuario` autenticado.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Lista JSON de chamados.
 * @throws {Error} Quando a consulta ao banco falhar.
 */
exports.list = async (req, res) => {
  const chamados = await chamadoModel.listVisibleTo(req.usuario);
  return res.json(chamados);
};

/**
 * Cria um chamado em nome do cliente autenticado.
 * @async
 * @param {import('express').Request} req Requisição com dados validados do chamado.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Chamado criado.
 * @throws {Error} Quando a persistência falhar.
 */
exports.create = async (req, res) => {
  const { titulo, descricao, categoria, prioridade = 'Media' } = req.body;
  const chamado = await chamadoModel.create({ titulo, descricao, categoria, prioridade, clienteId: req.usuario.id });
  return res.status(201).json({ mensagem: 'Chamado aberto com sucesso.', chamado });
};

/**
 * Retorna um chamado após conferir se o solicitante pode visualizá-lo.
 * @async
 * @param {import('express').Request} req Requisição com ID validado.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Chamado solicitado.
 * @throws {Error} Quando a consulta ao banco falhar.
 */
exports.getById = async (req, res) => {
  const chamado = await chamadoModel.findById(req.params.id);
  if (!chamado) return notFound(res);
  if (!permitted(chamado, req.usuario)) return res.status(403).json({ erro: 'Acesso negado a este chamado.' });
  return res.json(chamado);
};

/**
 * Atualiza o status e atribui o técnico no primeiro atendimento.
 * @async
 * @param {import('express').Request} req Requisição com ID e status validados.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Chamado atualizado.
 * @throws {Error} Quando a atualização falhar.
 */
exports.updateStatus = async (req, res) => {
  const current = await chamadoModel.findById(req.params.id);
  if (!current) return notFound(res);
  const chamado = await chamadoModel.updateStatus({ id: req.params.id, status: req.body.status, tecnicoId: req.usuario.id });
  return res.json({ mensagem: 'Status atualizado com sucesso.', chamado });
};

/**
 * Encerra um chamado pelo cliente que o abriu ou por um técnico.
 * @async
 * @param {import('express').Request} req Requisição com ID do chamado validado.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Chamado encerrado.
 * @throws {Error} Quando a atualização falhar.
 */
exports.close = async (req, res) => {
  const current = await chamadoModel.findById(req.params.id);
  if (!current) return notFound(res);
  if (!permitted(current, req.usuario)) return res.status(403).json({ erro: 'Acesso negado a este chamado.' });
  const chamado = await chamadoModel.close(req.params.id);
  return res.json({ mensagem: 'Chamado encerrado com sucesso.', chamado });
};

/**
 * Lista comentários de um chamado visível ao solicitante.
 * @async
 * @param {import('express').Request} req Requisição com ID do chamado validado.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Lista JSON de comentários.
 * @throws {Error} Quando a consulta falhar.
 */
exports.listComments = async (req, res) => {
  const chamado = await chamadoModel.findById(req.params.id);
  if (!chamado) return notFound(res);
  if (!permitted(chamado, req.usuario)) return res.status(403).json({ erro: 'Acesso negado a este chamado.' });
  return res.json(await comentarioModel.listByChamado(req.params.id));
};

/**
 * Registra comentário sanitizado de cliente ou técnico autorizado.
 * @async
 * @param {import('express').Request} req Requisição com mensagem validada.
 * @param {import('express').Response} res Resposta HTTP Express.
 * @returns {Promise<void>} Comentário criado.
 * @throws {Error} Quando a persistência falhar.
 */
exports.createComment = async (req, res) => {
  const chamado = await chamadoModel.findById(req.params.id);
  if (!chamado) return notFound(res);
  if (!permitted(chamado, req.usuario)) return res.status(403).json({ erro: 'Acesso negado a este chamado.' });
  const comentario = await comentarioModel.create({ chamadoId: req.params.id, usuarioId: req.usuario.id, mensagem: req.body.mensagem });
  return res.status(201).json({ mensagem: 'Comentário adicionado com sucesso.', comentario });
};
