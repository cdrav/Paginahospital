/**
 * accessibility-styles.js
 * Script para aplicar estilos de accesibilidad y posicionamiento de elementos
 */

document.addEventListener('DOMContentLoaded', function() {
  // Posicionamiento responsivo para la barra de accesibilidad (evitar forzar centro en móviles)
  const initAccessibilityButtons = () => {
    const accessibilityContainer = document.querySelector('.accessibility-buttons-container');
    if (!accessibilityContainer) return;

    const applyPosition = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;

      // Reset de propiedades que pueden venir de estilos previos
      Object.assign(accessibilityContainer.style, {
        position: 'fixed',
        zIndex: '9999',
        display: 'flex',
        boxShadow: '',
        backgroundColor: '',
      });

      if (w <= 768) {
        // Móvil: barra inferior centrada y fluida
        Object.assign(accessibilityContainer.style, {
          top: 'auto',
          bottom: (window.visualViewport ? `calc(${window.visualViewport.height ? 'env(safe-area-inset-bottom, 0)' : '0'} + 12px)` : '12px'),
          left: '0',
          right: '0',
          transform: 'none',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
        });
      } else {
        // Tablet y escritorio: acoplada al lado derecho, vertical
        const h = window.innerHeight || document.documentElement.clientHeight;
        const compact = h < 800; // iPad Pro landscape u otras alturas reducidas
        Object.assign(accessibilityContainer.style, {
          top: '50%',
          right: '8px',
          left: 'auto',
          bottom: 'auto',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          gap: compact ? '6px' : '8px',
          maxHeight: 'calc(100dvh - 24px)', // usar dvh para evitar recortes por UI de Safari
          overflowY: 'auto',
          padding: '8px',
        });
        // Momentum scrolling en iOS
        accessibilityContainer.style.webkitOverflowScrolling = 'touch';
      }
    };

    // Asegurar etiquetas accesibles de los botones (sin forzar estilos que colisionen con CSS)
    const buttons = accessibilityContainer.querySelectorAll('button');
    buttons.forEach(button => {
      button.setAttribute('aria-label', button.title || 'Botón de accesibilidad');
    });

    applyPosition();
    window.addEventListener('resize', applyPosition);
    window.addEventListener('orientationchange', applyPosition);
  };

  // Eliminar filtros de imágenes para asegurar la accesibilidad visual
  const removeImageFilters = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.style.filter = 'none';
      img.style.webkitFilter = 'none';
    });
  };

  // Inicializar las funciones
  initAccessibilityButtons();
  removeImageFilters();

  // Asegurar que los estilos se apliquen incluso si el DOM se modifica dinámicamente
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        initAccessibilityButtons();
        removeImageFilters();
      }
    });
  });

  // Observar cambios en el body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Estilos de accesibilidad aplicados correctamente');
});
