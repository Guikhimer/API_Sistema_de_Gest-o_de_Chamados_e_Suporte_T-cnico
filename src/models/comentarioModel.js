const { pool } = require('../config/database');

exports.listByChamado = async (chamadoId) => {
  const [rows] = await pool.execute(
    `SELECT cc.id, cc.chamado_id, cc.mensagem, cc.criado_em, u.id AS usuario_id, u.nome AS usuario_nome, u.perfil AS usuario_perfil
     FROM comentarios_chamado cc INNER JOIN usuarios u ON u.id = cc.usuario_id
     WHERE cc.chamado_id = ? ORDER BY cc.criado_em ASC`,
    [chamadoId]
  );
  return rows;
};

exports.create = async ({ chamadoId, usuarioId, mensagem }) => {
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
