/**
 * navbar.js - Lógica unificada y robusta para la barra de navegación.
 * Resuelve problemas de carga asíncrona (race condition) y mantiene
 * las funcionalidades de menú móvil, scroll y accesibilidad.
 *
 * @version 3.0
 * @date 2024-07-27
 */
/**
 * Contiene toda la lógica de inicialización del navbar.
 * Se ejecuta una vez que el elemento .navbar está disponible en el DOM.
 */
function initializeNavbar() {
  const navbar = document.querySelector('nav.navbar');
  if (!navbar) {
      console.error('Navbar no encontrado. La inicialización del menú falló.');
      return;
  }

  const navbarToggler = navbar.querySelector('.navbar-toggler');
  const navbarCollapse = navbar.querySelector('.navbar-collapse');
  if (!navbarToggler || !navbarCollapse) {
      console.error('Contenedor del menú (.navbar-collapse) no encontrado.');
      return;
  }

  // Inicializar la instancia del componente Collapse de Bootstrap.
  // Esto es crucial para que los eventos como 'hidden.bs.collapse' funcionen.
  const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
      toggle: false // No abrir/cerrar al inicializar
  });

  // --- Lógica de Navegación en Menú Móvil ---
  // Esta es la solución definitiva para la redirección.
  navbarCollapse.addEventListener('click', function(event) {
      // Solo actuar si el menú está abierto
      if (!navbarCollapse.classList.contains('show')) {
          return;
      }

      const link = event.target.closest('a.nav-link, a.dropdown-item');
      if (link && link.href) {
          // Prevenir la navegación inmediata para que el menú se cierre primero.
          event.preventDefault();
          const urlToNavigate = link.href;

          // Escuchar el evento que Bootstrap dispara CUANDO el menú TERMINA de cerrarse.
          navbarCollapse.addEventListener('hidden.bs.collapse', function onMenuHidden() {
              // Una vez que el menú está completamente cerrado y la "sombra" ha desaparecido,
              // navegamos a la página deseada.
              window.location.href = urlToNavigate;
          }, { once: true }); // { once: true } asegura que este listener se ejecute solo una vez.

          // Usar la API de Bootstrap para cerrar el menú.
          // Esto asegura que todas las animaciones y eventos se disparen correctamente.
          bsCollapse.hide();
      }
  });

  // --- Lógica de Scroll (efecto visual) ---
  const handleScroll = () => {
      if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
      } else {
          navbar.classList.remove('scrolled');
      }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

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

  console.log('Navbar inicializado correctamente con la lógica definitiva.');
}

// --- PUNTO DE ENTRADA ---
// Esperar al evento personalizado que indica que el header y footer han sido cargados.
document.addEventListener('partialsLoaded', initializeNavbar);
