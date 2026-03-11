// main.js - Utilidades de interfaz para Google Translate y otras mejoras
(function () {
  // --- Lazy Load YouTube Videos ---
  function initializeLazyYouTube() {
    const lazyYouTubeVideos = document.querySelectorAll('.lazy-youtube');
    
    lazyYouTubeVideos.forEach(video => {
      const videoId = video.dataset.youtubeId;
      if (!videoId) return;

      // Crear un elemento <img> para la miniatura para un mejor control y accesibilidad.
      const thumbnail = document.createElement('img');
      thumbnail.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      thumbnail.alt = video.title || 'Vista previa del video';
      thumbnail.classList.add('lazy-youtube-thumbnail');
      
      // Fallback por si la miniatura de máxima resolución no existe.
      thumbnail.onerror = function() {
        this.onerror = null; // Prevenir bucles infinitos si esta también falla.
        this.src = `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`;
      };

      video.appendChild(thumbnail);

      // Add play button
      const playButton = document.createElement('div');
      playButton.className = 'play-button';
      video.appendChild(playButton);

      // Add click listener
      video.addEventListener('click', function() {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('title', this.title || 'Video de YouTube'); // Use existing title
        
        // Replace placeholder with iframe
        this.innerHTML = '';
        this.appendChild(iframe);
        this.classList.remove('lazy-youtube'); // Remove class to prevent re-triggering
      }, { once: true });
    });
  }

  // Función para cargar el script de Google Translate
  function loadGoogleTranslateScript(callback) {
    // Verificar si ya está cargado
    if (window.google && window.google.translate) {
      if (callback) callback();
      return;
    }
    
    // Crear el script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    
    // Manejar errores
    script.onerror = function() {
      console.warn('Error al cargar Google Translate');
      if (callback) callback(new Error('No se pudo cargar el traductor'));
    };
    
    // Agregar a la página
    document.head.appendChild(script);
    
    // Configurar la función de inicialización global
    window.googleTranslateElementInit = function() {
      if (window.google && window.google.translate) {
        new google.translate.TranslateElement({
          pageLanguage: 'es',
          includedLanguages: 'en,fr,pt',
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
        
        // Ocultar el banner de Google
        const googleBanner = document.querySelector('.goog-te-banner-frame');
        if (googleBanner) {
          googleBanner.style.display = 'none';
        }
        
        if (callback) callback();
      } else if (callback) {
        callback(new Error('Google Translate no está disponible'));
      }
    };
  }

  // Función para configurar el botón de traducción
  function setupTranslateButton() {
    const btn = document.getElementById('translate-now');
    if (!btn) return;
    
    // Mostrar el botón
    btn.style.display = 'inline-block';
    
    // Configurar evento de clic
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Mostrar indicador de carga
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
      btn.disabled = true;
      
      // Cargar el script de Google Translate
      loadGoogleTranslateScript(function(error) {
        // Restaurar el botón
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (error) {
          console.error('Error al cargar el traductor:', error);
          // Usar el sistema de notificaciones del sitio en lugar de un alert.
          if (window.notify) {
            window.notify('No se pudo cargar el traduector. Por favor, intente de nuevo más tarde.', { type: 'danger' });
          } else {
            alert('No se pudo cargar el traductor. Por favor, intente de nuevo más tarde.');
          }
          return;
        }
        
        // Mostrar/ocultar el selector de idiomas
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
          translateElement.style.display = translateElement.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
  }
  
  // Función para inicializar componentes de Bootstrap (Tooltips y Popovers)
  function initializeBootstrapComponents() {
    // Verificar si Bootstrap está cargado
    if (typeof bootstrap !== 'undefined') {
      // Inicializar tooltips
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
      
      // Inicializar popovers
      var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
      popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
      });
    }
  }

  // Inicialización cuando el DOM esté listo
  function initializeSiteFeatures() {
    initializeLazyYouTube();
    
    // Crear contenedor para el traductor si no existe
    if (!document.getElementById('google_translate_element')) {
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.display = 'none';
      document.body.appendChild(translateDiv);
    }
    
    // Configurar el botón de traducción
    setupTranslateButton();
    
    // Inicializar componentes de Bootstrap
    initializeBootstrapComponents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteFeatures);
  } else {
    initializeSiteFeatures();
  }
})();
