// Transparencia page scripts: smooth scrolling, active link, and dynamic MVVE loader

// Scroll suave con compensación y activación de enlaces del sidebar
(function () {
  const sidebar = document.querySelector('.sidebar-nav');
  const headerOffset = 110; // coherente con scroll-margin-top en CSS

  function smoothScrollTo(el) {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Clicks en el sidebar
  sidebar?.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (!hash) return;
    const target = document.querySelector(hash);

    // Para anclas normales
    e.preventDefault();
    if (target) smoothScrollTo(target);
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
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  // Si el usuario navega al hash después
  window.addEventListener('hashchange', () => {
    if (location.hash === '#mision-vision-valores') {
      loadPartial().then(() => {
        const target = document.getElementById('mision-vision-valores');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });
})();

// Búsqueda en vivo dentro de la página de Transparencia
(function () {
  const form = document.querySelector('form.search-form');
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
