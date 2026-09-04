# HelpDesk API — Sistema de Gestão de Chamados e Suporte Técnico

API REST e front-end desacoplado para abertura e atendimento de chamados de
suporte. O back-end usa Node.js, Express e MySQL; o cliente em `frontend/`
consome exclusivamente os endpoints JSON da API.

## Recursos

- Cadastro e login com senhas protegidas por `bcryptjs` e JWT Bearer.
- Perfis `cliente` e `tecnico` com permissões próprias.
- Abertura, consulta, atualização de status e encerramento de chamados.
- Comentários em chamados por clientes e técnicos.
- Validação e sanitização dos dados de entrada, queries parametrizadas e CORS
  restrito ao endereço do front-end.
- Swagger UI disponível em `/api-docs`.

## Instalação local

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Crie o banco e as tabelas antes de iniciar o servidor:

```bash
mysql -u SEU_USUARIO -p -h SEU_HOST < database/schema.sql
```

O servidor inicia em `http://localhost:3000` por padrão. A documentação fica
em `http://localhost:3000/api-docs`.

Para abrir o front-end localmente, confira que `frontend/config.js` aponta para
`http://localhost:3000/api` e sirva a pasta com uma extensão como Live Server.
O valor local esperado é `http://localhost:5500`.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP da API. |
| `NODE_ENV` | Ambiente, por exemplo `development` ou `production`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciais do MySQL/Aiven. |
| `DB_SSL` | Use `true` para banco em nuvem que exige TLS. |
| `DB_SSL_CA` | Certificado CA em Base64, se o provedor o exigir. |
| `JWT_SECRET` | Chave longa, aleatória e exclusiva para assinar tokens. |
| `JWT_EXPIRES_IN` | Validade do token, por exemplo `8h`. |
| `FRONTEND_URL` | Origem exata autorizada pelo CORS, sem barra final. |

## Deploy

### API (Render/Railway)

1. Crie um banco MySQL gerenciado e execute `database/schema.sql` usando a
   conexão SSL do provedor.
2. Publique este repositório como Web Service, com `Build Command` igual a
   `npm install` e `Start Command` igual a `npm start`.
3. Cadastre todas as variáveis da tabela acima no painel do serviço. Não envie
   o arquivo `.env` ao Git.
4. Defina `FRONTEND_URL` com a URL final do front-end.

### Front-end (Vercel/Netlify)

1. Publique a pasta `frontend` como diretório raiz do site estático.
2. Altere `frontend/config.js`, colocando em `API_URL` a URL pública da API,
   por exemplo `https://seu-helpdesk-api.onrender.com/api`.
3. Faça novo deploy e use a URL resultante como `FRONTEND_URL` no back-end.

## Endpoints principais

| Método | Rota | Acesso |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Público |
| `POST` | `/api/auth/login` | Público |
| `GET` | `/api/chamados` | Cliente/Técnico |
| `POST` | `/api/chamados` | Cliente |
| `PATCH` | `/api/chamados/:id/status` | Técnico |
| `PATCH` | `/api/chamados/:id/encerrar` | Cliente responsável/Técnico |
| `GET/POST` | `/api/chamados/:id/comentarios` | Participantes do chamado |

Consulte os contratos completos e experimente as rotas em `/api-docs`.
