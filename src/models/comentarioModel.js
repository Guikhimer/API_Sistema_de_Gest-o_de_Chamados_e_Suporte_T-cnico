const { pool, isDatabaseAvailable } = require('../config/database');
const store = require('./memoryStore');

exports.listByChamado = async (chamadoId) => {
  if (!isDatabaseAvailable()) return store.comentarios.filter((comentario) => comentario.chamado_id === Number(chamadoId)).map(enrich);
  const [rows] = await pool.execute(
    `SELECT cc.id, cc.chamado_id, cc.mensagem, cc.criado_em, u.id AS usuario_id, u.nome AS usuario_nome, u.perfil AS usuario_perfil
     FROM comentarios_chamado cc INNER JOIN usuarios u ON u.id = cc.usuario_id
     WHERE cc.chamado_id = ? ORDER BY cc.criado_em ASC`,
    [chamadoId]
  );
  return rows;
};

exports.create = async ({ chamadoId, usuarioId, mensagem }) => {
  if (!isDatabaseAvailable()) {
    const comentario = { id: store.nextComentarioId++, chamado_id: Number(chamadoId), usuario_id: usuarioId, mensagem, criado_em: new Date().toISOString() };
    store.comentarios.push(comentario);
    return enrich(comentario);
  }
  const [result] = await pool.execute(
    'INSERT INTO comentarios_chamado (chamado_id, usuario_id, mensagem) VALUES (?, ?, ?)',
    [chamadoId, usuarioId, mensagem]
  );
  const [rows] = await pool.execute(
    `SELECT cc.id, cc.chamado_id, cc.mensagem, cc.criado_em, u.id AS usuario_id, u.nome AS usuario_nome, u.perfil AS usuario_perfil
     FROM comentarios_chamado cc INNER JOIN usuarios u ON u.id = cc.usuario_id WHERE cc.id = ?`,
    [result.insertId]
  );
  return rows[0];
};

function enrich(comentario) {
  const usuario = store.usuarios.find((item) => item.id === comentario.usuario_id) || {};
  return { ...comentario, usuario_nome: usuario.nome || null, usuario_perfil: usuario.perfil || null };
}
