// Markup of the pieces every page shares but that only work with JavaScript: the quote list, the floating
// WhatsApp button and the chat. They are added here so the pages do not each carry a copy.
import { icon } from './card.js';

const QUOTE_AND_WHATSAPP = `
<button type="button" class="q-bar" id="qBar" aria-haspopup="dialog" hidden>${icon('list')} <span data-i18n="q_title">Mi cotización</span> <span class="q-n" id="qBarN">0</span></button>
<div class="q-overlay" id="qOverlay" hidden>
  <div class="q-panel" role="dialog" aria-modal="true" aria-labelledby="qTitle">
    <div class="q-hdr"><h2 id="qTitle" data-i18n="q_title">Mi cotización</h2><button type="button" class="q-close" id="qClose" aria-label="Cerrar" data-i18n-attr="aria-label:q_close">✕</button></div>
    <ul class="q-list" id="qList"></ul>
    <div class="q-foot">
      <p class="q-total"><span data-i18n="q_total">Total de referencia</span> <strong id="qTotal"></strong></p>
      <p class="q-note" data-i18n="q_note">Los precios son de referencia. Te confirmamos disponibilidad y precio final al responder.</p>
      <div class="q-acts">
        <a class="btn btn-wa btn-sm" id="qWa" target="_blank" rel="noopener">${icon('whatsapp')} <span data-i18n="q_wa">Enviar por WhatsApp</span></a>
        <button type="button" class="btn btn-out btn-sm" id="qMail">${icon('envelope')} <span data-i18n="q_mail">Enviar por correo</span></button>
        <button type="button" class="q-clear" id="qClear" data-i18n="q_clear">Vaciar lista</button>
      </div>
    </div>
  </div>
</div>
<template id="qTpl">
  <li class="q-item">
    <span class="q-name"></span>
    <span class="q-price"></span>
    <span class="q-qty"><button type="button" class="q-dec" aria-label="−">−</button><input type="number" min="1" max="9999" inputmode="numeric" data-i18n-attr="aria-label:q_qty"><button type="button" class="q-inc" aria-label="+">+</button></span>
    <button type="button" class="q-del" data-i18n-attr="aria-label:q_remove">✕</button>
  </li>
</template>

<a class="wa-fab" href="https://wa.me/573153899483?text=Hola%2C%20vengo%20de%20carbelec.co%20y%20quiero%20hacer%20una%20consulta" target="_blank" rel="noopener" data-i18n-attr="aria-label:wa_fab">${icon('whatsapp')}<span>WhatsApp</span></a>
`;

const CHAT = `
<button type="button" class="cht-toggle" id="chtToggle" aria-label="Abrir chat" aria-expanded="false" aria-controls="chtWin" hidden>
  <svg class="cht-ico-o" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
  <svg class="cht-ico-c" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
</button>

<div class="cht-win" id="chtWin" role="dialog" aria-label="Asistente CARBELEC" aria-hidden="true">
  <div class="cht-hdr">
    <div class="cht-av" aria-hidden="true">C</div>
    <div><h2 id="chtTitle">Asistente CARBELEC</h2><p id="chtSub">Responde en segundos • IA</p></div>
    <div class="cht-dot" aria-hidden="true"></div>
    <button type="button" class="cht-close" id="chtClose" aria-label="Cerrar chat" aria-controls="chtWin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z"/></svg></button>
  </div>
  <div class="cht-msgs" id="chtMsgs" role="log" aria-live="polite"></div>
  <form class="cht-in" id="chtForm">
    <input type="text" class="cht-inp" id="chtInp" placeholder="Escribe tu pregunta..." aria-label="Escribe tu pregunta..." autocomplete="off" enterkeyhint="send" maxlength="2000">
    <button type="submit" class="cht-snd" id="chtBtn" aria-label="Enviar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
  </form>
  <div class="cht-ft"><span id="chtFt">Powered by IA • CARBELEC S.A.S.</span> • <a href="/privacidad/" id="chtPriv" target="_blank" rel="noopener">Privacidad</a></div>
</div>
`;

export function mountWidgets() {
  document.body.insertAdjacentHTML('beforeend', QUOTE_AND_WHATSAPP + CHAT);
}
