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
  const navContainer = document.querySelector('.navbar .navbar-nav');
  
  // Verificar si el menú móvil ya está activo
  const isMobileMenuActive = document.querySelector('.navbar-toggler') !== null;
  
  // Normalizar y ordenar elementos del menú según orden esperado
  function normalizeNavbar() {
    if (!navContainer) return;

    // Orden deseado (después de Inicio): Transparencia, Atención, Participa, Normatividad
    const desired = [
      { key: 'inicio', match: (a) => /\/index\.html$/i.test(a.getAttribute('href') || '') || a.textContent.trim().toLowerCase().startsWith('inicio'), build: () => null },
      { key: 'transparencia', match: (a) => (a.textContent || '').toLowerCase().includes('transparencia') || /Transparencia y acceso a la información Publica\.html$/i.test(a.getAttribute('href') || '') || /\/transparencia-acceso-informacion-publica\.html$/i.test(a.getAttribute('href') || ''), build: () => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          const a = document.createElement('a');
          a.className = 'nav-link';
          a.href = '/transparencia-acceso-informacion-publica.html';
          a.textContent = 'Transparencia y Acceso a la Información';
          li.appendChild(a); return li;
        }
      },
      { key: 'atencion', match: (a) => (a.textContent || '').toLowerCase().includes('atención') || (a.textContent || '').toLowerCase().includes('servicios a la ciudadanía'), build: () => null },
      { key: 'participa', match: (a) => (a.textContent || '').toLowerCase().includes('participa') || /\/(Participa|participa)\.html$/i.test(a.getAttribute('href') || ''), build: () => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          const a = document.createElement('a'); a.className = 'nav-link'; a.href = '/participa.html'; a.textContent = 'Participa'; li.appendChild(a); return li; }
      },
      { key: 'normatividad', match: (a) => (a.textContent || '').toLowerCase().includes('normatividad') || /\/(Normatividad|normatividad)\.html$/i.test(a.getAttribute('href') || ''), build: () => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          const a = document.createElement('a'); a.className = 'nav-link'; a.href = '/Normatividad.html'; a.textContent = 'Normatividad'; li.appendChild(a); return li; }
      }
    ];

    // Obtener items actuales
    const items = Array.from(navContainer.children);

    // Utilidad: obtener li por match de su <a>
    function findItemBy(matchFn) {
      return items.find(li => {
        const a = li.querySelector('a.nav-link, a.dropdown-toggle, a');
        return a ? matchFn(a) : false;
      });
    }

    // Asegurar que Transparencia NO sea dropdown: si existe dropdown con texto transparencia, reemplazar por link simple
    const transparenciaDropdown = items.find(li => li.classList.contains('dropdown') && /transparencia/i.test(li.textContent || ''));
    if (transparenciaDropdown) transparenciaDropdown.remove();

    // Construir nuevo orden
    const newOrder = [];
    desired.forEach((def, idx) => {
      if (def.key === 'inicio') {
        const liInicio = findItemBy(def.match);
        if (liInicio) newOrder.push(liInicio);
        return;
      }
      const existing = findItemBy(def.match);
      if (existing) {
        // Si era dropdown y es Transparencia, ignorado arriba. Para otros casos, conservar tal cual (p.ej., Atención)
        newOrder.push(existing);
      } else if (def.build) {
        newOrder.push(def.build());
      }
    });

    // Añadir cualquier otro item que exista y no esté en la lista (evita perder vínculos extra)
    items.forEach(li => { if (!newOrder.includes(li)) newOrder.push(li); });

    // Reemplazar contenido del UL
    const frag = document.createDocumentFragment();
    newOrder.forEach(li => { if (li) frag.appendChild(li); });
    navContainer.innerHTML = '';
    navContainer.appendChild(frag);
  }

  // Ejecutar normalización antes de inicializar dropdowns y listeners
  normalizeNavbar();

  // Efecto de scroll en la barra de navegación
  function handleScroll() {
    if (!navbar) return; // Salir si navbar no existe
    
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
    searchForm.addEventListener('submit', () => {
      if (searchInput && searchInput.value.trim() !== '') {
        // Añadir feedback visual sin interferir con la navegación/redirección
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
    const collapseEl = document.querySelector('.navbar-collapse');
    if (mobileMenuToggler) {
      mobileMenuToggler.setAttribute('aria-label', 'Menú de navegación');
      mobileMenuToggler.setAttribute('aria-expanded', 'false');
      if (collapseEl && collapseEl.id) {
        mobileMenuToggler.setAttribute('aria-controls', collapseEl.id);
      }
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
