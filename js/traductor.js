/**
 * traductor.js — Traducción del sitio al inglés con Google Translate.
 *
 * - El script de Google solo se descarga cuando la persona pide la traducción
 *   (o si ya la había pedido antes: la preferencia queda en la cookie
 *   "googtrans" que usa el propio Google, y se mantiene al navegar).
 * - Un solo botón alterna: "English" ⇄ "Español". Volver al español borra la
 *   cookie y recarga, que es la única forma limpia de restaurar el original.
 * - Los nombres propios (hospital, municipio, programas) se protegen para
 *   que Google no los traduzca ("San Antonio" → "Saint Anthony").
 * - Se oculta la barra que Google inserta arriba (tapaba la barra GOV.CO).
 */
(function () {
  'use strict';

  const IDIOMA_ORIGEN = 'es';
  const IDIOMA_DESTINO = 'en';

  // Nombres propios que Google traduce mal ("San Antonio" → "Saint Anthony",
  // "Signos en Red" → "Signs in the Network"). Solo se protegen los que lo
  // necesitan: cada término protegido corta la frase y Google la traduce peor
  // (p. ej. "Roldanillo" no se toca porque Google ya lo deja igual).
  const NO_TRADUCIR = [
    'Hospital Departamental San Antonio',
    'Signos en Red',
    'San Antonio',
  ].sort((a, b) => b.length - a.length);

  const leerCookie = () => {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
  };
  const estaTraducido = () => {
    const c = leerCookie();
    return !!c && c !== `/${IDIOMA_ORIGEN}/${IDIOMA_ORIGEN}` && c.split('/')[2] !== IDIOMA_ORIGEN;
  };

  function escribirCookie(valor) {
    const host = location.hostname;
    const partes = host.split('.');
    // Google la guarda con y sin dominio; hay que cubrir todas las variantes
    const dominios = ['', host, '.' + host];
    if (partes.length > 2) dominios.push('.' + partes.slice(-3).join('.'), '.' + partes.slice(-2).join('.'));
    dominios.forEach(d => {
      const dom = d ? `; domain=${d}` : '';
      document.cookie = valor
        ? `googtrans=${valor}; path=/${dom}; SameSite=Lax`
        : `googtrans=; path=/${dom}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }

  // Envuelve los nombres propios en <span translate="no"> dentro del contenido visible.
  // Sin distinguir mayúsculas (hay títulos en mayúsculas) y llevando dentro del
  // span los espacios vecinos: Google borra los espacios que quedan fuera
  // ("Actualización por el Sismo en Roldanillo" → "Earthquake UpdateRoldanillo").
  const patron = new RegExp('(\\s?(?:' + NO_TRADUCIR.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\s?)', 'gi');
  function protegerNombres(raiz) {
    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest('script, style, noscript, textarea, [translate="no"], .notranslate, .skiptranslate')) return NodeFilter.FILTER_REJECT;
        patron.lastIndex = 0;
        return patron.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    nodos.forEach(n => {
      const frag = document.createDocumentFragment();
      n.nodeValue.split(patron).forEach((trozo, i) => {
        if (!trozo) return;
        if (i % 2 === 1) {
          const s = document.createElement('span');
          s.setAttribute('translate', 'no');
          s.className = 'notranslate';
          s.textContent = trozo;
          frag.appendChild(s);
        } else {
          frag.appendChild(document.createTextNode(trozo));
        }
      });
      n.replaceWith(frag);
    });
  }

  let cargando = null;
  function cargarGoogle() {
    if (cargando) return cargando;
    cargando = new Promise((resolve, reject) => {
      let contenedor = document.getElementById('google_translate_element');
      if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'google_translate_element';
        document.body.appendChild(contenedor);
      }
      contenedor.hidden = true;

      window.googleTranslateElementInit = function () {
        try {
          new google.translate.TranslateElement({
            pageLanguage: IDIOMA_ORIGEN,
            includedLanguages: IDIOMA_DESTINO,
            autoDisplay: false
          }, 'google_translate_element');
          resolve();
        } catch (e) { reject(e); }
      };
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      s.onerror = () => reject(new Error('No se pudo cargar Google Translate'));
      document.head.appendChild(s);
    });
    return cargando;
  }

  // Mientras la página está traducida, protege también el contenido que se carga después
  let observador = null;
  function vigilarContenido() {
    if (observador) return;
    let pendiente = null;
    observador = new MutationObserver(muts => {
      if (pendiente) return;
      if (!muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !n.closest?.('.skiptranslate')))) return;
      pendiente = setTimeout(() => { pendiente = null; protegerNombres(document.body); }, 200);
    });
    observador.observe(document.body, { childList: true, subtree: true });
  }

  function traducir() {
    protegerNombres(document.body);
    vigilarContenido();
    escribirCookie(`/${IDIOMA_ORIGEN}/${IDIOMA_DESTINO}`);
    return cargarGoogle();
  }

  function volverAlEspanol() {
    escribirCookie('');
    location.reload();
  }

  function pintarBoton(btn) {
    const traducido = estaTraducido();
    btn.setAttribute('translate', 'no');
    btn.classList.add('notranslate');
    btn.setAttribute('aria-pressed', traducido ? 'true' : 'false');
    if (traducido) {
      btn.lang = 'es';
      btn.innerHTML = '<i class="bi bi-translate" aria-hidden="true"></i> Español';
      btn.setAttribute('aria-label', 'Ver el sitio en español (idioma original)');
      btn.title = 'Ver el sitio en español';
    } else {
      btn.lang = 'en';
      btn.innerHTML = '<i class="bi bi-translate" aria-hidden="true"></i> English';
      btn.setAttribute('aria-label', 'Translate this site into English');
      btn.title = 'Translate this site into English (Google Translate)';
    }
  }

  function iniciarBoton() {
    const btn = document.getElementById('translate-now');
    if (!btn || btn.dataset.traductorListo) return !!btn;
    btn.dataset.traductorListo = '1';
    pintarBoton(btn);
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (estaTraducido()) { volverAlEspanol(); return; }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Translating…';
      traducir()
        .then(() => { btn.disabled = false; pintarBoton(btn); })
        .catch(() => {
          escribirCookie('');
          btn.disabled = false;
          pintarBoton(btn);
          const msg = 'No se pudo cargar el traductor. Intente de nuevo más tarde.';
          if (window.notify) window.notify(msg, { type: 'danger' }); else alert(msg);
        });
    });
    return true;
  }

  function iniciar() {
    // Si la persona ya había elegido inglés, se traduce sola al entrar a cada página
    if (estaTraducido()) traducir().catch(() => {});
    // El botón vive en el header, que se inserta de forma dinámica
    if (!iniciarBoton()) {
      document.addEventListener('partialsLoaded', iniciarBoton, { once: true });
      const obs = new MutationObserver(() => { if (iniciarBoton()) obs.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 10000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
