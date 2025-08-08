/**
 * accessibility-styles.js
 * Script para aplicar estilos de accesibilidad y posicionamiento de elementos
 */

document.addEventListener('DOMContentLoaded', function() {
  // Asegurar que los botones de accesibilidad estén en la posición correcta
  const initAccessibilityButtons = () => {
    const accessibilityContainer = document.querySelector('.accessibility-buttons-container');
    if (accessibilityContainer) {
      // Aplicar estilos al contenedor de botones de accesibilidad
      Object.assign(accessibilityContainer.style, {
        position: 'fixed',
        top: '60%',
        right: '0',
        transform: 'translateY(-50%)',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px 0 0 4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      });

      // Asegurar que los botones sean accesibles
      const buttons = accessibilityContainer.querySelectorAll('button');
      buttons.forEach(button => {
        button.setAttribute('aria-label', button.title || 'Botón de accesibilidad');
        button.style.padding = '8px';
        button.style.border = '1px solid #ddd';
        button.style.borderRadius = '4px';
        button.style.background = 'white';
        button.style.cursor = 'pointer';
      });
    }
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
