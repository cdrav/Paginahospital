// dropdowns.js - Manejo de menús desplegables anidados
document.addEventListener('DOMContentLoaded', function() {
  // Manejar submenús en dispositivos táctiles
  const dropdownSubmenus = document.querySelectorAll('.dropdown-submenu > a');
  
  dropdownSubmenus.forEach(function(element) {
    element.addEventListener('click', function(e) {
      // Prevenir que el enlace siga el href si es que lo tiene
      if (this.getAttribute('href') === '#') {
        e.preventDefault();
      }
      
      // Cerrar otros submenús abiertos
      const openMenus = document.querySelectorAll('.dropdown-submenu.show');
      openMenus.forEach(function(menu) {
        if (menu !== element.parentNode) {
          menu.classList.remove('show');
        }
      });
      
      // Alternar la clase 'show' en el submenú actual
      const parent = this.parentNode;
      parent.classList.toggle('show');
      
      // Cerrar el menú al hacer clic fuera de él
      const closeMenus = function(e) {
        if (!parent.contains(e.target)) {
          parent.classList.remove('show');
          document.removeEventListener('click', closeMenus);
        }
      };
      
      // Agregar el evento de cierre al documento
      setTimeout(function() {
        document.addEventListener('click', closeMenus);
      }, 10);
    });
  });
  
  // Cerrar menús al hacer clic fuera de ellos
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-menu')) {
      document.querySelectorAll('.dropdown-submenu.show').forEach(function(menu) {
        menu.classList.remove('show');
      });
    }
  });
});
