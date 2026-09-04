(() => {
  'use strict';

  const API_URL = window.HELPDESK_CONFIG?.API_URL?.replace(/\/$/, '');
  const storageKey = 'helpdesk.session';
  let session = readSession();
  let tickets = [];

  const $ = (selector) => document.querySelector(selector);
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const date = (value) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(storageKey)) || null; } catch { return null; }
  }
  function saveSession(data) { session = data; sessionStorage.setItem(storageKey, JSON.stringify(data)); }
  function setMessage(form, message, success = false) {
    const target = form.querySelector('.form-message');
    target.textContent = message || '';
    target.classList.toggle('success', success);
  }
  function apiError(error) { return error?.erro || error?.detalhes?.[0]?.mensagem || 'Não foi possível concluir a operação.'; }

  async function request(path, options = {}) {
    if (!API_URL) throw new Error('Configure frontend/config.js com a URL da API antes de usar o sistema.');
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : null;
    if (!response.ok) {
      if (response.status === 401 && session) logout();
      throw new Error(apiError(body));
    }
    return body;
  }

  function renderSession() {
    const sessionArea = $('#session-area');
    const auth = $('#auth-panel');
    const dashboard = $('#dashboard');
    const welcome = $('#welcome');
    sessionArea.replaceChildren();
    if (!session) {
      auth.hidden = false; dashboard.hidden = true; welcome.hidden = false;
      return;
    }
    auth.hidden = true; dashboard.hidden = false; welcome.hidden = true;
    const chip = el('div', undefined, 'user-chip');
    chip.append(el('span', `${session.usuario.nome} · ${session.usuario.perfil}`));
    const logoutButton = el('button', 'Sair');
    logoutButton.type = 'button'; logoutButton.addEventListener('click', logout);
    chip.append(logoutButton); sessionArea.append(chip);
    $('#ticket-form').hidden = session.usuario.perfil !== 'cliente';
    loadTickets();
  }

  async function loadTickets() {
    if (!session) return;
    const area = $('#tickets');
    area.replaceChildren(el('p', 'Carregando chamados…', 'empty'));
    try {
      tickets = await request('/chamados');
      renderTickets();
    } catch (error) {
      area.replaceChildren(el('p', error.message, 'form-message'));
    }
  }

  function renderTickets() {
    const area = $('#tickets');
    area.replaceChildren();
    if (!tickets.length) {
      area.append(el('p', session.usuario.perfil === 'cliente' ? 'Você ainda não abriu nenhum chamado.' : 'Não há chamados para atendimento.', 'empty'));
      return;
    }
    tickets.forEach((ticket) => {
      const card = el('article', undefined, 'card ticket');
      const top = el('div', undefined, 'ticket-top');
      const title = el('h3', `#${ticket.id} · ${ticket.titulo}`);
      const badge = el('span', ticket.status, 'badge'); badge.dataset.status = ticket.status;
      top.append(title, badge);
      card.append(top, el('p', ticket.descricao.length > 140 ? `${ticket.descricao.slice(0, 140)}…` : ticket.descricao));
      card.append(el('p', `${ticket.categoria} · Prioridade ${ticket.prioridade}`, 'meta'));
      if (session.usuario.perfil === 'tecnico') card.append(el('p', `Cliente: ${ticket.cliente_nome}`, 'meta'));
      const view = el('button', 'Ver detalhes'); view.type = 'button'; view.addEventListener('click', () => showDetails(ticket.id));
      card.append(view); area.append(card);
    });
  }

  async function showDetails(id) {
    const dialog = $('#details-dialog');
    const content = $('#details-content');
    content.replaceChildren(el('p', 'Carregando detalhes…'));
    dialog.showModal();
    try {
      const [ticket, comments] = await Promise.all([request(`/chamados/${id}`), request(`/chamados/${id}/comentarios`)]);
      renderDetails(content, ticket, comments);
    } catch (error) { content.replaceChildren(el('p', error.message, 'form-message')); }
  }

  function renderDetails(content, ticket, comments) {
    content.replaceChildren();
    content.append(el('p', `CHAMADO #${ticket.id}`, 'eyebrow'), el('h2', ticket.titulo), el('p', ticket.descricao));
    const info = el('p', `Categoria: ${ticket.categoria} · Prioridade: ${ticket.prioridade} · Aberto em ${date(ticket.criado_em)}`, 'meta');
    content.append(info);
    const actions = el('div', undefined, 'details-actions');
    if (session.usuario.perfil === 'tecnico') {
      const select = el('select');
      ['Aberto', 'Em Atendimento', 'Concluído'].forEach((status) => {
        const option = el('option', status); option.value = status; option.selected = ticket.status === status; select.append(option);
      });
      const update = el('button', 'Atualizar status'); update.type = 'button';
      update.addEventListener('click', async () => {
        try { await request(`/chamados/${ticket.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); await loadTickets(); await showDetails(ticket.id); }
        catch (error) { alert(error.message); }
      });
      actions.append(select, update);
    }
    if (ticket.status !== 'Concluído') {
      const close = el('button', 'Encerrar chamado', 'secondary'); close.type = 'button';
      close.addEventListener('click', async () => {
        try { await request(`/chamados/${ticket.id}/encerrar`, { method: 'PATCH' }); await loadTickets(); await showDetails(ticket.id); }
        catch (error) { alert(error.message); }
      });
      actions.append(close);
    }
    content.append(actions, el('h3', 'Comentários'));
    if (!comments.length) content.append(el('p', 'Ainda não há comentários.', 'meta'));
    comments.forEach((comment) => {
      const node = el('div', undefined, 'comment');
      node.append(el('strong', `${comment.usuario_nome} (${comment.usuario_perfil})`), el('p', comment.mensagem), el('small', date(comment.criado_em)));
      content.append(node);
    });
    const form = el('form', undefined, 'comment-form');
    const label = el('label', 'Adicionar comentário');
    const message = document.createElement('textarea'); message.required = true; message.minLength = 1; message.maxLength = 3000; message.name = 'mensagem';
    label.append(message); const send = el('button', 'Enviar'); form.append(label, send);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await request(`/chamados/${ticket.id}/comentarios`, { method: 'POST', body: JSON.stringify({ mensagem: message.value }) }); await showDetails(ticket.id); }
      catch (error) { alert(error.message); }
    });
    content.append(form);
  }

  function logout() {
    sessionStorage.removeItem(storageKey); session = null; $('#details-dialog').close(); renderSession();
  }
  async function submitAuth(event, endpoint) {
    event.preventDefault(); const form = event.currentTarget; setMessage(form, '');
    const body = Object.fromEntries(new FormData(form)); const button = form.querySelector('button'); button.disabled = true;
    try {
      const result = await request(endpoint, { method: 'POST', body: JSON.stringify(body) });
      if (endpoint.endsWith('register')) { setMessage(form, 'Cadastro concluído. Agora entre com sua conta.', true); form.reset(); }
      else { saveSession(result); form.reset(); renderSession(); }
    } catch (error) { setMessage(form, error.message); } finally { button.disabled = false; }
  }

  $('#login-form').addEventListener('submit', (event) => submitAuth(event, '/auth/login'));
  $('#register-form').addEventListener('submit', (event) => submitAuth(event, '/auth/register'));
  $('#ticket-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; setMessage(form, '');
    try { await request('/chamados', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); setMessage(form, 'Chamado aberto com sucesso.', true); form.reset(); loadTickets(); }
    catch (error) { setMessage(form, error.message); }
  });
  $('#refresh-button').addEventListener('click', loadTickets);
  $('#close-dialog').addEventListener('click', () => $('#details-dialog').close());

  renderSession();
})();
