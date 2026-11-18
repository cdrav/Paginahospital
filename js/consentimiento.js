// js/consentimiento.js — Consentimiento para cookies de analítica (Ley 1581 de 2012).
// Se carga desde partials/header.html en todas las páginas.
//  - Si la persona aceptó: carga Google Analytics.
//  - Si rechazó: no lo carga.
//  - Si aún no decide: muestra el aviso con "Rechazar" y "Aceptar" (mismo peso).
// Cualquier elemento con data-preferencias-cookies (p. ej. el enlace del pie) vuelve a abrir el aviso.

(function () {
  'use strict';

  const GA_ID = 'G-78BE6ZZGWW';
  const COOKIE = 'hdsa_consentimiento';
  const DIAS = { aceptado: 365, rechazado: 180 };
  const POLITICA = '/documentos/politicas/POLITICA-DE-PROTECCION-DE-DATOS-PERSONALES-DE-HDSA-2025.pdf';

  const leer = () => {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  };

  const guardar = valor => {
    const expira = new Date(Date.now() + DIAS[valor] * 864e5).toUTCString();
    const seguro = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${COOKIE}=${valor};expires=${expira};path=/;SameSite=Lax${seguro}`;
  };

  const borrarCookie = (nombre, dominio) => {
    document.cookie = `${nombre}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/` + (dominio ? `;domain=${dominio}` : '');
  };

  let gaCargado = false;
  function cargarAnalytics() {
    window['ga-disable-' + GA_ID] = false;
    if (gaCargado) return;
    gaCargado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function detenerAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    // Borra las cookies que Analytics haya dejado (_ga, _ga_XXXX, _gid...)
    const partes = location.hostname.split('.');
    const dominios = [null];
    for (let i = 0; i < partes.length - 1; i++) dominios.push('.' + partes.slice(i).join('.'));
    document.cookie.split(';').map(c => c.split('=')[0].trim())
      .filter(n => /^_ga|^_gid$|^_gat/.test(n))
      .forEach(n => dominios.forEach(d => borrarCookie(n, d)));
  }

  let aviso = null;
  function crearAviso() {
    aviso = document.createElement('section');
    aviso.className = 'cookie-banner';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    aviso.innerHTML = `
      <div class="container">
        <div class="d-md-flex justify-content-between align-items-center gap-4">
          <div>
            <h2 class="cookie-title h5 mb-1">Uso de cookies</h2>
            <p class="cookie-text mb-0">
              Usamos cookies de analítica (Google Analytics) para saber cómo se usa el sitio y mejorarlo.
              Solo se activan si usted las acepta. Puede cambiar su decisión cuando quiera en
              «Preferencias de cookies», al final de la página. Más información en la
              <a href="${POLITICA}" target="_blank" rel="noopener">Política de protección de datos personales</a>.
            </p>
          </div>
          <div class="cookie-acciones mt-3 mt-md-0">
            <button type="button" class="btn btn-light" data-consentimiento="rechazado">Rechazar</button>
            <button type="button" class="btn btn-light" data-consentimiento="aceptado">Aceptar</button>
          </div>
        </div>
      </div>`;
    aviso.addEventListener('click', e => {
      const b = e.target.closest('[data-consentimiento]');
      if (b) decidir(b.dataset.consentimiento);
    });
    document.body.appendChild(aviso);
    // La barra de accesibilidad (en móvil, abajo) sube lo que mida el aviso: --alto-aviso-cookies en site.css
    const medir = () => document.documentElement.style.setProperty('--alto-aviso-cookies', aviso.offsetHeight + 'px');
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(aviso); else medir();
  }

  function mostrarAviso() {
    if (!aviso) crearAviso();
    document.body.classList.add('cookie-banner-visible');
    void aviso.offsetWidth; // para que la transición se vea
    aviso.classList.add('show');
  }

  function ocultarAviso() {
    if (!aviso) return;
    aviso.classList.remove('show');
    setTimeout(() => document.body.classList.remove('cookie-banner-visible'), 400);
  }

  function decidir(valor) {
    guardar(valor);
    if (valor === 'aceptado') cargarAnalytics(); else detenerAnalytics();
    ocultarAviso();
    if (typeof window.notify === 'function') {
      window.notify(valor === 'aceptado' ? 'Cookies de analítica aceptadas.' : 'Cookies de analítica rechazadas.',
        { type: 'info', timeout: 3000, key: 'consentimiento' });
    }
  }

  // Enlace "Preferencias de cookies" (está en el pie, que puede cargarse después)
  document.addEventListener('click', e => {
    if (e.target.closest('[data-preferencias-cookies]')) { e.preventDefault(); mostrarAviso(); }
  });

  // Aviso anterior (solo informaba, no pedía permiso): ya no vale como consentimiento
  borrarCookie('hospital_cookie_consent');

  const decision = leer();
  if (decision === 'aceptado') cargarAnalytics();

  function iniciar() {
    if (decision !== 'aceptado' && decision !== 'rechazado') mostrarAviso();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
