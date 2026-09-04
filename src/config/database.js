const mysql = require('mysql2/promise');

const ssl = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: Buffer.from(process.env.DB_SSL_CA, 'base64').toString('utf8') } : {}) }
  : undefined;

/** Pool único de conexões com queries sempre parametrizadas. */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl
});

/**
 * Cria o esquema mínimo no banco configurado. Mantém o deploy reproduzível em
 * instâncias MySQL gerenciadas, sem inserir dados de demonstração.
 * @returns {Promise<void>}
 */
const initializeDatabase = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('cliente', 'tecnico') NOT NULL DEFAULT 'cliente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS chamados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    prioridade ENUM('Baixa', 'Media', 'Alta', 'Critica') NOT NULL DEFAULT 'Media',
    status ENUM('Aberto', 'Em Atendimento', 'Concluído') NOT NULL DEFAULT 'Aberto',
    cliente_id INT UNSIGNED NOT NULL,
    tecnico_id INT UNSIGNED NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    concluido_em TIMESTAMP NULL,
    CONSTRAINT fk_chamados_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT fk_chamados_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
    INDEX idx_chamados_cliente (cliente_id),
    INDEX idx_chamados_tecnico (tecnico_id),
    INDEX idx_chamados_status (status)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS comentarios_chamado (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentarios_chamado FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_comentarios_chamado (chamado_id)
  )`);
};

module.exports = { pool, initializeDatabase };
