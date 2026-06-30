// js/normatividad.js

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const form = document.querySelector('main form.search-form');
  const input = document.getElementById('buscarNormatividad');
  const liveStatus = document.getElementById('search-live-status');
  const noResultsMsg = document.getElementById('no-results-msg');
  const contentRoot = document.getElementById('normatividadTabsContent');
  const tabLinksContainer = document.getElementById('normatividadTabs');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!form || !input || !contentRoot || !tabLinksContainer) {
    return;
  }

  const allItems = Array.from(contentRoot.querySelectorAll('.list-group-item'));
  const allTabLinks = Array.from(tabLinksContainer.querySelectorAll('.nav-link'));
  const allTabPanes = Array.from(contentRoot.querySelectorAll('.tab-pane'));

  // --- Helpers: use shared utilities from SharedUtils ---
  const norm = SharedUtils.normalizeText;
  const show = SharedUtils.showElement;
  const hide = SharedUtils.hideElement;
  const clearHighlights = SharedUtils.clearHighlights;
  const highlightInElement = SharedUtils.highlightInElement;

  // --- Filtering Logic ---
  const resetFilters = () => {
    allItems.forEach(show);
    allTabLinks.forEach(link => show(link.parentElement)); // Show the <li> container
    show(contentRoot); // Asegurarse de que el contenido sea visible
    hide(noResultsMsg);
    if (liveStatus) liveStatus.textContent = '';
    clearHighlights(contentRoot);
    
    // Al limpiar, volver a la primera pestaña para una experiencia consistente
    const firstTabTrigger = allTabLinks[0];
    if (firstTabTrigger) {
      try {
        const tab = bootstrap.Tab.getInstance(firstTabTrigger) || new bootstrap.Tab(firstTabTrigger);
        tab.show();
      } catch (e) {
        // Silenciar error si Bootstrap no está listo, la UI seguirá funcionando.
      }
    }
  };

  const filterContent = (termRaw) => {
    const term = norm(termRaw.trim());

    if (!term) {
      resetFilters();
      return 0;
    }

    clearHighlights(contentRoot);
    show(contentRoot); // Mostrar contenido antes de filtrar
    hide(noResultsMsg);

    let totalMatches = 0;
    let firstMatchedTabLink = null;

    allTabPanes.forEach((pane) => {
      const itemsInPane = Array.from(pane.querySelectorAll('.list-group-item'));
      let matchesInPane = 0;

      itemsInPane.forEach(item => {
        if (norm(item.textContent).includes(term)) {
          show(item);
          highlightInElement(item, termRaw);
          matchesInPane++;
        } else {
          hide(item);
        }
      });

      const tabLink = tabLinksContainer.querySelector(`.nav-link[data-bs-target="#${pane.id}"]`);
      if (tabLink) {
        if (matchesInPane > 0) {
          show(tabLink.parentElement); // Show the <li>
          totalMatches += matchesInPane;
          if (!firstMatchedTabLink) {
            firstMatchedTabLink = tabLink;
          }
        } else {
          hide(tabLink.parentElement); // Hide the <li>
        }
      }
    });

    if (totalMatches === 0) {
      show(noResultsMsg);
      hide(contentRoot); // Ocultar el contenedor de pestañas si no hay resultados
      allTabLinks.forEach(link => show(link.parentElement)); // Pero mantener las pestañas visibles
      if (liveStatus) liveStatus.textContent = 'No se encontraron resultados.';
    } else {
      if (liveStatus) {
        liveStatus.textContent = `${totalMatches} resultado${totalMatches === 1 ? '' : 's'} encontrados.`;
      }
      // Activate the first tab that has matches
      if (firstMatchedTabLink) {
        try {
          const tab = bootstrap.Tab.getInstance(firstMatchedTabLink) || new bootstrap.Tab(firstMatchedTabLink);
          tab.show();
        } catch (e) {
          // Silenciar error si Bootstrap no está listo.
        }
      }
    }

    return totalMatches;
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
      ev.preventDefault();
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

  // Si el usuario hace clic en una pestaña, se asume que quiere cancelar la búsqueda.
  allTabLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (input.value.trim() !== '') {
        input.value = '';
        resetFilters();
        if (clearBtn) hide(clearBtn);
      }
    });
  });

  // Inicializar pestañas de Bootstrap
  var tabEls = [].slice.call(document.querySelectorAll('button[data-bs-toggle="tab"]'));
  tabEls.forEach(function(tabEl) {
    new bootstrap.Tab(tabEl);
  });
});
