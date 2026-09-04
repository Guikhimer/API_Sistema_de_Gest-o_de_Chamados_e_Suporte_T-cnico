const pool = require('../config/database');

const SELECT_CHAMADO = `SELECT c.*, cliente.nome AS cliente_nome, cliente.email AS cliente_email,
  tecnico.nome AS tecnico_nome, tecnico.email AS tecnico_email
  FROM chamados c
  INNER JOIN usuarios cliente ON cliente.id = c.cliente_id
  LEFT JOIN usuarios tecnico ON tecnico.id = c.tecnico_id`;

exports.listVisibleTo = async (usuario) => {
  const sql = usuario.perfil === 'tecnico'
    ? `${SELECT_CHAMADO} ORDER BY FIELD(c.status, 'Aberto', 'Em Atendimento', 'Concluído'), c.criado_em DESC`
    : `${SELECT_CHAMADO} WHERE c.cliente_id = ? ORDER BY c.criado_em DESC`;
  const [rows] = await pool.execute(sql, usuario.perfil === 'tecnico' ? [] : [usuario.id]);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute(`${SELECT_CHAMADO} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

exports.create = async ({ titulo, descricao, categoria, prioridade, clienteId }) => {
  const [result] = await pool.execute(
    'INSERT INTO chamados (titulo, descricao, categoria, prioridade, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [titulo, descricao, categoria, prioridade, clienteId]
  );
  return exports.findById(result.insertId);
};

exports.updateStatus = async ({ id, status, tecnicoId }) => {
  await pool.execute(
    `UPDATE chamados
     SET status = ?, tecnico_id = CASE WHEN ? = 'Em Atendimento' THEN COALESCE(tecnico_id, ?) ELSE tecnico_id END,
         concluido_em = CASE WHEN ? = 'Concluído' THEN CURRENT_TIMESTAMP ELSE concluido_em END
     WHERE id = ?`,
    [status, status, tecnicoId, status, id]
  );
  return exports.findById(id);
};

exports.close = async (id) => {
  await pool.execute(
    "UPDATE chamados SET status = 'Concluído', concluido_em = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );
  return exports.findById(id);
};
