const { validationResult } = require('express-validator');

/** Retorna erros de validação sem permitir que o controller processe entradas inválidas. */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      erro: 'Dados de entrada inválidos.',
      detalhes: errors.array().map(({ path, msg }) => ({ campo: path, mensagem: msg }))
    });
  }
  return next();
};
