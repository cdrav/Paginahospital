/**
 * navbar-enhanced.js
 * Mejoras para la barra de navegación del Hospital Departamental San Antonio
 * Incluye efectos de scroll, animaciones y mejoras de usabilidad
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const dropdowns = document.querySelectorAll('.dropdown');
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-form .form-control');
  const searchButton = document.querySelector('.search-form .btn');
  const actionButtons = document.querySelectorAll('.action-button');
  
  // Verificar si el menú móvil ya está activo
  const isMobileMenuActive = document.querySelector('.navbar-toggler') !== null;
  
  // Efecto de scroll en la barra de navegación
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  // Inicializar el efecto de scroll
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Ejecutar al cargar la página
  
  // Mejorar la accesibilidad de los enlaces
  navLinks.forEach(link => {
    // Añadir atributos ARIA
    if (link.hasAttribute('aria-current') && link.getAttribute('aria-current') === 'page') {
      link.setAttribute('aria-label', `${link.textContent.trim()}, página actual`);
    }
    
    // Efecto hover mejorado
    link.addEventListener('focus', () => {
      link.parentElement.classList.add('focus-visible');
    });
    
    link.addEventListener('blur', () => {
      link.parentElement.classList.remove('focus-visible');
    });
  });
  
  // Mejorar los menús desplegables
  if (!isMobileMenuActive) {
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      // Asegurar que los menús tengan los atributos ARIA necesarios
      if (toggle && menu) {
        toggle.setAttribute('aria-haspopup', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-labelledby', toggle.id || `dropdown-${Math.random().toString(36).substr(2, 9)}`);
        
        // Añadir eventos para teclado
        toggle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown(dropdown);
          } else if (e.key === 'Escape' && dropdown.classList.contains('show')) {
            closeAllDropdowns();
            toggle.focus();
          }
        });
      }
    });
    
    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        closeAllDropdowns();
      }
    });
  }
  
  // Funciones para manejar los dropdowns
  function toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    
    if (!isOpen) {
      dropdown.classList.add('show');
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
      }
    }
  }
  
  function closeAllDropdowns() {
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  // Mejorar la búsqueda
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (searchInput.value.trim() !== '') {
        // Aquí iría la lógica de búsqueda
        console.log('Búsqueda realizada:', searchInput.value.trim());
        // Mostrar animación de carga
        searchForm.classList.add('loading');
        setTimeout(() => {
          searchForm.classList.remove('loading');
        }, 1500);
      }
    });
    
    // Mejorar accesibilidad del botón de búsqueda
    if (searchButton) {
      searchButton.setAttribute('aria-label', 'Buscar');
    }
  }
  
  // Mejorar botones de acción
  actionButtons.forEach(button => {
    // Añadir etiquetas ARIA según el tipo de acción
    const icon = button.querySelector('i');
    if (icon) {
      const iconClass = Array.from(icon.classList).find(cls => cls.startsWith('fa-'));
      if (iconClass) {
        const action = iconClass.replace('fa-', '');
        button.setAttribute('aria-label', action.charAt(0).toUpperCase() + action.slice(1));
      }
    }
    
    // Efecto de retroalimentación táctil
    button.addEventListener('click', (e) => {
      button.classList.add('clicked');
      setTimeout(() => {
        button.classList.remove('clicked');
      }, 300);
    });
  });
  
  // Mejorar la accesibilidad del menú móvil
  if (isMobileMenuActive) {
    const mobileMenuToggler = document.querySelector('.navbar-toggler');
    if (mobileMenuToggler) {
      mobileMenuToggler.setAttribute('aria-label', 'Menú de navegación');
      mobileMenuToggler.setAttribute('aria-expanded', 'false');
      mobileMenuToggler.setAttribute('aria-controls', 'navbarNav');
    }
  }
  
  // Añadir clase al body para detectar si JavaScript está activo
  document.body.classList.add('js-enabled');
  
  console.log('Navbar mejorada cargada correctamente');
});

// Polyfill para :focus-visible
(function() {
  if (!("CSS" in window) || !CSS.supports || !CSS.supports("selector(:focus-visible)")) {
    document.body.classList.add('no-focus-visible');
  }
})();
