// main.js - Inicialización centralizada de Google Translate y utilidades de UI
(function () {
  const GT_SRC = 'https://translate.google.com/translate_a/element.js';
  let retryCount = 0;
  const maxRetries = 16; // ~8s si interval = 500ms
  const intervalMs = 500;

  function ensureGTScript() {
    const exists = document.querySelector('script[src*="translate_a/element.js"]');
    if (exists) return exists;
    const s = document.createElement('script');
    s.src = GT_SRC;
    s.async = true;
    s.onload = () => {
      if (window.console && console.debug) console.debug('[GT] Script cargado');
      mountTranslate();
    };
    s.onerror = () => console.error('[GT] Error cargando script de Google Translate');
    document.head.appendChild(s);
    return s;
  }

  function mountTranslate() {
    const el = document.getElementById('google_translate_element');
    if (!el) return false;
    if (!(window.google && google.translate && google.translate.TranslateElement)) return false;
    if (el.getAttribute('data-gt-initialized') === '1') return true;
    try {
      new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
      el.setAttribute('data-gt-initialized', '1');
      // Asegurar visibilidad
      el.style.display = 'inline-block';
      el.style.visibility = 'visible';
      if (window.console && console.debug) console.debug('[GT] Widget montado');
      return true;
    } catch (e) {
      console.error('[GT] Error al montar el widget:', e);
      return false;
    }
  }

  function setupTranslateButton() {
    const btn = document.getElementById('translate-now');
    if (!btn) return;
    if (btn.getAttribute('data-gt-listener') === '1') return;
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang') || 'en';
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo) {
        if (window.console) console.warn('[GT] Select del traductor no disponible aún');
        mountTranslate();
        return;
      }
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
    });
    btn.setAttribute('data-gt-listener', '1');
  }

  function startRetries() {
    const timer = setInterval(() => {
      retryCount++;
      const ok = mountTranslate();
      setupTranslateButton();
      if (ok || retryCount >= maxRetries) {
        clearInterval(timer);
        if (!ok) console.warn('[GT] No se pudo montar el widget tras los reintentos');
      }
    }, intervalMs);
  }

  function observeHeader() {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder || placeholder.getAttribute('data-gt-observing') === '1') return;
    const obs = new MutationObserver(() => {
      if (mountTranslate()) {
        setupTranslateButton();
      }
    });
    obs.observe(placeholder, { childList: true, subtree: true });
    placeholder.setAttribute('data-gt-observing', '1');
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureGTScript();
    // Intentos periódicos para cubrir carga diferida del header y del script
    startRetries();
    observeHeader();
  });

  window.addEventListener('load', () => {
    mountTranslate();
    setupTranslateButton();
  });
})();
