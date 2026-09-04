module.exports = (error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Já existe um registro com estes dados.' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(422).json({ erro: 'Referência informada não existe.' });
  }

  if (process.env.NODE_ENV !== 'production') console.error(error);
  return res.status(error.statusCode || 500).json({
    erro: error.statusCode ? error.message : 'Erro interno do servidor.'
  });
};
