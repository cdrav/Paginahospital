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
      c.className = 'notify-contenedor'; // estilos en css/site.css
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

  // notify(message, { type, timeout, target, key })
  // key: si ya hay una notificación visible con la misma clave, se actualiza su
  // texto y se reinicia su tiempo en lugar de apilar otra igual.
  function notify(message, opts) {
    const options = Object.assign({ type: 'info', timeout: DEFAULT_TIMEOUT, target: null, key: '' },
      typeof opts === 'object' && opts ? opts : {});

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
    const previa = options.key
      ? [...container.querySelectorAll('[data-notify-key]')].find(a => a.dataset.notifyKey === options.key)
      : null;
    if (previa) {
      previa.className = classFor(options.type) + ' shadow-sm notify-alerta';
      previa.querySelector('.notify-texto').innerHTML = message;
      clearTimeout(previa._notifyTimer);
      if (options.timeout > 0) previa._notifyTimer = setTimeout(() => previa.remove(), options.timeout);
      return previa;
    }

    const alert = document.createElement('div');
    alert.className = classFor(options.type) + ' shadow-sm notify-alerta';
    alert.role = 'alert';
    if (options.key) alert.dataset.notifyKey = options.key;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close float-end';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.addEventListener('click', () => alert.remove());

    const content = document.createElement('div');
    content.className = 'notify-texto';
    content.innerHTML = message; // Permitir HTML simple como <strong>

    alert.appendChild(closeBtn);
    alert.appendChild(content);
    container.appendChild(alert);

    if (options.timeout > 0) {
      alert._notifyTimer = setTimeout(() => {
        try { alert.remove(); } catch (_) {}
      }, options.timeout);
    }
    return alert;
  }

  window.notify = notify;

  // Utilidad para calcular el alto del header fijo/pegajoso
  function calcHeaderOffset() {
    let total = 0;
    const selectors = [
      'nav.navbar',
      '.fixed-top',
      'header[role="banner"]',
      'header.site-header',
      '#header',
      '#header-placeholder > *',
    ];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky') {
        const rect = el.getBoundingClientRect();
        if (rect.height > 0 && rect.top <= 1) total += rect.height;
      }
    });
    return total || 90; // fallback si no se detecta nada fijo
  }

  window.calcHeaderOffset = calcHeaderOffset;
})();
