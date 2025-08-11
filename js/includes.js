// Simple partials loader: injects HTML into elements with [data-include]
(function () {
  function loadPartials() {
    const hosts = document.querySelectorAll('[data-include]');
    if (hosts.length === 0) {
      document.dispatchEvent(new CustomEvent('partials:loaded'));
      return;
    }
    let remaining = hosts.length;
    hosts.forEach(async (el) => {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const html = await res.text();
        el.innerHTML = html;
      } catch (err) {
        console.error('Error cargando parcial', url, err);
        el.innerHTML = '<!-- Error cargando parcial: ' + url + ' -->';
      } finally {
        remaining -= 1;
        if (remaining === 0) {
          document.dispatchEvent(new CustomEvent('partials:loaded'));
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPartials);
  } else {
    loadPartials();
  }
})();
