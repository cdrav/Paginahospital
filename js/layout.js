// layout.js - Carga unificada de header y footer mediante contenedores por id
// Reemplaza el sistema antiguo basado en data-include/includes.js

(function () {
  "use strict";

  // Asegurar utilidades globales (utils.js) disponibles temprano
  (function ensureUtils() {
    try {
      if (window.notify) return;
      const existing = document.querySelector('script[src$="js/utils.js"]');
      if (existing) return; // Evitar duplicados si ya está cargado
      const s = document.createElement("script");
      s.src = "js/utils.js";
      // intención: cargar lo antes posible para otros scripts
      s.async = false;
      document.head.appendChild(s);
    } catch (e) {
      console.warn('[layout] No se pudo inyectar utils.js temprano', e);
    }
  })();

  async function loadPartial(targetSelector, url) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
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
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadPartial("#header-placeholder", "partials/header.html");
    loadPartial("#footer-placeholder", "partials/footer.html");
  });
})();
