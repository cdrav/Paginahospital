/**
 * navbar.js - Lógica unificada para la barra de navegación.
 * Combina funcionalidades de escritorio y móvil, efectos de scroll y accesibilidad.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Intentar encontrar los elementos del navbar
  const navbar = document.querySelector('nav.navbar');
  const navbarToggler = document.querySelector('button.navbar-toggler');
  let navbarCollapse = document.querySelector('div.navbar-collapse');
  const body = document.body;

  // Si no se encuentra el navbar, salir
  if (!navbar) {
    console.warn('Navbar no encontrado.');
    return;
  }

  // Si no se encuentra el colapsable, intentar encontrarlo por ID
  const navbarId = navbarToggler ? navbarToggler.getAttribute('data-bs-target') : null;
  const collapseElement = navbarId ? document.querySelector(navbarId) : null;
  
  if (!navbarCollapse && collapseElement) {
    navbarCollapse = collapseElement;
  }

  if (!navbarCollapse) {
    console.warn('Elemento colapsable del navbar no encontrado.');
    return;
  }

  // --- Funcionalidad General ---

  // Efecto de scroll
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --- Menú Móvil ---

  let backdrop;
  const getBackdrop = () => {
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'navbar-backdrop';
      navbar.insertBefore(backdrop, navbarCollapse.nextSibling);
    }
    return backdrop;
  };

  const openMenu = () => {
    body.classList.add('menu-open');
    navbarCollapse.classList.add('show');
    getBackdrop().classList.add('show');
    navbarToggler?.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleEscapeKey);
    getBackdrop().addEventListener('click', closeMenu);
  };

  const closeMenu = () => {
    body.classList.remove('menu-open');
    navbarCollapse.classList.remove('show');
    getBackdrop().classList.remove('show');
    navbarToggler?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleEscapeKey);
    getBackdrop().removeEventListener('click', closeMenu);
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  if (navbarToggler) {
    navbarToggler.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navbarCollapse.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  // Cerrar menú al hacer clic en un enlace o al cambiar tamaño de ventana
  navbar.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link:not(.dropdown-toggle), .dropdown-item')) {
      if (window.innerWidth < 992) closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992 && body.classList.contains('menu-open')) {
      closeMenu();
    }
  });

  // --- Dropdowns (comportamiento híbrido) ---

  const dropdowns = navbar.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');

    // Hover para escritorio
    if (window.innerWidth >= 992) {
      dropdown.addEventListener('mouseenter', () => toggle.setAttribute('aria-expanded', 'true'));
      dropdown.addEventListener('mouseleave', () => toggle.setAttribute('aria-expanded', 'false'));
    }

    // Clic para móvil
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth < 992) {
        e.preventDefault();
        const menu = toggle.nextElementSibling;
        const isExpanded = menu.classList.contains('show');
        // Cerrar otros dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        // Abrir el actual si estaba cerrado
        if (!isExpanded) menu.classList.add('show');
      }
    });
  });

  // --- Mejoras de Accesibilidad y UI ---

  // Foco visible
  try {
    if (!("CSS" in window) || !CSS.supports || !CSS.supports("selector(:focus-visible)")) {
      document.body.classList.add('no-focus-visible');
    }
  } catch(e) { console.warn('focus-visible polyfill check failed.'); }

  // Búsqueda
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', () => {
      const searchInput = searchForm.querySelector('input[name="q"]');
      if (searchInput && searchInput.value.trim() !== '') {
        searchForm.classList.add('loading');
        setTimeout(() => searchForm.classList.remove('loading'), 1500);
      }
    });
  }

  // Añadir clase para detectar JS activo
  document.body.classList.add('js-enabled');
  console.log('Navbar unificada cargada.');
});

// Estilos CSS para el backdrop del menú móvil
const mobileMenuStyles = document.createElement('style');
mobileMenuStyles.textContent = `
  body.menu-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
  }
  .navbar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040; /* Debajo del navbar-collapse (1045 por defecto) */
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  .navbar-backdrop.show {
    opacity: 1;
    visibility: visible;
  }
`;
document.head.appendChild(mobileMenuStyles);

