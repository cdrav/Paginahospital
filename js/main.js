// main.js - Inicialización centralizada de Google Translate y utilidades de UI
(function () {
  const GT_SRC = 'https://translate.google.com/translate_a/element.js';
  let retryCount = 0;
  const maxRetries = 20; // Aumentado a 20 reintentos
  const intervalMs = 500;

  // Función para detectar si es Microsoft Edge
  function isEdge() {
    return navigator.userAgent.indexOf('Edg/') > -1 || 
           navigator.userAgent.indexOf('Edge/') > -1;
  }

  function ensureGTScript() {
    const exists = document.querySelector('script[src*="translate_a/element.js"]');
    if (exists) return exists;
    
    // Para Edge, forzar recarga sin caché
    const url = isEdge() ? `${GT_SRC}?v=${new Date().getTime()}` : GT_SRC;
    
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => {
      if (window.console && console.debug) console.debug('[GT] Script cargado');
      // Pequeño retraso para asegurar que el objeto google esté disponible
      setTimeout(mountTranslate, 100);
    };
    s.onerror = (e) => {
      console.error('[GT] Error cargando script de Google Translate', e);
      // Reintentar si falla
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(ensureGTScript, 1000);
      }
    };
    
    // Asegurar que el script se cargue antes que otros elementos
    s.crossOrigin = 'anonymous';
    document.head.insertBefore(s, document.head.firstChild);
    return s;
  }

  function mountTranslate() {
    const el = document.getElementById('google_translate_element');
    if (!el) {
      if (window.console) console.warn('[GT] Elemento del traductor no encontrado');
      return false;
    }
    
    // Verificar si el objeto google está disponible
    if (!window.google) {
      if (window.console) console.warn('[GT] Objeto google no está disponible aún');
      return false;
    }
    
    if (!google.translate || !google.translate.TranslateElement) {
      if (window.console) console.warn('[GT] API de Google Translate no está disponible');
      return false;
    }
    
    if (el.getAttribute('data-gt-initialized') === '1') return true;
    
    try {
      // Configuración mejorada para Edge
      const config = {
        pageLanguage: 'es',
        includedLanguages: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        // Forzar recarga para Edge
        autoDisplay: isEdge() ? false : true
      };
      
      new google.translate.TranslateElement(config, 'google_translate_element');
      
      // Para Edge, forzar la visualización
      if (isEdge()) {
        const style = document.createElement('style');
        style.textContent = `
          .goog-te-gadget {
            color: transparent !important;
            font-size: 0 !important;
          }
          .goog-te-gadget-simple {
            background-color: transparent !important;
            border: none !important;
          }
          .goog-te-menu-value span {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
        
        // Forzar la visualización del selector
        const forceShow = setInterval(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.style.display = 'block';
            select.style.visibility = 'visible';
            clearInterval(forceShow);
          }
        }, 100);
      }
      
      el.setAttribute('data-gt-initialized', '1');
      el.style.display = 'inline-block';
      el.style.visibility = 'visible';
      
      if (window.console && console.debug) console.debug('[GT] Widget montado correctamente');
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
