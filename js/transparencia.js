// Transparencia page scripts: smooth scrolling, active link, and dynamic MVVE loader

// Utilidades compartidas: cálculo dinámico del alto del header fijo/pegajoso
function calcHeaderOffset() {
  let total = 0;
  const selectors = [
    'nav.navbar',
    '.fixed-top',
    'header[role="banner"]',
    'header.site-header',
    '#header',
    '#header-placeholder > *',
    '.enlaces-institucionales',
    '.institutional-links'
  ];
  document.querySelectorAll(selectors.join(',')).forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.top <= 1) total += rect.height;
    }
  });
  return total || 90; // fallback si no se detecta nada fijo
}

// Scroll suave con compensación y activación de enlaces del sidebar
(function () {
  const sidebar = document.querySelector('.sidebar-nav');

  function smoothScrollTo(el) {
    if (!el) return;
    // Scroll con compensación local sin depender de funciones fuera del ámbito
    const heading = el.querySelector?.('h2, h3');
    const targetEl = heading || el;
    const rect = targetEl.getBoundingClientRect();
    const headerOffset = calcHeaderOffset();
    const y = rect.top + window.pageYOffset - headerOffset - 4;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  // Clicks en el sidebar
  // Nota: el desplazamiento y la lógica de "una sección a la vez" se manejan
  // en el segundo bloque (captura true). Aquí no intervenimos para evitar dobles scrolls.
  sidebar?.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    // No prevenir ni hacer scroll aquí; solo permitir que el otro handler actúe.
  });

  // Resaltado activo según scroll
  const linkMap = new Map();
  document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach((a) => {
    const sel = a.getAttribute('href');
    if (!sel) return;
    const el = document.querySelector(sel);
    if (el) linkMap.set(el, a);
  });

  const activate = (a) => {
    document.querySelectorAll('.sidebar-nav a').forEach((x) => x.classList.remove('active'));
    a?.classList.add('active');
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const a = linkMap.get(entry.target);
          if (a) activate(a);
        }
      });
    },
    { root: null, rootMargin: '-40% 0px -50% 0px', threshold: 0.01 }
  );

  // Observar anclas visibles
  linkMap.forEach((_, el) => io.observe(el));

  // Integración con contenido dinámico (1.1)
  const mvveContainer = document.getElementById('mvve-container');
  const ensureMVVEObserved = () => {
    const mvve = document.getElementById('mision-vision-valores');
    if (mvve && !linkMap.has(mvve))
      {
        const a = document.querySelector('.sidebar-nav a[href="#mision-vision-valores"]');
        if (a) {
          linkMap.set(mvve, a);
          io.observe(mvve);
        }
      }
  };
  // Al cargar dinámico, tratar de observar
  const mo = new MutationObserver(() => ensureMVVEObserved());
  if (mvveContainer) mo.observe(mvveContainer, { childList: true, subtree: true });
  ensureMVVEObserved();
})();

// Modo "una sección a la vez" con toggle, autoexpand de acordeón, foco accesible y prev/sig dinámicos
(function () {
  const contentRoot = document.querySelector('section.col-lg-8.col-md-7');
  if (!contentRoot) return;

  const secInfoEntidad = contentRoot.querySelector('section[aria-labelledby="sec-info-entidad"]');
  const anchorSections = Array.from(contentRoot.querySelectorAll('section.anchor-target'));
  const mvveContainer = document.getElementById('mvve-container');

  const allSections = [mvveContainer, secInfoEntidad, ...anchorSections].filter(Boolean);

  const hide = (el) => el && el.classList.add('d-none');
  const show = (el) => el && el.classList.remove('d-none');

  let singleView = true; // modo por defecto

  // Scroll con compensación por header fijo
  function scrollToWithOffset(el) {
    if (!el) return;
    // Alinear el encabezado interno (h2/h3) justo bajo el header fijo
    const heading = el.querySelector?.('h2, h3');
    const targetEl = heading || el;
    const rect = targetEl.getBoundingClientRect();
    const headerOffset = calcHeaderOffset();
    const y = rect.top + window.pageYOffset - headerOffset - 4;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  // Utilidades para acordeón lateral
  const accordion = document.getElementById('transpAccordion');
  // Hacer el array dinámico para que sea robusto a cambios en el HTML.
  // Se buscan todos los elementos colapsables dentro del acordeón y se extraen sus IDs.
  const collapseIds = accordion
    ? Array.from(accordion.querySelectorAll('.accordion-collapse')).map(el => el.id)
    : [];
  function expandAccordionForSectionId(id) {
    if (!accordion || !id) return;
    // Determinar grupo
    let groupIndex = 1;
    if (/^seccion-(\d+)/.test(id)) {
      const n = parseInt(id.match(/^seccion-(\d+)/)[1], 10);
      if (n >= 2 && n <= 9) groupIndex = n;
    } else {
      groupIndex = 1; // 1.x
    }
    collapseIds.forEach((cid, idx) => {
      const el = document.getElementById(cid);
      if (!el) return;
      if (idx === groupIndex - 1) {
        el.classList.add('show');
      } else {
        el.classList.remove('show');
      }
    });
  }

  function setActiveLink(hash) {
    document.querySelectorAll('.sidebar-nav a').forEach((x) => {
      x.classList.remove('active');
      x.removeAttribute('aria-current');
    });
    const a = document.querySelector(`.sidebar-nav a[href="${hash}"]`);
    if (a) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'true');
    }
  }

  function focusSectionHeading(sectionEl) {
    if (!sectionEl) return;
    const heading = sectionEl.querySelector('h2, h3');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function showOnlyBySelector(sel) {
    const target = sel ? document.querySelector(sel) : null;
    // Si el hash apunta a un elemento interno (como un encabezado dentro de una sección),
    // resolver la sección contenedora para poder mostrarla en modo "una sección a la vez".
    const targetSection = target?.closest ? target.closest('section.anchor-target') : null;
    // Si el objetivo es el contenedor de MVVE pero aún no está cargado, esperar y reintentar
    if (sel === '#mision-vision-valores' && !target) {
      // Reintentar cuando muta el DOM (ya hay un MO para MVVE en otro bloque)
      setTimeout(() => showOnlyBySelector(sel), 150);
      return;
    }
    if (singleView) {
      allSections.forEach(hide);
      // Caso especial 1.1 (contenido dinámico): el ancla real es #mision-vision-valores dentro de mvveContainer
      const isMvve = sel === '#mision-vision-valores';
      if (isMvve && mvveContainer) {
        show(mvveContainer);
      } else if (target && allSections.includes(target)) {
        show(target);
      } else if (targetSection && allSections.includes(targetSection)) {
        show(targetSection);
      } else if (secInfoEntidad) {
        show(secInfoEntidad);
      }
    } else {
      // Ver todo: asegurar todas visibles
      allSections.forEach(show);
    }

    // Si el hash corresponde a un subapartado de Participa (#participa-6-x), abrir su panel del acordeón
    const participaMatch = /^#participa-6-(\d+)$/.exec(sel || '');
    if (participaMatch) {
      const num = participaMatch[1];
      const accordion = document.getElementById('participaAccordion');
      if (accordion) {
        const openAll = accordion.querySelectorAll('.accordion-collapse.show');
        openAll.forEach((el) => el.classList.remove('show'));
        const toOpen = document.getElementById(`collapse-6-${num}`);
        if (toOpen) {
          toOpen.classList.add('show');
          // Actualizar aria-expanded del botón correspondiente
          const btn = accordion.querySelector(`[data-bs-target="#collapse-6-${num}"]`);
          accordion.querySelectorAll('.accordion-button').forEach(b => b.classList.add('collapsed'));
          if (btn) {
            btn.classList.remove('collapsed');
            btn.setAttribute('aria-expanded', 'true');
          }
        }
      }
    }

    // Acordeón y activo
    const effectiveTarget = targetSection || target;
    const hash = sel || (effectiveTarget ? `#${effectiveTarget.id}` : '');
    if (effectiveTarget && effectiveTarget.id) expandAccordionForSectionId(effectiveTarget.id);
    if (hash) setActiveLink(hash);
    // Foco: si es 1.1, buscar heading dentro de mvveContainer; si no, sobre la sección
    if (sel === '#mision-vision-valores' && mvveContainer) {
      focusSectionHeading(mvveContainer);
    } else if (effectiveTarget) {
      focusSectionHeading(effectiveTarget);
    }
  }

  function initialApply() {
    const hash = location.hash;
    if (hash && document.querySelector(hash)) {
      showOnlyBySelector(hash);
    } else {
      showOnlyBySelector(secInfoEntidad ? '#'+(secInfoEntidad.id || secInfoEntidad.getAttribute('aria-labelledby')) : '');
      if (secInfoEntidad) show(secInfoEntidad);
    }
  }

  // Aplicar al cargar
  initialApply();

  // Clicks en el sidebar: mostrar solo la sección de destino
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.sidebar-nav a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (!hash) return;
    e.preventDefault();
    showOnlyBySelector(hash);
    const target = document.querySelector(hash);
    if (target) scrollToWithOffset(target);
    // Actualizar URL sin recargar
    history.replaceState(null, '', hash);
  }, true);

  // Navegación interna dentro del contenido (botones Anterior/Siguiente u otros enlaces hash)
  contentRoot.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (!hash) return;
    const target = document.querySelector(hash) || (hash === '#mision-vision-valores' ? mvveContainer : null);
    if (!target) return;
    e.preventDefault();
    showOnlyBySelector(hash);
    scrollToWithOffset(target);
    history.replaceState(null, '', hash);
  });

  // Responder a navegación del navegador (atrás/adelante) y otros cambios de hash
  window.addEventListener('hashchange', () => {
    const hash = location.hash;
    showOnlyBySelector(hash || (secInfoEntidad ? '#'+(secInfoEntidad.id || secInfoEntidad.getAttribute('aria-labelledby')) : ''));
  });

  // Integración con búsqueda: cuando el campo queda vacío, re-aplicar modo una sección
  const searchInput = document.querySelector('form.search-form input[name="q"]');
  const reapplySingleView = () => {
    if (!searchInput) return;
    if ((searchInput.value || '').trim() === '') {
      const hash = location.hash;
      showOnlyBySelector(hash || (secInfoEntidad ? '#'+(secInfoEntidad.id || secInfoEntidad.getAttribute('aria-labelledby')) : ''));
    }
  };
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // Reaplicar al limpiar
      if ((searchInput.value || '').trim() === '') {
        // Dar tiempo a que el buscador restaure visibilidad
        setTimeout(reapplySingleView, 0);
      }
    });
  }
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => setTimeout(reapplySingleView, 0));

  // Toggle Ver todo / Ver solo esta sección
  const toggleBtn = document.getElementById('view-mode-toggle');
  const updateToggleLabel = () => {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = singleView
      ? '<i class="bi bi-layout-text-sidebar-reverse me-1"></i>Ver todo'
      : '<i class="bi bi-square-half me-1"></i>Ver solo esta sección';
  };
  updateToggleLabel();
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      singleView = !singleView;
      updateToggleLabel();
      // Reaplicar vista actual
      const hash = location.hash;
      if (singleView) {
        showOnlyBySelector(hash || (secInfoEntidad ? '#'+(secInfoEntidad.id || secInfoEntidad.getAttribute('aria-labelledby')) : ''));
      } else {
        // Ver todo
        allSections.forEach(show);
      }
    });
  }

  // Botones Anterior / Siguiente dinámicos
  const sectionsInOrder = (() => {
    // Incluir 1.1 al inicio para navegación secuencial
    const arr = [];
    if (mvveContainer) arr.push(mvveContainer);
    return [...arr, ...anchorSections];
  })();
  sectionsInOrder.forEach((section, idx) => {
    const nav = document.createElement('div');
    nav.className = 'd-flex justify-content-between align-items-center gap-2 mt-3';
    const prev = document.createElement('a');
    const next = document.createElement('a');
    prev.className = 'btn btn-outline-brand btn-sm rounded-pill';
    next.className = 'btn btn-outline-brand btn-sm rounded-pill';
    if (idx > 0) {
      const prevTarget = sectionsInOrder[idx - 1];
      const prevId = prevTarget.id || 'mision-vision-valores';
      prev.href = `#${prevId}`;
      prev.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Anterior';
    } else {
      prev.classList.add('disabled');
      prev.setAttribute('aria-disabled', 'true');
      prev.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Anterior';
    }
    if (idx < sectionsInOrder.length - 1) {
      const nextTarget = sectionsInOrder[idx + 1];
      const nextId = nextTarget.id || 'mision-vision-valores';
      next.href = `#${nextId}`;
      next.innerHTML = 'Siguiente <i class="bi bi-arrow-right ms-1"></i>';
    } else {
      next.classList.add('disabled');
      next.setAttribute('aria-disabled', 'true');
      next.innerHTML = 'Siguiente <i class="bi bi-arrow-right ms-1"></i>';
    }
    nav.appendChild(prev);
    nav.appendChild(next);
    const cardBody = section.querySelector?.('.card-body');
    (cardBody || section).appendChild(nav);
  });

  // Si el contenido 1.1 se carga después, asegurar que el contenedor responda al hash #mision-vision-valores
  if (mvveContainer && !mvveContainer.id) {
    // No cambiamos el hash objetivo del ancla interna, pero permitimos enfocar el heading del contenedor
  }
})();

// Carga dinámica del parcial de Misión, Visión, Valores y Eslogan (1.1)
(function () {
  const container = document.getElementById('mvve-container');
  if (!container) return;

  let loaded = false;
  const src = container.getAttribute('data-src');

  const loadPartial = async () => {
    if (loaded) return;
    try {
      const res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) throw new Error('No se pudo cargar el contenido');
      const html = await res.text();
      container.innerHTML = html;
      loaded = true;
      // Si el hash apunta al ancla dentro del parcial, hacer scroll suave
      if (location.hash === '#mision-vision-valores') {
        const target = document.getElementById('mision-vision-valores');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (e) {
      container.innerHTML =
        '<div class="container"><div class="alert alert-warning">No fue posible cargar la información en este momento.</div></div>';
    }
  };

  // Cargar si la URL ya trae el hash
  if (location.hash === '#mision-vision-valores') {
    loadPartial();
  }

  // Delegación: si se hace clic en un enlace que apunta al hash, cargar y hacer scroll
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href="#mision-vision-valores"]');
    if (a) {
      ev.preventDefault();
      loadPartial().then(() => {
        const target = document.getElementById('mision-vision-valores');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  });

  // Si el usuario navega al hash después
  window.addEventListener('hashchange', () => {
    if (location.hash === '#mision-vision-valores') {
      loadPartial().then(() => {
        const target = document.getElementById('mision-vision-valores');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  });
})();

// Búsqueda en vivo dentro de la página de Transparencia
(function () {
  // Selector más específico para evitar conflicto con el buscador global del header.
  // Apunta solo al formulario de búsqueda que está dentro del <main> de la página de transparencia.
  const form = document.querySelector('main form.search-form');
  if (!form) return;

  const input = form.querySelector('input[name="q"]');
  const liveStatus = document.getElementById('search-live-status');
  const contentRoot = document.querySelector('section.col-lg-8.col-md-7');
  if (!input || !contentRoot) return;
  const clearBtn = document.getElementById('search-clear-btn');

  // Secciones: 1 (tarjetas), 2-9 (anchor-target con list-group)
  const secInfoEntidad = contentRoot.querySelector('section[aria-labelledby="sec-info-entidad"]');
  const anchorSections = Array.from(contentRoot.querySelectorAll('section.anchor-target'));

  // Helpers
  // Normaliza texto y elimina diacríticos (compatible ampliamente)
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Resalta coincidencias envolviendo el texto en <mark class="search-hit">
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Limpia resaltados devolviendo HTML a su texto plano en elementos objetivo
  const highlightTargets = [
    '.card-title',
    '.card-text',
    'li .text-muted',
    'li strong',
    '.anchor-target h2',
    '.anchor-target h3',
    '.anchor-target p'
  ];

  const clearHighlights = (root) => {
    highlightTargets.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => {
        if (!el) return;
        el.innerHTML = el.textContent;
      });
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
      if (!value) continue;
      if (norm(value).includes(norm(term))) texts.push(node);
    }
    const re = new RegExp(escapeRegExp(term), 'gi');
    texts.forEach((textNode) => {
      const span = document.createElement('span');
      span.innerHTML = textNode.nodeValue.replace(re, (m) => `<mark class="search-hit">${m}</mark>`);
      textNode.parentNode.replaceChild(span, textNode);
    });
  };

  const show = (el) => el.classList.remove('d-none');
  const hide = (el) => el.classList.add('d-none');

  const resetFilters = () => {
    // Tarjetas 1.x
    if (secInfoEntidad) {
      secInfoEntidad.querySelectorAll('.card').forEach(show);
      show(secInfoEntidad);
    }
    // Secciones 2-9
    anchorSections.forEach((section) => {
      section.querySelectorAll('.list-group-item').forEach(show);
      show(section);
    });
    if (liveStatus) liveStatus.textContent = '';
    clearHighlights(contentRoot);
  };

  const filterPage = (termRaw) => {
    const term = norm(termRaw.trim());
    if (!term) {
      resetFilters();
      return 0;
    }

    let totalMatches = 0;

    // Limpiar resaltados anteriores
    clearHighlights(contentRoot);

    // Filtrar tarjetas 1.x
    if (secInfoEntidad) {
      const cards = Array.from(secInfoEntidad.querySelectorAll('.card'));
      let sectionMatches = 0;
      cards.forEach((card) => {
        const text = norm(card.textContent);
        const match = text.includes(term);
        if (match) {
          show(card);
          sectionMatches++;
          totalMatches++;
          // Resaltar en título y texto de la tarjeta
          highlightInElement(card.querySelector('.card-title'), termRaw);
          highlightInElement(card.querySelector('.card-text'), termRaw);
        } else {
          hide(card);
        }
      });
      // Si ninguna tarjeta coincide, oculta la sección 1
      if (sectionMatches === 0) hide(secInfoEntidad); else show(secInfoEntidad);
    }

    // Filtrar secciones 2-9: considerar encabezado y sus ítems internos
    anchorSections.forEach((section) => {
      const items = Array.from(section.querySelectorAll('.list-group-item'));
      let visibleInSection = 0;
      // Encabezado de la sección
      const heading = section.querySelector('h2, h3');
      const headingText = heading ? norm(heading.textContent) : '';
      const headingMatch = headingText && headingText.includes(term);
      if (headingMatch) {
        visibleInSection++; // cuenta como al menos una coincidencia
        totalMatches++;
        highlightInElement(heading, termRaw);
      }
      if (items.length > 0) {
        items.forEach((li) => {
          // considerar href de enlaces internos
          const hrefs = Array.from(li.querySelectorAll('a')).map((a) => (a.getAttribute('href') || '').toLowerCase());
          const text = norm(li.textContent);
          const match = text.includes(term) || hrefs.some((h) => h.includes(term));
          if (match) {
            show(li);
            visibleInSection++;
            totalMatches++;
            // Resaltar en títulos/descr de cada item
            highlightInElement(li.querySelector('strong'), termRaw);
            highlightInElement(li.querySelector('.text-muted'), termRaw);
          } else {
            hide(li);
          }
        });
      } else {
        // Secciones sin list-group: evaluar párrafos/texto del cuerpo
        const candidates = Array.from(section.querySelectorAll('p, li, a, .card-body'));
        let sectionTextMatch = false;
        candidates.forEach((el) => {
          const text = norm(el.textContent);
          const hrefs = el.tagName === 'A' ? [(el.getAttribute('href') || '').toLowerCase()] : [];
          const match = text.includes(term) || hrefs.some((h) => h.includes(term));
          if (match) {
            sectionTextMatch = true;
            highlightInElement(el, termRaw);
          }
        });
        if (sectionTextMatch) {
          visibleInSection++;
          totalMatches++;
        }
      }
      // Ocultar sección si no hay ítems visibles
      if (visibleInSection === 0) hide(section); else show(section);
    });

    if (liveStatus) {
      liveStatus.textContent = totalMatches === 0
        ? 'No hay coincidencias en esta página.'
        : `${totalMatches} resultado${totalMatches === 1 ? '' : 's'} en esta página.`;
    }
    return totalMatches;
  };

  // Entrada en vivo
  // Debounce para mejorar rendimiento al escribir
  const debounce = (fn, ms) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
  };

  input.addEventListener('input', debounce(() => {
    filterPage(input.value);
  }, 150), true);

  // Submit: siempre en la misma página (búsqueda en vivo)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input.value || '').trim();
    const count = filterPage(q);
    const firstVisible = contentRoot.querySelector('.card:not(.d-none), .list-group-item:not(.d-none)');
    if (count > 0 && firstVisible) {
      firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (liveStatus && q) {
      liveStatus.textContent = 'No hay coincidencias en esta página.';
    }
  }, true);

  // Teclas: Enter evita submit (ya controlado arriba), Escape limpia
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const q = (input.value || '').trim();
      const count = filterPage(q);
      const firstVisible = contentRoot.querySelector('.card:not(.d-none), .list-group-item:not(.d-none)');
      if (count > 0 && firstVisible) {
        firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (ev.key === 'Escape') {
      input.value = '';
      resetFilters();
    }
  });

  // Botón limpiar
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      resetFilters();
      input.focus();
    });
  }
})();
