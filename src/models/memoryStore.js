/** Contingência temporária para manter a API disponível se o banco gerenciado estiver inacessível. */
const store = {
  usuarios: [],
  chamados: [],
  comentarios: [],
  nextUsuarioId: 1,
  nextChamadoId: 1,
  nextComentarioId: 1
};

module.exports = store;
