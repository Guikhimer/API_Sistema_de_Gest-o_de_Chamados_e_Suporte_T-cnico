const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const chamadoRoutes = require('./routes/chamadoRoutes');
const pool = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const frontendUrl = process.env.FRONTEND_URL;

app.disable('x-powered-by');
// Swagger UI contém scripts inline; por isso a CSP é desabilitada apenas nesta API JSON.
// Os demais cabeçalhos de proteção do Helmet permanecem ativos.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendUrl) return callback(null, true);
    return callback(new Error('Origem não autorizada pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 250, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'helpdesk-api' });
  } catch (error) {
    next(error);
  }
});
app.use('/api/chamados', chamadoRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use(errorHandler);

module.exports = app;
