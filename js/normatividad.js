/* Normatividad: búsqueda en vivo, resaltado y filtro por año en pestañas Bootstrap */
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const idsTabs = ["leyes", "decretos", "circulares", "resoluciones", "edictos"];
  const input = $("#buscarNormatividad");
  const liveStatus = $("#search-live-status");
  const noResults = document.getElementById("no-results-msg");
  const tabsContainer = $("#normatividadTabsContent");

  if (!input || !tabsContainer) return;

  // Utilidades de resaltado
  function normalizeNoAccents(s) {
    return (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function clearHighlights(container) {
    $$("mark.__hl", container).forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent || ""), m);
      parent.normalize();
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightMatches(container, term) {
    if (!term) return;
    const needleRaw = term.trim();
    if (!needleRaw) return;
    const needle = normalizeNoAccents(needleRaw);
    if (!needle) return;
    const items = $$(".tab-pane.active .list-group-item", tabsContainer);

    function indicesOf(haystack, needle) {
      const out = [];
      if (!needle) return out;
      let i = 0;
      while (i <= haystack.length - needle.length) {
        const idx = haystack.indexOf(needle, i);
        if (idx === -1) break;
        out.push(idx);
        i = idx + needle.length;
      }
      return out;
    }

    items.forEach((a) => {
      const labelSpan = a.querySelector("span");
      if (!labelSpan) return;
      const original = labelSpan.textContent || "";
      clearHighlights(labelSpan);
      if (!original) return;
      const normalized = normalizeNoAccents(original);
      const idxs = indicesOf(normalized, needle);
      if (!idxs.length) return;
      // reconstruir con <mark> sin alterar los caracteres originales con tilde
      let result = "";
      let last = 0;
      idxs.forEach((startIdx) => {
        const endIdx = startIdx + needle.length;
        result += original.slice(last, startIdx);
        result += `<mark class="__hl">${original.slice(startIdx, endIdx)}</mark>`;
        last = endIdx;
      });
      result += original.slice(last);
      labelSpan.innerHTML = result;
    });
  }

  // Filtro general
  function updateLiveStatus(count) {
    if (!liveStatus) return;
    // Mensaje breve y claro, acorde a accesibilidad
    const pane = $(".tab-pane.active", tabsContainer);
    const paneLabel = pane?.getAttribute("id") || "";
    const map = {
      leyes: "Leyes / Ordenanzas / Acuerdos",
      decretos: "Decretos",
      circulares: "Circulares y Otros",
      resoluciones: "Resoluciones",
      edictos: "Edictos y Avisos",
    };
    const nombre = map[paneLabel] || "Resultados";
    const termShown = (input.value || "").trim();
    const suffix = termShown ? ` para "${termShown}"` : "";
    liveStatus.textContent = `${count} resultado${count === 1 ? '' : 's'} en ${nombre}${suffix}`;
  }

  function applyFilters() {
    const termRaw = (input.value || "").trim();
    const term = normalizeNoAccents(termRaw);

    const panes = $$(".tab-pane", tabsContainer);
    if (!panes.length) return;

    let totalVisible = 0;
    const countsByPane = new Map();

    // Filtrar y resaltar en todas las pestañas
    panes.forEach((pane) => {
      const items = $$(".list-group-item", pane);
      items.forEach((a) => clearHighlights(a));
      let count = 0;
      items.forEach((a) => {
        const text = normalizeNoAccents(a.textContent || "");
        const href = normalizeNoAccents(a.getAttribute("href") || "");
        const matchTerm = !term || text.includes(term) || href.includes(term);
        const visible = matchTerm;
        a.classList.toggle("d-none", !visible);
        if (visible) count++;
      });
      // Resaltar en esta pestaña con el término original
      highlightMatches(pane, termRaw);
      countsByPane.set(pane.id, count);
      totalVisible += count;
    });

    // Si la pestaña activa no tiene resultados pero otra sí, cambiar a la primera con resultados
    const activePane = $(".tab-pane.active", tabsContainer);
    const activeCount = activePane ? (countsByPane.get(activePane.id) || 0) : 0;
    if (termRaw.length > 0 && activeCount === 0 && totalVisible > 0) {
      const targetPane = panes.find((p) => (countsByPane.get(p.id) || 0) > 0);
      if (targetPane) {
        const tabBtn = document.querySelector(`[data-bs-target="#${targetPane.id}"]`);
        if (tabBtn) tabBtn.click();
      }
    }

    // Actualizar aria-live con el total
    if (liveStatus) {
      const termShown = termRaw;
      const suffix = termShown ? ` para "${termShown}"` : "";
      liveStatus.textContent = `${totalVisible} resultado${totalVisible === 1 ? '' : 's'}${suffix}`;
    }

    // Mostrar/ocultar mensaje de "Sin resultados"
    if (noResults) {
      const show = termRaw.length > 0 && totalVisible === 0;
      noResults.classList.toggle("d-none", !show);
      if (show) {
        noResults.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Sin resultados para "${termRaw}".`;
      }
    }
  }

  // Eliminado: repopulateYears (ya no se usa filtro por año)

  // Debounce para búsqueda
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  const debouncedApply = debounce(applyFilters, 120);

  // Eventos
  input.addEventListener("input", debouncedApply);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  });
  // También si se hace clic al botón al lado del input (si existiera)
  const btnBuscar = input.closest(".input-group")?.querySelector("button.btn");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  // Manejar Enter (submit del formulario)
  const form = input.closest("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  // Botón Limpiar: borra texto y aplica filtros
  const btnClear = document.getElementById("btnLimpiarNorma");
  if (btnClear) {
    btnClear.addEventListener("click", (e) => {
      e.preventDefault();
      input.value = "";
      applyFilters();
      input.focus();
    });
  }

  // Reaccionar al cambio de pestaña (Bootstrap 5)
  $$("button[data-bs-toggle='tab']").forEach((btn) => {
    btn.addEventListener("shown.bs.tab", () => {
      applyFilters();
    });
  });

  // Inicialización
  document.addEventListener("DOMContentLoaded", () => {
    // Reemplazar tamaño por tipo de archivo en badges
    function updateBadgesToFileType() {
      const labelByExt = {
        pdf: "PDF",
        doc: "DOC",
        docx: "DOCX",
        xls: "XLS",
        xlsx: "XLSX",
        ppt: "PPT",
        pptx: "PPTX",
        odt: "ODT",
        ods: "ODS",
        zip: "ZIP",
        rar: "RAR",
        txt: "TXT",
      };
      const iconByExt = {
        pdf: "bi-filetype-pdf",
        doc: "bi-filetype-doc",
        docx: "bi-filetype-docx",
        xls: "bi-filetype-xls",
        xlsx: "bi-filetype-xlsx",
        ppt: "bi-filetype-ppt",
        pptx: "bi-filetype-pptx",
        odt: "bi-file-earmark",
        ods: "bi-file-earmark",
        zip: "bi-filetype-zip",
        rar: "bi-file-earmark-zip",
        txt: "bi-filetype-txt",
      };

      $$(".tab-pane .list-group-item").forEach((a) => {
        const href = (a.getAttribute("href") || "").toLowerCase();
        const ext = href.split("?")[0].split("#")[0].split(".").pop();
        const type = labelByExt[ext] || (ext ? ext.toUpperCase() : "ARCH");
        const icon = iconByExt[ext] || "bi-file-earmark";
        const badge = a.querySelector(".badge");
        if (badge) {
          // Tooltip nativo y accesibilidad
          badge.setAttribute("title", type);
          badge.setAttribute("aria-label", type);
          // Ícono visible
          badge.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span class="visually-hidden"> ${type}</span>`;
          // Clases de color por tipo
          badge.classList.remove("text-bg-light", "text-bg-secondary");
          // Eliminar cualquier clase previa badge-file-*
          Array.from(badge.classList).forEach((cn) => {
            if (cn.indexOf("badge-file-") === 0) badge.classList.remove(cn);
          });
          const typeClass = `badge-file-${ext || 'other'}`;
          badge.classList.add(typeClass);
        }
      });
    }

    updateBadgesToFileType();
    applyFilters();
  });
})();
