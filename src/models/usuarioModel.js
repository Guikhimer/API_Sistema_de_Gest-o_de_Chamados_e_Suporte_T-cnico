const { pool, isDatabaseAvailable } = require('../config/database');
const store = require('./memoryStore');

exports.findByEmail = async (email) => {
  if (!isDatabaseAvailable()) return store.usuarios.find((usuario) => usuario.email === email) || null;
  const [rows] = await pool.execute(
    'SELECT id, nome, email, senha_hash, perfil, criado_em FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

exports.create = async ({ nome, email, senhaHash, perfil }) => {
  if (!isDatabaseAvailable()) {
    const usuario = { id: store.nextUsuarioId++, nome, email, senha_hash: senhaHash, perfil, criado_em: new Date().toISOString() };
    store.usuarios.push(usuario);
    return { id: usuario.id, nome, email, perfil };
  }
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
    [nome, email, senhaHash, perfil]
  );
  return { id: result.insertId, nome, email, perfil };
};
