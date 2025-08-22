/**
 * navbar.js - Lógica unificada para la barra de navegación.
 * Combina funcionalidades de escritorio y móvil, efectos de scroll y accesibilidad.
 */

// Función para inicializar el navbar
function initNavbar() {
  // Intentar encontrar los elementos del navbar
  const navbar = document.querySelector('nav.navbar');
  const navbarToggler = document.querySelector('button.navbar-toggler[data-bs-toggle="collapse"]');
  let navbarCollapse = document.querySelector('div.navbar-collapse');
  const body = document.body;

  // Si no se encuentra el navbar, salir
  if (!navbar) {
    console.warn('Navbar no encontrado.');
    return false;
  }

  console.log('Navbar encontrado, inicializando...');

  // Si no se encuentra el colapsable, intentar encontrarlo por ID
  const navbarId = navbarToggler ? navbarToggler.getAttribute('data-bs-target') : null;
  if (navbarId && !navbarCollapse) {
    navbarCollapse = document.querySelector(navbarId);
    console.log('Navbar collapse encontrado por ID:', navbarCollapse ? 'Sí' : 'No');
  }
  
  if (!navbarCollapse && navbarId) {
    navbarCollapse = document.querySelector(navbarId);
  }

  if (!navbarCollapse) {
    console.warn('Elemento colapsable del navbar no encontrado.');
    return;
  }

  // --- Funcionalidad General ---

  // Efecto de Scroll
  function handleScroll() {
    if (!navbar) return;
    
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --- Menú Móvil ---
  function getBackdrop() {
    let backdrop = document.querySelector('.navbar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'navbar-backdrop';
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }
  
  // Inicializar eventos
  function initEvents() {
    // Evento de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Ejecutar una vez al cargar
    
    // Eventos del botón de menú móvil
    if (navbarToggler) {
      navbarToggler.addEventListener('click', function(e) {
        e.stopPropagation();
        if (navbarCollapse.classList.contains('show')) {
          closeMenu();
        } else {
          openMenu();
        }
      });
    }
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
      if (navbarCollapse && navbarCollapse.classList.contains('show') && 
          !navbarCollapse.contains(e.target) && !navbarToggler.contains(e.target)) {
        closeMenu();
      }
    });
  }
  
    // --- Menú Móvil ---
  let backdrop;
  
  const openMenu = () => {
    document.body.classList.add('menu-open');
    navbarCollapse.classList.add('show');
    getBackdrop().classList.add('show');
    if (navbarToggler) navbarToggler.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleEscapeKey);
    getBackdrop().addEventListener('click', closeMenu);
  };

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    navbarCollapse.classList.remove('show');
    getBackdrop().classList.remove('show');
    if (navbarToggler) navbarToggler.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleEscapeKey);
    getBackdrop().removeEventListener('click', closeMenu);
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  // Cerrar menú al hacer clic en un enlace o al cambiar tamaño de ventana
  navbar.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link:not(.dropdown-toggle), .dropdown-item')) {
      if (window.innerWidth < 992) closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992 && document.body.classList.contains('menu-open')) {
      closeMenu();
    }
  });

  // Inicializar todo
  initEvents();
  
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
  
  return true;
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbar);
} else {
  initNavbar();
}

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

