const { pool } = require('../config/database');

exports.findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, nome, email, senha_hash, perfil, criado_em FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

exports.create = async ({ nome, email, senhaHash, perfil }) => {
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
    [nome, email, senhaHash, perfil]
  );
  return { id: result.insertId, nome, email, perfil };
};
