// main.js - Utilidades de interfaz para Google Translate
(function () {
  // Función para configurar el botón de traducción
  function setupTranslateButton() {
    const btn = document.getElementById('translate-now');
    if (!btn) return;
    
    // Si ya tiene el listener, salir
    if (btn.getAttribute('data-gt-listener') === '1') return;
    
    btn.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang') || 'en';
      const combo = document.querySelector('.goog-te-combo');
      
      if (combo) {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
      } else {
        console.warn('No se encontró el selector de idioma de Google Translate');
        // Intentar forzar la recarga del widget
        if (window.google && google.translate && google.translate.TranslateElement) {
          new google.translate.TranslateElement({
            pageLanguage: 'es',
            includedLanguages: 'en',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');
        }
      }
    });
    
    // Marcar que ya tiene el listener
    btn.setAttribute('data-gt-listener', '1');
  }
  
  // Función para verificar y corregir la visibilidad del selector
  function checkAndFixTranslateElement() {
    const el = document.getElementById('google_translate_element');
    if (!el) return;
    
    // Asegurar que el contenedor sea visible
    el.style.display = 'inline-block';
    el.style.visibility = 'visible';
    
    // Verificar si el selector está presente
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.style.display = 'block';
      combo.style.visibility = 'visible';
    }
  }
  
  // Inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupTranslateButton();
      // Verificar periódicamente el estado del traductor
      setInterval(checkAndFixTranslateElement, 1000);
    });
  } else {
    setupTranslateButton();
    setInterval(checkAndFixTranslateElement, 1000);
  }
})();
