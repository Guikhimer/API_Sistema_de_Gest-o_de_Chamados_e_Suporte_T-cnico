const { pool, isDatabaseAvailable } = require('../config/database');
const store = require('./memoryStore');

const SELECT_CHAMADO = `SELECT c.*, cliente.nome AS cliente_nome, cliente.email AS cliente_email,
  tecnico.nome AS tecnico_nome, tecnico.email AS tecnico_email
  FROM chamados c
  INNER JOIN usuarios cliente ON cliente.id = c.cliente_id
  LEFT JOIN usuarios tecnico ON tecnico.id = c.tecnico_id`;

exports.listVisibleTo = async (usuario) => {
  if (!isDatabaseAvailable()) {
    const chamados = usuario.perfil === 'tecnico' ? store.chamados : store.chamados.filter((chamado) => chamado.cliente_id === usuario.id);
    return chamados.map(enrich).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }
  const sql = usuario.perfil === 'tecnico'
    ? `${SELECT_CHAMADO} ORDER BY FIELD(c.status, 'Aberto', 'Em Atendimento', 'Concluído'), c.criado_em DESC`
    : `${SELECT_CHAMADO} WHERE c.cliente_id = ? ORDER BY c.criado_em DESC`;
  const [rows] = await pool.execute(sql, usuario.perfil === 'tecnico' ? [] : [usuario.id]);
  return rows;
};

exports.findById = async (id) => {
  if (!isDatabaseAvailable()) {
    const chamado = store.chamados.find((item) => item.id === Number(id));
    return chamado ? enrich(chamado) : null;
  }
  const [rows] = await pool.execute(`${SELECT_CHAMADO} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

exports.create = async ({ titulo, descricao, categoria, prioridade, clienteId }) => {
  if (!isDatabaseAvailable()) {
    const now = new Date().toISOString();
    const chamado = { id: store.nextChamadoId++, titulo, descricao, categoria, prioridade, status: 'Aberto', cliente_id: clienteId, tecnico_id: null, criado_em: now, atualizado_em: now, concluido_em: null };
    store.chamados.push(chamado);
    return enrich(chamado);
  }
  const [result] = await pool.execute(
    'INSERT INTO chamados (titulo, descricao, categoria, prioridade, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [titulo, descricao, categoria, prioridade, clienteId]
  );
  return exports.findById(result.insertId);
};

exports.updateStatus = async ({ id, status, tecnicoId }) => {
  if (!isDatabaseAvailable()) {
    const chamado = store.chamados.find((item) => item.id === Number(id));
    chamado.status = status;
    if (status === 'Em Atendimento' && !chamado.tecnico_id) chamado.tecnico_id = tecnicoId;
    if (status === 'Concluído') chamado.concluido_em = new Date().toISOString();
    chamado.atualizado_em = new Date().toISOString();
    return enrich(chamado);
  }
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
  if (!isDatabaseAvailable()) {
    const chamado = store.chamados.find((item) => item.id === Number(id));
    chamado.status = 'Concluído'; chamado.concluido_em = new Date().toISOString(); chamado.atualizado_em = chamado.concluido_em;
    return enrich(chamado);
  }
  await pool.execute(
    "UPDATE chamados SET status = 'Concluído', concluido_em = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );
  return exports.findById(id);
};

function enrich(chamado) {
  const cliente = store.usuarios.find((usuario) => usuario.id === chamado.cliente_id) || {};
  const tecnico = store.usuarios.find((usuario) => usuario.id === chamado.tecnico_id) || {};
  return { ...chamado, cliente_nome: cliente.nome || null, cliente_email: cliente.email || null, tecnico_nome: tecnico.nome || null, tecnico_email: tecnico.email || null };
}
