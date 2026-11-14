// The chat assistant. It talks to a Cloudflare Worker and never inserts HTML that comes from the model.
// What it exchanges with the Worker:
//   sends  POST { messages: [{ role, content }], sessionId, language }
//   reads  { content: [{ text }], intencion }

export function initChat() {

  // ═══ CONFIGURACIÓN ═══
  const WORKER_URL = 'https://carbelec-chatbot.dei0821.workers.dev';
  const WA_PHONE = '573153899483';
  const ML_URL = 'https://www.mercadolibre.com.co/pagina/ferreteriacarbelec';
  const REQUEST_TIMEOUT_MS = 60000;   // si el Worker no responde en este tiempo, se avisa al cliente
  const HISTORY_WINDOW = 20;          // mensajes recientes que se envían al Worker
  const SESSION_KEY = 'carbelec_session_id';

  // ═══ TEXTOS (el idioma sigue al de la página: <html lang>) ═══
  const TEXTS = {
    es: {
      title: 'Asistente CARBELEC', sub: 'Responde en segundos • IA', placeholder: 'Escribe tu pregunta...',
      footer: 'Powered by IA • CARBELEC S.A.S.', privacy: 'Privacidad', open: 'Abrir chat', close: 'Cerrar chat', send: 'Enviar',
      welcome: '¡Hola! 👋 Soy el asistente de *CARBELEC*. ¿Qué producto necesitas? Cuéntame y te doy precios al instante 😊',
      chips: [
        ['🔧 Herramientas', '¿Qué herramientas tienen?'],
        ['⚡ Eléctricos', '¿Qué productos eléctricos tienen?'],
        ['💰 Cotización', 'Necesito cotizar productos al por mayor'],
        ['🚚 Envíos', '¿Hacen envíos a todo Colombia?']
      ],
      newChat: '🔄 Nueva consulta', ended: 'Consulta finalizada',
      errTech: 'Disculpa, tuve un problema técnico. ¿Podrías intentar de nuevo?',
      errNet: 'No pude conectarme al servidor. Escríbenos directamente:',
      mlLink: '🛒 Tienda MercadoLibre', privLink: 'política de datos',
      contact: 'Hablar por WhatsApp', retry: 'Reintentar',
      contactHint: 'Pulsa Enviar en WhatsApp para compartir tu consulta.',
      assistantUnavailable: 'El asistente no está disponible ahora. Puedes continuar por WhatsApp.',
      waGreeting: 'Hola, vengo del chat de carbelec.co. Necesito ayuda con esta consulta:',
      tooLong: 'Escribe un mensaje de hasta 2000 caracteres.'
    },
    en: {
      title: 'CARBELEC Assistant', sub: 'Replies in seconds • AI', placeholder: 'Type your question...',
      footer: 'Powered by AI • CARBELEC S.A.S.', privacy: 'Privacy', open: 'Open chat', close: 'Close chat', send: 'Send',
      welcome: 'Hi! 👋 I\'m CARBELEC\'s assistant. What product do you need? Tell me and I\'ll give you prices right away 😊',
      chips: [
        ['🔧 Tools', 'What tools do you have?'],
        ['⚡ Electrical', 'What electrical products do you have?'],
        ['💰 Quote', 'I need a wholesale quote'],
        ['🚚 Shipping', 'Do you ship nationwide?']
      ],
      newChat: '🔄 New conversation', ended: 'Conversation ended',
      errTech: 'Sorry, I ran into a technical problem. Could you try again?',
      errNet: 'I couldn\'t reach the server. Message us directly:',
      mlLink: '🛒 MercadoLibre store', privLink: 'privacy policy',
      contact: 'Talk on WhatsApp', retry: 'Try again',
      contactHint: 'Press Send in WhatsApp to share your request.',
      assistantUnavailable: 'The assistant is unavailable right now. You can continue on WhatsApp.',
      waGreeting: 'Hi, I came from the chat on carbelec.co. I need help with this request:',
      tooLong: 'Please write a message of up to 2000 characters.'
    },
    pt: {
      title: 'Assistente CARBELEC', sub: 'Responde em segundos • IA', placeholder: 'Digite sua pergunta...',
      footer: 'Powered by IA • CARBELEC S.A.S.', privacy: 'Privacidade', open: 'Abrir chat', close: 'Fechar chat', send: 'Enviar',
      welcome: 'Olá! 👋 Sou o assistente da CARBELEC. Qual produto você precisa? Me conte e eu lhe dou preços na hora 😊',
      chips: [
        ['🔧 Ferramentas', 'Quais ferramentas vocês têm?'],
        ['⚡ Elétricos', 'Quais produtos elétricos vocês têm?'],
        ['💰 Orçamento', 'Preciso de orçamento'],
        ['🚚 Envios', 'Fazem envios para todo o país?']
      ],
      newChat: '🔄 Nova consulta', ended: 'Consulta finalizada',
      errTech: 'Desculpe, tive um problema técnico. Pode tentar de novo?',
      errNet: 'Não consegui conectar ao servidor. Fale conosco diretamente:',
      mlLink: '🛒 Loja MercadoLibre', privLink: 'política de dados',
      contact: 'Falar pelo WhatsApp', retry: 'Tentar novamente',
      contactHint: 'Toque em Enviar no WhatsApp para compartilhar sua consulta.',
      assistantUnavailable: 'O assistente está indisponível agora. Você pode continuar pelo WhatsApp.',
      waGreeting: 'Olá, vim do chat de carbelec.co. Preciso de ajuda com esta consulta:',
      tooLong: 'Escreva uma mensagem de até 2000 caracteres.'
    }
  };

  const byId = id => document.getElementById(id);
  const win = byId('chtWin');
  const toggle = byId('chtToggle');
  const closeBtn = byId('chtClose');
  const msgs = byId('chtMsgs');
  const form = byId('chtForm');
  const input = byId('chtInp');
  const sendBtn = byId('chtBtn');

  let chat = [];            // historial { role, content } que se envía al Worker
  let loading = false;      // hay una respuesta en camino
  let finished = false;     // solo una despedida explícita termina la conversación
  let pristine = false;     // solo se ve el saludo: todavía no se ha escrito nada

  const lang = () => {
    const code = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
    return TEXTS[code] ? code : 'es';
  };
  const tr = key => TEXTS[lang()][key];
  const isOpen = () => win.classList.contains('open');

  // sessionStorage puede estar bloqueado (modo privado, cookies desactivadas): se usa memoria como respaldo.
  const memory = {};
  const store = {
    get(key) {
      try { const value = sessionStorage.getItem(key); if (value !== null) return value; } catch (e) { /* sin acceso */ }
      return key in memory ? memory[key] : null;
    },
    set(key, value) {
      memory[key] = value;
      try { sessionStorage.setItem(key, value); } catch (e) { /* sin acceso */ }
    }
  };

  // ═══ SESSION ID ÚNICO POR VISITANTE ═══
  function nuevoSessionId() {
    const random = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
    const id = 'web-' + Date.now() + '-' + random;
    store.set(SESSION_KEY, id);
    return id;
  }
  let sessionId = store.get(SESSION_KEY) || nuevoSessionId();

  const ENLACE_PRIVACIDAD = /^(?:#privacidad|\/?privacidad\/?|(?:(?:https?:)?\/\/)?(?:www\.)?carbelec\.co\/privacidad\/?)$/i;
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen() && win.contains(document.activeElement)) {
      setOpen(false);
      toggle.focus();
    }
  });

  // ═══ ABRIR / CERRAR CHATBOT ═══
  // Use the visible viewport so the composer stays above a mobile keyboard.
  function syncChatViewport() {
    const viewport = window.visualViewport;
    const layoutHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleHeight = viewport ? viewport.height : layoutHeight;
    const viewportBottom = viewport ? Math.max(0, layoutHeight - viewport.height - viewport.offsetTop) : 0;
    const keyboardOpen = !!viewport && layoutHeight - viewport.height > 140 && document.activeElement === input;
    const style = document.documentElement.style;
    style.setProperty('--cht-viewport-height', Math.max(0, visibleHeight) + 'px');
    style.setProperty('--cht-viewport-bottom', viewportBottom + 'px');
    style.setProperty('--cht-panel-gap', keyboardOpen ? '8px' : '76px');
    win.classList.toggle('cht-short-viewport', visibleHeight < 420);
    toggle.classList.toggle('cht-keyboard-hidden', keyboardOpen && isOpen());
  }
  function setOpen(open) {
    win.classList.toggle('open', open);
    win.setAttribute('aria-hidden', String(!open));
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', tr(open ? 'close' : 'open'));
    if (open) {
      if (!msgs.childElementCount) showWelcome();
      // Opening the panel on a touch screen does not summon the keyboard.
      if (!finished && !window.matchMedia('(pointer: coarse)').matches) input.focus();
    } else {
      if (document.activeElement === input) input.blur();
      toggle.focus();
    }
    syncChatViewport();
  }
  function chtToggle() { setOpen(!isOpen()); }
  toggle.addEventListener('click', chtToggle);
  closeBtn.addEventListener('click', function () { setOpen(false); });

  // ═══ TEXTOS SEGÚN EL IDIOMA ═══
  function applyLang() {
    byId('chtTitle').textContent = tr('title');
    byId('chtSub').textContent = tr('sub');
    byId('chtFt').textContent = tr('footer');
    byId('chtPriv').textContent = tr('privacy');
    win.setAttribute('aria-label', tr('title'));
    closeBtn.setAttribute('aria-label', tr('close'));
    closeBtn.title = tr('close');
    input.placeholder = tr(finished ? 'ended' : 'placeholder');
    input.setAttribute('aria-label', tr('placeholder'));
    sendBtn.setAttribute('aria-label', tr('send'));
    toggle.setAttribute('aria-label', tr(isOpen() ? 'close' : 'open'));
    const again = msgs.querySelector('.cht-new');
    if (again) again.textContent = tr('newChat');
    if (pristine) showWelcome();      // aún no hay conversación: se repite el saludo en el nuevo idioma
  }
  document.addEventListener('carbelec:lang', applyLang);

  // ═══ BIENVENIDA ═══
  function showWelcome() {
    msgs.textContent = '';
    setFinished(false);
    addBot(tr('welcome'));
    const row = document.createElement('div');
    row.className = 'cht-qr';
    tr('chips').forEach(function (chip) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cht-qc';
      btn.textContent = chip[0];
      btn.dataset.msg = chip[1];
      row.appendChild(btn);
    });
    msgs.appendChild(row);
    pristine = true;
  }

  // ═══ ENLACES SEGUROS: el destino siempre es el número público de CARBELEC ═══
  // Cortar sin dividir emojis y sustituir sustitutos UTF-16 aislados antes de codificar URLs.
  function safeSnippet(value, limit) {
    let result = '';
    for (const character of String(value == null ? '' : value)) {
      const point = character.codePointAt(0);
      const next = point >= 0xD800 && point <= 0xDFFF ? '\uFFFD' : character;
      if (result.length + next.length > limit) break;
      result += next;
    }
    return result;
  }
  function makeWaLinks(text) {
    const encoded = encodeURIComponent(safeSnippet(text, 1600));
    return {
      url: 'https://wa.me/' + WA_PHONE + '?text=' + encoded,
      webUrl: 'https://web.whatsapp.com/send?phone=' + WA_PHONE + '&text=' + encoded
    };
  }
  function fallbackWaLinks() {
    const requests = chat.filter(m => m.role === 'user');
    const selected = requests.length > 4 ? [requests[0], ...requests.slice(-3)] : requests;
    return makeWaLinks(tr('waGreeting') + '\n' + selected.map(m => safeSnippet(m.content, 320)).join('\n'));
  }
  // No confiar en el dominio, número, etiqueta ni parámetros proporcionados por el modelo.
  function validateWaLink(value) {
    if (typeof value !== 'string' || value.length > 14000) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
      if (url.hostname === 'wa.me') {
        if (url.pathname !== '/' + WA_PHONE && url.pathname !== '/' + WA_PHONE + '/') return null;
        if ([...url.searchParams.keys()].some(key => key !== 'text')) return null;
      } else if (url.hostname === 'web.whatsapp.com' || url.hostname === 'api.whatsapp.com') {
        if (!/^\/send\/?$/.test(url.pathname) || url.searchParams.getAll('phone').length !== 1 || url.searchParams.get('phone') !== WA_PHONE) return null;
        if ([...url.searchParams.keys()].some(key => key !== 'text' && key !== 'phone')) return null;
      } else return null;
      if (url.searchParams.getAll('text').length > 1) return null;
      return makeWaLinks(url.searchParams.get('text') || '');
    } catch (error) { return null; }
  }
  function responseWaLinks(data) {
    const actions = data && Array.isArray(data.actions) ? data.actions.slice(0, 10) : [];
    const candidates = actions.filter(action => action && action.type === 'whatsapp')
      .flatMap(action => [action.url, action.webUrl]);
    candidates.push(data && data.whatsappUrl, data && data.whatsappWebUrl);
    for (const candidate of candidates) {
      const safe = validateWaLink(candidate);
      if (safe) return safe;
    }
    return fallbackWaLinks();
  }
  function addContactActions(data, explanation) {
    const links = responseWaLinks(data);
    const row = document.createElement('div');
    row.className = 'cht-actions';
    if (explanation) {
      const notice = document.createElement('p');
      notice.textContent = explanation;
      row.appendChild(notice);
    }
    const link = document.createElement('a');
    link.className = 'cht-wa-main';
    link.textContent = tr('contact');
    link.href = links.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    row.appendChild(link);
    const hint = document.createElement('p');
    hint.textContent = tr('contactHint');
    row.appendChild(hint);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ═══ TEXTO DEL BOT → NODOS SEGUROS; nunca insertar HTML del modelo ═══
  function safeBotLink(value) {
    if (value === 'carbelec.co/privacidad' || ENLACE_PRIVACIDAD.test(value)) return { href: '/privacidad/', label: tr('privLink') };
    const whatsapp = validateWaLink(value);
    if (whatsapp) return { href: whatsapp.url, label: tr('contact') };
    if (value === ML_URL || value === ML_URL + '/') return { href: ML_URL, label: tr('mlLink') };
    return null;
  }
  function renderBot(container, text) {
    const source = String(text).trim().replace(/^[ \t]*[*-][ \t]+/gm, '• ');
    const tokens = /\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>]+|carbelec\.co\/privacidad|\*\*[^*\n]+\*\*|\*[^*\n]+\*/g;
    let last = 0;
    for (const match of source.matchAll(tokens)) {
      container.appendChild(document.createTextNode(source.slice(last, match.index)));
      const token = match[0];
      if (token.startsWith('*')) {
        const bold = document.createElement('b');
        bold.textContent = token.replace(/^\*{1,2}|\*{1,2}$/g, '');
        container.appendChild(bold);
      } else {
        const markdown = token.match(/^\[[^\]\n]+\]\((.+)\)$/);
        const value = markdown ? markdown[1] : token;
        const tail = (value.match(/[.,;:!?)\]]+$/) || [''])[0];
        const safe = safeBotLink(tail ? value.slice(0, -tail.length) : value);
        if (safe) {
          const link = document.createElement('a');
          link.textContent = safe.label;
          link.href = safe.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          container.appendChild(link);
          if (tail) container.appendChild(document.createTextNode(tail));
        } else container.appendChild(document.createTextNode(token));
      }
      last = match.index + token.length;
    }
    container.appendChild(document.createTextNode(source.slice(last)));
  }

  // ═══ MENSAJES ═══
  function addMsg(className, fill) {
    const div = document.createElement('div');
    div.className = 'cht-m ' + className;
    fill(div);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }
  function addBot(text) { return addMsg('cht-bot', function (div) { renderBot(div, text); }); }
  function addUsr(text) { return addMsg('cht-usr', function (div) { div.textContent = text; }); }

  // ═══ INDICADOR DE ESCRITURA ═══
  function showTyp() {
    addMsg('cht-typ', function (div) {
      div.id = 'chtTyp';
      div.innerHTML = '<div class="cht-td"><span></span><span></span><span></span></div>';
    });
  }
  function hideTyp() {
    const typing = byId('chtTyp');
    if (typing) typing.remove();
  }

  // ═══ CONVERSACIÓN FINALIZADA ═══
  function setFinished(value) {
    finished = value;
    input.disabled = value;
    sendBtn.disabled = value || loading;
    input.placeholder = tr(value ? 'ended' : 'placeholder');
  }

  // ═══ MANEJAR INTENCIÓN DETECTADA ═══
  function handleIntencion(intencion) {
    // Una derivación abre una opción de contacto; el cliente puede seguir aclarando su consulta.
    if (intencion !== 'fin_consulta') return;
    setFinished(true);
    setTimeout(function () {
      if (!finished || msgs.querySelector('.cht-new')) return;
      const row = document.createElement('div');
      row.className = 'cht-qr cht-qr-end';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cht-qc cht-new';
      btn.dataset.action = 'new';
      btn.textContent = tr('newChat');
      row.appendChild(btn);
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }, 1500);
  }

  // ═══ NUEVA CONVERSACIÓN ═══
  function chtNuevaConversacion() {
    chat = [];
    sessionId = nuevoSessionId();
    input.value = '';
    showWelcome();
    input.focus();
  }

  // ═══ ENVIAR MENSAJE AL WORKER ═══
  // Últimos mensajes, empezando siempre por uno del usuario (algunas APIs rechazan un historial que empieza por el asistente).
  function recentChat() {
    const recent = chat.slice(-HISTORY_WINDOW);
    while (recent.length > 1 && recent[0].role !== 'user') recent.shift();
    const first = chat.find(message => message.role === 'user');
    if (first && !recent.includes(first)) {
      // Retener la petición original además del contexto más reciente, máximo 20 mensajes.
      if (recent.length >= HISTORY_WINDOW) recent.shift();
      recent.unshift(first);
    }
    // Dejar margen para sessionId/idioma dentro del límite del Worker de 64 KiB.
    while (recent.length > 2 && new TextEncoder().encode(JSON.stringify(recent)).length > 60000) recent.splice(1, 1);
    return recent;
  }

  async function askWorker() {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentChat(), sessionId: sessionId, language: lang() }),
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('Worker HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendMsg(text) {
    text = String(text || '').trim();
    if (!text || loading || finished) return;
    if (text.length > 2000) { addBot(tr('tooLong')); if (!input.value) input.value = text; return; }
    loading = true;
    pristine = false;
    sendBtn.disabled = true;
    const userBubble = addUsr(text);
    chat.push({ role: 'user', content: text });
    showTyp();

    let reply = null;
    let result = null;
    let error = null;
    try {
      const data = await askWorker();
      const part = data && data.content && data.content[0];
      if (part && typeof part.text === 'string' && part.text.trim() && part.text.length <= 12000) { reply = part.text; result = data; }
      else error = 'errTech';
    } catch (e) {
      error = 'errNet';
    }
    hideTyp();

    if (reply) {
      // Keep the server's answer as conversation context, but show a handoff only once.
      chat.push({ role: 'assistant', content: reply });
      const intentsWithContact = ['handoff', 'asesor', 'solicitud_asesor', 'confirmacion_compra', 'solicitud_cotizacion', 'burro_amarrado'];
      const handoff = (result.handoff && result.handoff.required === true) || intentsWithContact.includes(result.intencion) || result.degraded === true;
      if (handoff) addContactActions(result, result.degraded === true ? tr('assistantUnavailable') : null);
      else addBot(reply);
      handleIntencion(result.intencion);
    } else {
      // The same card explains the failure and preserves the request in its one contact link.
      addContactActions(null, tr(error === 'errNet' ? 'errNet' : 'errTech'));
      chat.pop();                      // una respuesta fallida no crea contexto ficticio
      userBubble.dataset.failed = 'true';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'cht-qc cht-retry';
      retry.textContent = tr('retry');
      retry.dataset.retry = text;
      msgs.appendChild(retry);
      if (!input.value) input.value = text; // respeta cualquier otro borrador que el cliente esté escribiendo
    }

    loading = false;
    sendBtn.disabled = finished;
    if (!finished) input.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || loading || finished) return;
    input.value = '';
    sendMsg(text);
  });
  // Respuestas rápidas y botón «Nueva consulta»
  msgs.addEventListener('click', function (e) {
    const chip = e.target.closest('.cht-qc');
    if (!chip || loading) return;
    if (chip.dataset.action === 'new') {
      chtNuevaConversacion();
    } else if (chip.dataset.retry && !finished) {
      const retryText = chip.dataset.retry;
      if (input.value.trim() === retryText) input.value = '';
      chip.remove();
      sendMsg(retryText);
    } else if (chip.dataset.msg && !finished) {
      chip.parentNode.remove();          // las sugerencias desaparecen al usar una
      sendMsg(chip.dataset.msg);
    }
  });

  // ═══ INICIO ═══
  applyLang();
  toggle.hidden = false;

  // The chat opens only after the visitor activates its button.
  window.addEventListener('resize', syncChatViewport, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncChatViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', syncChatViewport, { passive: true });
  }
  input.addEventListener('focus', syncChatViewport);
  input.addEventListener('blur', syncChatViewport);
  syncChatViewport();
}
