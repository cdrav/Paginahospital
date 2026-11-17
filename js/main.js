// main.js - Utilidades de interfaz (videos de YouTube diferidos, tooltips y popovers)
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

  // La traducción del sitio se maneja en js/traductor.js (cargado desde partials/header.html)

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

    // Inicializar componentes de Bootstrap
    initializeBootstrapComponents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteFeatures);
  } else {
    initializeSiteFeatures();
  }
})();
