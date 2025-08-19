// utils.js - Notificaciones unificadas para todo el sitio
(function () {
  'use strict';

  const DEFAULT_TIMEOUT = 3000;

  function ensureContainer() {
    let c = document.getElementById('notification-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'notification-container';
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-atomic', 'true');
      c.style.position = 'fixed';
      c.style.top = '1rem';
      c.style.right = '1rem';
      c.style.zIndex = '1080'; // por encima del header
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.style.gap = '.5rem';
      document.body.appendChild(c);
    }
    return c;
  }

  function classFor(type) {
    switch (type) {
      case 'success': return 'alert alert-success';
      case 'warning': return 'alert alert-warning';
      case 'danger':
      case 'error': return 'alert alert-danger';
      case 'info':
      default: return 'alert alert-info';
    }
  }

  // notify(message, { type, timeout, target })
  function notify(message, opts) {
    const options = Object.assign({ type: 'info', timeout: DEFAULT_TIMEOUT, target: null }, opts);

    // Si hay un target (selector o elemento), usamos un alert en ese contenedor (ej. #form-message)
    if (options.target) {
      const el = typeof options.target === 'string' ? document.querySelector(options.target) : options.target;
      if (el) {
        el.className = classFor(options.type) + ' mt-3';
        el.textContent = message;
        el.classList.remove('d-none');
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
        return el;
      }
    }

    // Si no hay target, creamos un alert flotante en el contenedor global
    const container = ensureContainer();
    const alert = document.createElement('div');
    alert.className = classFor(options.type) + ' shadow-sm';
    alert.role = 'alert';
    alert.style.minWidth = '260px';
    alert.style.maxWidth = '380px';
    alert.style.margin = 0;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.style.float = 'right';
    closeBtn.addEventListener('click', () => alert.remove());

    const content = document.createElement('div');
    content.textContent = message;

    alert.appendChild(closeBtn);
    alert.appendChild(content);
    container.appendChild(alert);

    if (options.timeout > 0) {
      setTimeout(() => {
        try { alert.remove(); } catch (_) {}
      }, options.timeout);
    }
    return alert;
  }

  // Alias para compatibilidad hacia atrás
  window.notify = notify;
  window.showNotification = notify;
})();
