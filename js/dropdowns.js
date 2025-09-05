// dropdowns.js - Manejo de menús desplegables anidados
document.addEventListener('DOMContentLoaded', function() {
  // Función para cerrar todos los submenús excepto el especificado
  function closeOtherSubmenus(exceptElement = null) {
    document.querySelectorAll('.dropdown-submenu.show').forEach(function(menu) {
      if (!exceptElement || !menu.contains(exceptElement)) {
        menu.classList.remove('show');
      }
    });
  }

  // Manejar submenús en dispositivos táctiles
  const dropdownSubmenus = document.querySelectorAll('.dropdown-submenu > a');
  
  dropdownSubmenus.forEach(function(element) {
    element.addEventListener('click', function(e) {
      // Prevenir que el enlace siga el href si es que lo tiene
      if (this.getAttribute('href') === '#') {
        e.preventDefault();
      }
      
      // Cerrar otros submenús abiertos
      closeOtherSubmenus(this.parentNode);
      
      // Alternar la clase 'show' en el submenú actual
      const parent = this.parentNode;
      const isOpening = !parent.classList.contains('show');
      
      // Si estamos cerrando el menú, no hacer nada más
      if (!isOpening) {
        parent.classList.remove('show');
        return;
      }
      
      // Si estamos abriendo el menú
      parent.classList.add('show');
      
      // Configurar el cierre al tocar fuera del menú
      const closeMenus = function(e) {
        // Verificar si el clic fue fuera del menú actual
        if (!parent.contains(e.target)) {
          parent.classList.remove('show');
          document.removeEventListener('click', closeMenus);
        }
      };
      
      // Agregar el evento de cierre al documento con un pequeño retraso
      // para evitar que se active inmediatamente en dispositivos táctiles
      setTimeout(() => {
        document.addEventListener('click', closeMenus, { once: true });
      }, 100);
    });
  });
  
  // Manejar clics en los enlaces de los submenús
  document.querySelectorAll('.dropdown-submenu .dropdown-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
      // Permitir que el enlace se comporte normalmente
      // No detener la propagación para que el menú se cierre
    });
  });
  
  // Cerrar menús al hacer clic fuera de ellos
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-menu')) {
      closeOtherSubmenus();
    }
  });
  
  // Manejar el evento touchstart para mejorar la respuesta en dispositivos táctiles
  document.addEventListener('touchstart', function(e) {
    // Si se toca fuera de cualquier menú, cerrar todos los menús
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-toggle')) {
      closeOtherSubmenus();
    }
  }, { passive: true });
});
