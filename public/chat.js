// Chat de prueba del asistente de Frigorífico La Trinidad.
// Solo se carga si la página se abre con ?bot=1 (ver index.html). Habla con /api/chat, que Firebase Hosting
// manda a la función chatWeb. Es una PRUEBA: los pedidos que arma no se guardan.
(() => {
  'use strict';

  const ENDPOINT = '/api/chat';
  const CLAVE = 'lt_chat_sesion';
  const ESPERA_MAX_MS = 25000;
  const ATAJOS = [
    ['Menú', 'menú'], ['Pedido', '1'], ['Horarios', '2'], ['Precios', '3'], ['Promos', '4'], ['Estado', '5'], ['Persona', '6'],
  ];

  const nuevaSesion = () => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return `w${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  };
  const leerSesion = () => {
    let s = null;
    try { s = localStorage.getItem(CLAVE); } catch { /* sin almacenamiento: la sesión dura lo que dure la página */ }
    if (!s || !/^[A-Za-z0-9_-]{8,64}$/.test(s)) {
      s = nuevaSesion();
      try { localStorage.setItem(CLAVE, s); } catch { /* idem */ }
    }
    return s;
  };
  let sesion = leerSesion();

  const css = `
    .ltc-boton{position:fixed;right:16px;bottom:16px;z-index:9999;background:#7a1f26;color:#fff;border:0;border-radius:999px;padding:12px 20px;font:600 15px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
    .ltc-boton:hover{background:#5c161c}
    .ltc-panel{position:fixed;right:16px;bottom:16px;z-index:10000;width:min(380px,calc(100vw - 24px));height:min(580px,calc(100vh - 32px));background:#fff;border:1px solid #e4ded8;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font:15px/1.45 system-ui,sans-serif;color:#231f20}
    .ltc-panel.ltc-abierto{display:flex}
    .ltc-cab{background:#7a1f26;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}
    .ltc-cab strong{flex:1;font-size:15px}
    .ltc-tag{background:#fff;color:#7a1f26;border-radius:999px;font-size:11px;font-weight:700;padding:2px 8px;letter-spacing:.04em}
    .ltc-icono{background:transparent;border:0;color:#fff;cursor:pointer;font-size:13px;padding:4px 6px;border-radius:6px}
    .ltc-icono:hover{background:rgba(255,255,255,.18)}
    .ltc-msgs{flex:1;overflow-y:auto;padding:14px;background:#f7f4f0;display:flex;flex-direction:column;gap:8px}
    .ltc-m{max-width:86%;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-break:break-word;border:1px solid #e4ded8;background:#fff}
    .ltc-m.ltc-yo{align-self:flex-end;background:#7a1f26;color:#fff;border-color:#7a1f26}
    .ltc-m.ltc-esperando{color:#6b6561;font-style:italic}
    .ltc-atajos{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid #e4ded8;background:#fff}
    .ltc-atajos button{border:1px solid #7a1f26;background:#fff;color:#7a1f26;border-radius:999px;padding:4px 11px;font:600 13px/1.3 system-ui,sans-serif;cursor:pointer}
    .ltc-atajos button:hover{background:#7a1f26;color:#fff}
    .ltc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e4ded8;background:#fff}
    .ltc-form input{flex:1;min-width:0;border:1px solid #cfc7bf;border-radius:10px;padding:9px 11px;font:15px system-ui,sans-serif}
    .ltc-form button{border:0;background:#7a1f26;color:#fff;border-radius:10px;padding:9px 15px;font:600 15px system-ui,sans-serif;cursor:pointer}
    .ltc-form button:disabled,.ltc-form input:disabled{opacity:.55;cursor:not-allowed}
    .ltc-nota{font-size:12px;color:#6b6561;padding:0 12px 10px;background:#fff}
    .ltc-panel :focus-visible,.ltc-boton:focus-visible{outline:3px solid #e0a3a8;outline-offset:2px}
  `;
  const estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.appendChild(estilo);

  const el = (tag, clase, texto) => {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };

  const boton = el('button', 'ltc-boton', 'Probar el asistente');
  boton.type = 'button';
  boton.setAttribute('aria-haspopup', 'dialog');

  const panel = el('div', 'ltc-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat de prueba con el asistente');

  const cab = el('div', 'ltc-cab');
  const titulo = el('strong', '', 'Asistente La Trinidad');
  const tag = el('span', 'ltc-tag', 'PRUEBA');
  const reiniciar = el('button', 'ltc-icono', 'Reiniciar');
  reiniciar.type = 'button';
  reiniciar.title = 'Empezar una conversación nueva';
  const cerrar = el('button', 'ltc-icono', 'Cerrar');
  cerrar.type = 'button';
  cab.append(titulo, tag, reiniciar, cerrar);

  const msgs = el('div', 'ltc-msgs');
  msgs.setAttribute('role', 'log');
  msgs.setAttribute('aria-live', 'polite');

  const atajos = el('div', 'ltc-atajos');
  const form = el('form', 'ltc-form');
  const campo = el('input');
  campo.type = 'text';
  campo.maxLength = 500;
  campo.placeholder = 'Escribí tu mensaje';
  campo.setAttribute('aria-label', 'Tu mensaje');
  campo.autocomplete = 'off';
  const enviar = el('button', '', 'Enviar');
  enviar.type = 'submit';
  form.append(campo, enviar);

  const nota = el('div', 'ltc-nota', 'Esto es una prueba: los pedidos que arme no se guardan.');
  panel.append(cab, msgs, atajos, form, nota);
  document.body.append(boton, panel);

  let ocupado = false;
  let saludado = false;

  const burbuja = (texto, clase) => {
    const m = el('div', `ltc-m ${clase || ''}`.trim(), texto);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  };

  const bloquear = (si) => {
    ocupado = si;
    campo.disabled = si;
    enviar.disabled = si;
    atajos.querySelectorAll('button').forEach((b) => { b.disabled = si; });
  };

  const mandar = async (texto) => {
    const limpio = String(texto || '').trim();
    if (!limpio || ocupado) return;
    burbuja(limpio, 'ltc-yo');
    const espera = burbuja('Escribiendo…', 'ltc-esperando');
    bloquear(true);
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_MAX_MS);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion, texto: limpio }),
        signal: control.signal,
      });
      const datos = await r.json().catch(() => ({}));
      espera.remove();
      const respuestas = Array.isArray(datos.respuestas) && datos.respuestas.length
        ? datos.respuestas
        : ['No pude responder ahora. Probá de nuevo en un momento.'];
      respuestas.forEach((t) => burbuja(String(t)));
    } catch {
      espera.remove();
      burbuja('No me pude conectar. Revisá tu internet y probá de nuevo.');
    } finally {
      clearTimeout(reloj);
      bloquear(false);
      campo.value = '';
      campo.focus();
    }
  };

  ATAJOS.forEach(([rotulo, texto]) => {
    const b = el('button', '', rotulo);
    b.type = 'button';
    b.addEventListener('click', () => mandar(texto));
    atajos.appendChild(b);
  });

  const abrir = () => {
    panel.classList.add('ltc-abierto');
    boton.style.display = 'none';
    if (!saludado) {
      saludado = true;
      mandar('hola');
    } else {
      campo.focus();
    }
  };
  const cerrarPanel = () => {
    panel.classList.remove('ltc-abierto');
    boton.style.display = '';
    boton.focus();
  };

  boton.addEventListener('click', abrir);
  cerrar.addEventListener('click', cerrarPanel);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarPanel(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); mandar(campo.value); });
  reiniciar.addEventListener('click', () => {
    if (ocupado) return;
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    sesion = leerSesion();
    msgs.replaceChildren();
    mandar('hola');
  });
})();
