/**
 * Script para mejorar la funcionalidad del menú móvil
 * Incluye animaciones y manejo de eventos táctiles
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  const navbar = document.querySelector('.navbar');
  const body = document.body;
  let navbarBackdrop;
  
  // Verificar que los elementos necesarios existen
  if (!navbar || !navbarCollapse) {
    console.warn('No se encontraron los elementos necesarios para el menú móvil');
    return;
  }
  
  // Crear el fondo oscuro si no existe
  if (!document.querySelector('.navbar-backdrop')) {
    navbarBackdrop = document.createElement('div');
    navbarBackdrop.className = 'navbar-backdrop';
    
    // Insertar el backdrop solo si navbarCollapse existe
    if (navbarCollapse && navbarCollapse.parentNode) {
      navbar.insertBefore(navbarBackdrop, navbarCollapse.nextSibling);
    } else {
      navbar.appendChild(navbarBackdrop);
    }
  } else {
    navbarBackdrop = document.querySelector('.navbar-backdrop');
  }
  
  // Función para abrir el menú
  function openMenu() {
    body.classList.add('menu-open');
    navbarCollapse.classList.add('show');
    navbarBackdrop.classList.add('show');
    
    // Deshabilitar el scroll del body
    body.style.overflow = 'hidden';
    
    // Añadir evento para cerrar al hacer clic en el backdrop
    navbarBackdrop.addEventListener('click', closeMenu);
    
    // Añadir evento para cerrar con la tecla ESC
    document.addEventListener('keydown', handleEscapeKey);
  }
  
  // Función para cerrar el menú
  function closeMenu() {
    body.classList.remove('menu-open');
    navbarCollapse.classList.remove('show');
    navbarBackdrop.classList.remove('show');
    
    // Restaurar el scroll del body
    body.style.overflow = '';
    
    // Eliminar eventos
    navbarBackdrop.removeEventListener('click', closeMenu);
    document.removeEventListener('keydown', handleEscapeKey);
  }
  
  // Manejar la tecla ESC
  function handleEscapeKey(event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }
  
  // Inicializar el menú
  function initMobileMenu() {
    // Inicializar el menú desplegable
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
      // Evitar que el enlace se active al hacer clic
      toggle.addEventListener('click', function(e) {
        if (window.innerWidth < 992) { // Solo para móviles
          e.preventDefault();
          e.stopPropagation();
          
          const dropdownMenu = this.nextElementSibling;
          const isExpanded = this.getAttribute('aria-expanded') === 'true';
          
          // Cerrar otros menús abiertos
          if (!isExpanded) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
              if (menu !== dropdownMenu) {
                menu.classList.remove('show');
                menu.previousElementSibling.setAttribute('aria-expanded', 'false');
              }
            });
          }
          
          // Alternar el menú actual
          dropdownMenu.classList.toggle('show');
          this.setAttribute('aria-expanded', !isExpanded);
        }
      });
      
      // Cerrar menú al hacer clic fuera
      document.addEventListener('click', function(e) {
        if (window.innerWidth < 992 && !toggle.contains(e.target)) {
          const dropdownMenu = toggle.nextElementSibling;
          if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
    
    // Inicializar el toggler del menú principal
    if (navbarToggler) {
      navbarToggler.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          closeMenu();
        } else {
          openMenu();
        }
        
        this.setAttribute('aria-expanded', !isExpanded);
      });
    }
    
    // Cerrar menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link:not(.dropdown-toggle)');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth < 992) {
          closeMenu();
          navbarToggler.setAttribute('aria-expanded', 'false');
        }
      });
    });
    
    // Cerrar menú al cambiar el tamaño de la ventana
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth >= 992) {
          closeMenu();
          if (navbarToggler) {
            navbarToggler.setAttribute('aria-expanded', 'false');
          }
        }
      }, 250);
    });
  }
  
  // Inicializar el menú móvil
  initMobileMenu();
  
  // Mejorar la accesibilidad del menú
  document.querySelectorAll('.dropdown-menu a, .navbar-nav a').forEach(link => {
    link.addEventListener('keydown', function(e) {
      // Permitir navegación con teclado
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        if (window.innerWidth < 992 && this.classList.contains('dropdown-toggle')) {
          e.preventDefault();
          this.click();
        }
      }
    });
  });
});

// Añadir estilos dinámicos para el menú móvil
const mobileMenuStyles = document.createElement('style');
mobileMenuStyles.textContent = `
  /* Estilos para el menú móvil */
  body.menu-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
  
  /* Mejoras de accesibilidad para enfoque */
  .navbar-nav .nav-link:focus,
  .dropdown-item:focus {
    outline: 2px solid #069681;
    outline-offset: 2px;
  }
  
  /* Transiciones suaves para el menú */
  .navbar-collapse {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Mejoras para dispositivos táctiles */
  @media (hover: none) {
    .dropdown-item,
    .nav-link {
      padding: 0.75rem 1.25rem;
    }
  }
`;
document.head.appendChild(mobileMenuStyles);
