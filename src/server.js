require('dotenv').config();

const app = require('./app');

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'FRONTEND_URL'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ter ao menos 32 caracteres.');
}

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`HelpDesk API em execução na porta ${port}.`));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
