/**
 * navbar.js - Lógica unificada y robusta para la barra de navegación.
 * Resuelve problemas de carga asíncrona (race condition) y mantiene
 * las funcionalidades de menú móvil, scroll y accesibilidad.
 *
 * @version 2.1
 * @date 2024-07-26
 */

/**
 * Espera a que un elemento que coincida con el selector aparezca en el DOM.
 * Esto es crucial para scripts que dependen de contenido cargado dinámicamente.
 *
 * @param {string} selector - El selector CSS del elemento a esperar.
 * @param {function} callback - La función a ejecutar una vez que el elemento se encuentre.
 */
function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
    return;
  }

  const observer = new MutationObserver((mutations, obs) => {
    const foundElement = document.querySelector(selector);
    if (foundElement) {
      obs.disconnect();
      callback(foundElement);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Contiene toda la lógica de inicialización del navbar.
 * Se ejecuta una vez que el elemento .navbar está disponible en el DOM.
 * @param {HTMLElement} navbar - El elemento <nav> principal.
 */
function initializeNavbarLogic(navbar) {
  const navbarToggler = navbar.querySelector('.navbar-toggler');
  const navbarCollapse = navbar.querySelector('.navbar-collapse');

  if (!navbarToggler || !navbarCollapse) {
    console.warn('No se encontraron el toggler o el contenedor colapsable del navbar.');
    return;
  }

  // --- Lógica de Scroll ---
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Estado inicial

  // --- Lógica del Menú Móvil con Backdrop ---
  function getBackdrop() {
    let backdrop = document.querySelector('.navbar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'navbar-backdrop';
      document.body.appendChild(backdrop);
      
      // Añadir estilos para el backdrop si no existen
      if (!document.getElementById('navbar-backdrop-styles')) {
        const mobileMenuStyles = document.createElement('style');
        mobileMenuStyles.id = 'navbar-backdrop-styles';
        mobileMenuStyles.textContent = `
          body.menu-open { overflow: hidden; position: fixed; width: 100%; }
          .navbar-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); z-index: 1040; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
          .navbar-backdrop.show { opacity: 1; visibility: visible; }
        `;
        document.head.appendChild(mobileMenuStyles);
      }
    }
    return backdrop;
  }

  const openMenu = () => {
    document.body.classList.add('menu-open');
    navbarCollapse.classList.add('show');
    getBackdrop().classList.add('show');
    navbarToggler.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleEscapeKey);
    getBackdrop().addEventListener('click', closeMenu);
  };

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    navbarCollapse.classList.remove('show');
    getBackdrop().classList.remove('show');
    navbarToggler.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleEscapeKey);
    getBackdrop().removeEventListener('click', closeMenu);
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  // Eventos del toggler
  navbarToggler.addEventListener('click', function(e) {
    e.stopPropagation();
    if (navbarCollapse.classList.contains('show')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Cerrar menú al hacer clic en un enlace o al cambiar tamaño de ventana
  navbar.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link:not(.dropdown-toggle), .dropdown-item')) {
      if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
        closeMenu();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992 && document.body.classList.contains('menu-open')) {
      closeMenu();
    }
  });

  // --- Lógica de Dropdowns (comportamiento híbrido) ---
  const dropdowns = navbar.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (!toggle) return;

    // Hover para escritorio
    dropdown.addEventListener('mouseenter', () => {
      if (window.innerWidth >= 992) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.nextElementSibling.classList.add('show');
      }
    });
    dropdown.addEventListener('mouseleave', () => {
      if (window.innerWidth >= 992) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.nextElementSibling.classList.remove('show');
      }
    });

    // Clic para móvil (Bootstrap lo maneja, pero podemos asegurar que otros se cierren)
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth < 992) {
        e.preventDefault();
        const menu = toggle.nextElementSibling;
        const isExpanded = menu.classList.contains('show');
        
        // Cerrar otros dropdowns abiertos
        document.querySelectorAll('.dropdown-menu.show').forEach(m => {
          if (m !== menu) {
            m.classList.remove('show');
          }
        });
        
        // Alternar el actual
        menu.classList.toggle('show');
      }
    });
  });

  // --- Lógica para resaltar el enlace activo ---
  const currentPageTitle = document.body.dataset.pageTitle || '';
  const navLinks = navbar.querySelectorAll('.nav-link, .dropdown-item');

  navLinks.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');

    if (currentPageTitle && link.textContent.trim() === currentPageTitle) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      const dropdownToggle = link.closest('.dropdown')?.querySelector('.dropdown-toggle');
      if (dropdownToggle) {
        dropdownToggle.classList.add('active');
      }
    }
  });

  console.log('Navbar inicializado correctamente.');
}

// --- PUNTO DE ENTRADA ---
// Esperar a que el elemento '.navbar' exista en el DOM antes de llamar a la lógica principal.
// Esto soluciona el error "Navbar no encontrado" causado por la carga asíncrona del header.
waitForElement('nav.navbar', initializeNavbarLogic);
