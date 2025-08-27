// js/normatividad.js

(function () {
  'use strict';

  const form = document.querySelector('main form.search-form');
  if (!form) return;

  const input = document.getElementById('buscarNormatividad');
  const liveStatus = document.getElementById('search-live-status');
  const noResultsMsg = document.getElementById('no-results-msg');
  const contentRoot = document.getElementById('normatividadTabsContent');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!input || !contentRoot) return;

  // --- Helpers ---
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const show = (el) => el && el.classList.remove('d-none');
  const hide = (el) => el && el.classList.add('d-none');

  // --- Highlighting ---
  const clearHighlights = (root) => {
    root.querySelectorAll('mark.search-hit').forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize(); // Merges adjacent text nodes
    });
  };

  const highlightInElement = (el, rawTerm) => {
    if (!el || !rawTerm) return;
    const term = rawTerm.trim();
    if (!term) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    let node;
    while ((node = walker.nextNode())) {
      const value = node.nodeValue;
      if (value && norm(value).includes(norm(term))) {
        texts.push(node);
      }
    }
    const re = new RegExp(escapeRegExp(term), 'gi');
    texts.forEach((textNode) => {
      const span = document.createElement('span');
      span.innerHTML = textNode.nodeValue.replace(re, (m) => `<mark class="search-hit">${m}</mark>`);
      textNode.parentNode.replaceChild(span, textNode);
    });
  };

  // --- Filtering Logic ---
  const allItems = Array.from(contentRoot.querySelectorAll('.list-group-item'));

  const resetFilters = () => {
    allItems.forEach(show);
    hide(noResultsMsg);
    if (liveStatus) liveStatus.textContent = '';
    clearHighlights(contentRoot);
    // Al limpiar, volver a la primera pestaña para una experiencia consistente
    const firstTabTrigger = document.querySelector('#normatividadTabs .nav-link');
    if (firstTabTrigger) {
      const tab = bootstrap.Tab.getInstance(firstTabTrigger) || new bootstrap.Tab(firstTabTrigger);
      tab.show();
    }
  };

  const filterContent = (termRaw) => {
    const term = norm(termRaw.trim());

    if (!term) {
      resetFilters();
      return 0;
    }

    clearHighlights(contentRoot);
    hide(noResultsMsg);

    const matches = allItems.filter(item => norm(item.textContent).includes(term));

    // Ocultar TODOS los items primero. Esto limpia el estado anterior.
    allItems.forEach(hide);

    if (liveStatus) {
      liveStatus.textContent = matches.length === 0
        ? 'No se encontraron resultados.'
        : `${matches.length} resultado${matches.length === 1 ? '' : 's'} encontrados.`;
    }

    if (matches.length === 0) {
      show(noResultsMsg);
      return 0;
    }

    // Esta función se encarga de mostrar y resaltar solo los resultados.
    const displayMatches = () => {
      matches.forEach(item => {
        show(item);
        highlightInElement(item, termRaw);
      });
    };

    const firstMatchEl = matches[0];
    const targetTabPane = firstMatchEl.closest('.tab-pane');
    
    // Si la pestaña del resultado ya está activa, mostramos los resultados directamente.
    if (targetTabPane.classList.contains('active')) {
      displayMatches();
    } else {
      // Si no, esperamos a que la pestaña se muestre y LUEGO mostramos los resultados.
      const tabTrigger = document.querySelector(`.nav-tabs .nav-link[data-bs-target="#${targetTabPane.id}"]`);
      if (tabTrigger) {
        tabTrigger.addEventListener('shown.bs.tab', displayMatches, { once: true });
        const tab = bootstrap.Tab.getInstance(tabTrigger) || new bootstrap.Tab(tabTrigger);
        tab.show();
      }
    }

    return matches.length;
  };

  // --- Event Listeners ---
  if (clearBtn) {
    input.addEventListener('input', () => clearBtn.classList.toggle('d-none', !input.value));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    filterContent(input.value);
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      input.value = '';
      resetFilters();
      if (clearBtn) hide(clearBtn);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      resetFilters();
      hide(clearBtn);
      input.focus();
    });
  }
})();
