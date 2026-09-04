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

module.exports = pool;
