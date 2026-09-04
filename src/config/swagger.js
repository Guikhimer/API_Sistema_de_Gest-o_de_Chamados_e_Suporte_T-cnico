const swaggerJSDoc = require('swagger-jsdoc');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'HelpDesk API',
    version: '1.0.0',
    description: 'API REST para abertura e atendimento de chamados de suporte técnico.'
  },
  servers: [{ url: '/api', description: 'Servidor atual' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Usuario: { type: 'object', properties: { id: { type: 'integer' }, nome: { type: 'string' }, email: { type: 'string', format: 'email' }, perfil: { type: 'string', enum: ['cliente', 'tecnico'] } } },
      Chamado: { type: 'object', properties: { id: { type: 'integer' }, titulo: { type: 'string' }, descricao: { type: 'string' }, categoria: { type: 'string' }, prioridade: { type: 'string', enum: ['Baixa', 'Media', 'Alta', 'Critica'] }, status: { type: 'string', enum: ['Aberto', 'Em Atendimento', 'Concluído'] }, cliente_id: { type: 'integer' }, tecnico_id: { type: 'integer', nullable: true } } },
      Erro: { type: 'object', properties: { erro: { type: 'string' }, detalhes: { type: 'array', items: { type: 'object' } } } }
    }
  },
  paths: {
    '/auth/register': { post: { tags: ['Autenticação'], summary: 'Cadastra cliente ou técnico', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nome', 'email', 'senha'], properties: { nome: { type: 'string' }, email: { type: 'string', format: 'email' }, senha: { type: 'string', minLength: 8 }, perfil: { type: 'string', enum: ['cliente', 'tecnico'] } } } } } }, responses: { 201: { description: 'Usuário criado' }, 409: { description: 'E-mail já cadastrado' } } } },
    '/auth/login': { post: { tags: ['Autenticação'], summary: 'Autentica e retorna JWT', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'senha'], properties: { email: { type: 'string' }, senha: { type: 'string' } } } } } }, responses: { 200: { description: 'Token e usuário' }, 401: { description: 'Credenciais inválidas' } } } },
    '/chamados': {
      get: { tags: ['Chamados'], security: [{ bearerAuth: [] }], summary: 'Lista chamados visíveis ao usuário', responses: { 200: { description: 'Lista de chamados', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Chamado' } } } } }, 401: { description: 'Não autenticado' } } },
      post: { tags: ['Chamados'], security: [{ bearerAuth: [] }], summary: 'Abre chamado (cliente)', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['titulo', 'descricao', 'categoria'], properties: { titulo: { type: 'string' }, descricao: { type: 'string' }, categoria: { type: 'string' }, prioridade: { type: 'string', enum: ['Baixa', 'Media', 'Alta', 'Critica'] } } } } } }, responses: { 201: { description: 'Chamado criado' }, 403: { description: 'Somente clientes' } } }
    },
    '/chamados/{id}': { get: { tags: ['Chamados'], security: [{ bearerAuth: [] }], summary: 'Busca chamado por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Chamado' }, 404: { description: 'Não encontrado' } } } },
    '/chamados/{id}/status': { patch: { tags: ['Chamados'], security: [{ bearerAuth: [] }], summary: 'Atualiza status (técnico)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Aberto', 'Em Atendimento', 'Concluído'] } } } } } }, responses: { 200: { description: 'Status atualizado' } } } },
    '/chamados/{id}/encerrar': { patch: { tags: ['Chamados'], security: [{ bearerAuth: [] }], summary: 'Encerra chamado', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Chamado encerrado' } } } },
    '/chamados/{id}/comentarios': {
      get: { tags: ['Comentários'], security: [{ bearerAuth: [] }], summary: 'Lista comentários', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Comentários' } } },
      post: { tags: ['Comentários'], security: [{ bearerAuth: [] }], summary: 'Adiciona comentário', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['mensagem'], properties: { mensagem: { type: 'string' } } } } } }, responses: { 201: { description: 'Comentário criado' } } }
    }
  }
};

module.exports = swaggerJSDoc({ definition, apis: [] });
