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
      // No rechazar la promesa, solo registrar el error
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const headerPromise = loadPartial("#header-placeholder", "partials/header.html");
    const footerPromise = loadPartial("#footer-placeholder", "partials/footer.html");

    // Esperar a que tanto el header como el footer se carguen
    await Promise.all([headerPromise, footerPromise]);

    // Despachar un evento personalizado para notificar a otros scripts que el layout está listo
    console.log('Parciales cargados, despachando evento.');
    document.dispatchEvent(new CustomEvent('partialsLoaded'));
  });
})();
