// layout.js - Carga unificada de header y footer mediante contenedores por id
// Reemplaza el sistema antiguo basado en data-include/includes.js

(function () {
  "use strict";

  async function loadPartial(targetSelector, url) {
    const target = document.querySelector(targetSelector);
    if (!target) return Promise.resolve(); // Resuelve silenciosamente si el objetivo no existe
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
      const html = await res.text();
      target.innerHTML = html;
      
      // Opcional: re-ejecutar scripts embebidos en el parcial, si existieran
      const scripts = target.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const s = document.createElement("script");
        // Copiar atributos (src, type, etc.)
        for (const attr of oldScript.attributes) {
          s.setAttribute(attr.name, attr.value);
        }
        // Si es inline
        if (!oldScript.src) {
          s.textContent = oldScript.textContent;
        }
        oldScript.replaceWith(s);
      });
    } catch (err) {
      console.error(`[layout] Error cargando parcial ${url}:`, err);
      if (target) {
        target.innerHTML = `<div class="alert alert-warning m-2" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>No se pudo cargar esta sección. <a href="javascript:location.reload()">Recargar página</a></div>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Detección inteligente de la ruta base para evitar errores 404 en subdirectorios
    const getBasePath = () => {
      const path = window.location.pathname;
      if (path.includes('/Paginahospital/')) return '/Paginahospital/';
      return '/';
    };
    
    const basePath = getBasePath();
    const headerPromise = loadPartial("#header-placeholder", `${basePath}partials/header.html`);
    const footerPromise = loadPartial("#footer-placeholder", `${basePath}partials/footer.html`);

    // Esperar a que tanto el header como el footer se carguen
    await Promise.all([headerPromise, footerPromise]);

    // --- Inyección dinámica del botón Portal Institucional ---
    // Busca el ítem de menú "Normatividad" e inserta el Portal después
    try {
      const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
      let normatividadItem = null;

      for (const link of navLinks) {
        if (link.textContent && link.textContent.trim().includes('Normatividad')) {
          normatividadItem = link.closest('.nav-item');
          break;
        }
      }

      if (normatividadItem) {
        const portalItem = document.createElement('li');
        portalItem.className = 'nav-item';
        // Se usa color amarillo (#ffc107) para resaltar sobre el fondo verde
        portalItem.innerHTML = `<a class="nav-link" href="login-institucional.html" style="color: #ffc107 !important;"><i class="bi bi-person-lock me-1"></i> Portal Institucional</a>`;
        normatividadItem.after(portalItem);
      }
    } catch (e) {
      console.error("Error inyectando botón del portal:", e);
      // Non-critical UI element — log only, navigation remains functional
    }

    // Despachar un evento personalizado para notificar a otros scripts que el layout está listo
    console.log('Parciales cargados, despachando evento.');
    document.dispatchEvent(new CustomEvent('partialsLoaded'));
  });
})();
