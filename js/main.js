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
  
  // Optimización: Usar MutationObserver en lugar de setInterval para el widget de Google Translate
  function observeTranslateWidget() {
    const targetNode = document.getElementById('google_translate_element');
    if (!targetNode) {
      // Si el elemento no existe aún, reintentar en un momento.
      // Esto es un fallback por si el script se ejecuta antes de que el layout.js inserte el header.
      setTimeout(observeTranslateWidget, 100);
      return;
    }

    // Función a ejecutar cuando se detectan mutaciones
    const callback = function(mutationsList, observer) {
      // El widget de Google a menudo se envuelve en un iframe o modifica sus hijos.
      // Simplemente corremos nuestra función de corrección cada vez que cambia.
      checkAndFixTranslateElement();
      
      // Opcional: si sabemos que el widget solo se carga una vez, podemos desconectar el observador.
      // Pero es más seguro dejarlo activo por si hay cambios dinámicos.
      // observer.disconnect();
    };

    // Crear una instancia de observador
    const observer = new MutationObserver(callback);

    // Configuración del observador: vigilar cambios en los hijos del elemento
    const config = { childList: true, subtree: true };

    // Empezar a observar el nodo objetivo
    observer.observe(targetNode, config);

    // Ejecutar una vez al inicio por si el widget ya está presente
    checkAndFixTranslateElement();
  }

  // Inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupTranslateButton();
      observeTranslateWidget();
    });
  } else {
    setupTranslateButton();
    observeTranslateWidget();
  }
})();
