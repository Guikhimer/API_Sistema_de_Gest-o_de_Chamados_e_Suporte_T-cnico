const jwt = require('jsonwebtoken');

/** Valida o JWT Bearer e disponibiliza o usuário autenticado em req.usuario. */
exports.authenticate = (req, res, next) => {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) return res.status(401).json({ erro: 'Token de autenticação não informado.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub, nome: payload.nome, email: payload.email, perfil: payload.perfil };
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

/** Restringe a rota aos perfis permitidos. */
exports.allow = (...perfis) => (req, res, next) => {
  if (!perfis.includes(req.usuario.perfil)) {
    return res.status(403).json({ erro: 'Você não possui permissão para esta operação.' });
  }
  return next();
};
