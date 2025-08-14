// Inicialización de Google Translate (robusta con header dinámico)
function googleTranslateElementInit() {
    function mountTranslate() {
        const el = document.getElementById('google_translate_element');
        if (!el) return false;
        if (!(window.google && google.translate && google.translate.TranslateElement)) return false;
        // Evitar inicialización múltiple
        if (el.getAttribute('data-gt-initialized') === '1') return true;
        new google.translate.TranslateElement({
            pageLanguage: 'es',
            includedLanguages: 'en',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
        el.setAttribute('data-gt-initialized', '1');
        return true;
    }

    // Botón "Traducir": fuerza cambio a Inglés usando el combo de Google
    const translateBtn = document.getElementById('translate-now');
    if (translateBtn) {
        translateBtn.addEventListener('click', () => {
            const lang = translateBtn.getAttribute('data-lang') || 'en';
            // Buscar el select del widget
            const combo = document.querySelector('#google_translate_element select.goog-te-combo');
            if (combo) {
                combo.value = lang;
                combo.dispatchEvent(new Event('change'));
            } else {
                // Si aún no está montado, intentar montar y reintentar brevemente
                if (typeof googleTranslateElementInit === 'function') googleTranslateElementInit();
                setTimeout(() => {
                    const cb2 = document.querySelector('#google_translate_element select.goog-te-combo');
                    if (cb2) { cb2.value = lang; cb2.dispatchEvent(new Event('change')); }
                }, 400);
            }
        });
    }
    // Intento inmediato
    if (mountTranslate()) return;

    // Observar cambios en el DOM por si el header llega luego
    const observer = new MutationObserver(() => {
        if (mountTranslate()) observer.disconnect();
    });
    try {
        observer.observe(document.documentElement, { childList: true, subtree: true });
        // Seguridad: detener tras 8s
        setTimeout(() => observer.disconnect(), 8000);
    } catch (_) {
        // Fallback simple
        const maxTries = 16; let tries = 0;
        const id = setInterval(() => {
            if (mountTranslate() || ++tries >= maxTries) clearInterval(id);
        }, 250);
    }
}

// Función para mostrar notificación de accesibilidad
function mostrarAviso(mensaje) {
    const aviso = document.getElementById('avisoAccesibilidad');
    if (aviso) {
        aviso.textContent = mensaje;
        aviso.classList.add('mostrar');
        setTimeout(() => {
            aviso.classList.remove('mostrar');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Evitar duplicar gestión de accesibilidad si ya está centralizada
    const ACCESS_MANAGED = Boolean(window.ACCESSIBILITY_MANAGED);

    const contrastToggleBtn = document.getElementById("cambiarContraste");
    if (!ACCESS_MANAGED) {
        if (localStorage.getItem('altoContraste') === 'true') {
            document.body.classList.add('alto-contraste');
        }
        if (contrastToggleBtn) {
            contrastToggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('alto-contraste');
                const isActive = document.body.classList.contains('alto-contraste');
                localStorage.setItem('altoContraste', isActive);
                mostrarAviso(isActive ? "Modo alto contraste activado" : "Modo alto contraste desactivado");
            });
        }
    }

    const increaseBtn = document.querySelector('[title="Aumentar texto"]');
    const normalBtn = document.querySelector('[title="Tamaño normal"]');
    const decreaseBtn = document.querySelector('[title="Reducir texto"]');

    // Solo modificar el tamaño de fuente si no está gestionado por accesibilidad central
    let fontSize = 100;
    if (!ACCESS_MANAGED) {
        if (localStorage.getItem('fontSize') && localStorage.getItem('fontSize') !== "100") {
            fontSize = parseInt(localStorage.getItem('fontSize'));
            document.body.style.fontSize = fontSize + '%';
        } else {
            document.body.style.fontSize = '100%';
            localStorage.setItem('fontSize', 100);
        }
    }

    // Aumentar texto
    if (increaseBtn && !ACCESS_MANAGED) {
        increaseBtn.addEventListener('click', () => {
            if (fontSize < 160) { 
                fontSize += 10;
                document.body.style.fontSize = fontSize + '%';
                localStorage.setItem('fontSize', fontSize);
                mostrarAviso("Tamaño de texto aumentado");
            } else {
                mostrarAviso("Tamaño máximo alcanzado");
            }
        });
    }

    // Restaurar tamaño normal
    if (normalBtn && !ACCESS_MANAGED) {
        normalBtn.addEventListener('click', () => {
            fontSize = 100; // Reset to 100%
            document.body.style.fontSize = '100%';
            localStorage.setItem('fontSize', fontSize);
            mostrarAviso("Tamaño de texto normal restaurado");
        });
    }

    // Reducir texto
    if (decreaseBtn && !ACCESS_MANAGED) {
        decreaseBtn.addEventListener('click', () => {
            if (fontSize > 80) { // Min font size 80%
                fontSize -= 10;
                document.body.style.fontSize = fontSize + '%';
                localStorage.setItem('fontSize', fontSize);
                mostrarAviso("Tamaño de texto reducido");
            } else {
                mostrarAviso("Tamaño mínimo alcanzado");
            }
        });
    }

    // -----------------------------
    // 4.2 Estados Financieros: construir desde manifest.json
    // -----------------------------
    (function buildFinancialsFromManifest() {
        const acc = document.getElementById('acci-financieros-anual');
        if (!acc) return; // Solo en la página de transparencia 4.2

        // Utilidades
        const catOrder = ['estados', 'resultados', 'comparativos', 'reciprocas', 'otros'];
        const catLabels = {
            estados: 'Balances y Estados Financieros',
            resultados: 'Resultados / Actividad Económica',
            comparativos: 'Comparativos',
            reciprocas: 'Recíprocas (CGN)',
            otros: 'Otros documentos'
        };

        function toArray(files) { return Array.isArray(files) ? files : (files ? [files] : []); }

        const yearChipsEl = document.getElementById('fin-year-chips');
        const searchEl = document.getElementById('fin-search');
        const expandAllBtn = document.getElementById('fin-expand-all');
        const collapseAllBtn = document.getElementById('fin-collapse-all');
        const chipButtons = Array.from(document.querySelectorAll('.fin-controls .chip'));
        let currentCategory = 'all';
        let selectedYear = '';
        const normCat = (c) => String(c || '').toLowerCase();

        // Normaliza texto: minúsculas y sin acentos (búsqueda amplia)
        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        fetch('documentos/financieros/manifest.json', { cache: 'no-cache' })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('No se pudo leer manifest.json')))
            .then(data => {
                // Esperamos un arreglo de {Year, Files}
                if (!Array.isArray(data)) return;
                // Limpiar contenedor y crear grid plano (sin acordeón)
                acc.innerHTML = '';
                const grid = document.createElement('div');
                grid.className = 'fin-grid';
                acc.appendChild(grid);

                // Construir chips de años
                if (yearChipsEl) yearChipsEl.innerHTML = '';

                const allFiles = [];
                data.forEach(entry => {
                    const year = entry.Year;
                    const files = toArray(entry.Files);
                    if (!year || !files.length) return;
                    files.forEach(f => {
                        const cat = (f.Category || 'otros').toLowerCase();
                        allFiles.push({ year, cat, file: f.File, label: f.Name || (f.File || '').split('/').pop() });
                    });

                    // Chip de año
                    if (yearChipsEl) {
                        const ybtn = document.createElement('button');
                        ybtn.className = 'chip';
                        ybtn.type = 'button';
                        ybtn.textContent = String(year);
                        ybtn.setAttribute('data-year', String(year));
                        ybtn.addEventListener('click', () => {
                            // Toggle de año seleccionado
                            const y = String(year);
                            if (selectedYear === y) {
                                selectedYear = '';
                                // Quitar activo visual
                                yearChipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                            } else {
                                selectedYear = y;
                                // Marcar activo visual
                                yearChipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                                ybtn.classList.add('active');
                            }
                            applyFilters();
                        });
                        yearChipsEl.appendChild(ybtn);
                    }
                });

                // Render inicial de todos los archivos en el grid
                allFiles.forEach(({ year, cat, file, label }) => {
                    const ext = (String(file).split('.').pop() || '').toLowerCase();
                    const extBadge = ext ? `<span class=\"file-ext-badge\">${ext}</span>` : '';
                    const yearBadge = `<span class=\"year-badge\">${year}</span>`;
                    const el = document.createElement('a');
                    el.className = 'btn btn-sm btn-outline-brand rounded-pill fin-file';
                    el.setAttribute('data-year', String(year));
                    el.setAttribute('data-cat', String(cat));
                    el.setAttribute('data-label', norm(label));
                    el.setAttribute('data-path', norm(file));
                    el.href = file;
                    el.target = '_blank';
                    el.rel = 'noopener';
                    el.innerHTML = `${extBadge}${yearBadge}<span class=\"fin-label\">${label}</span>`;
                    grid.appendChild(el);
                });

                // Filtros y controles sobre grid plano
                function applyFilters(forceYear) {
                    const raw = (searchEl?.value || '').trim();
                    const q = norm(raw);
                    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
                    const cat = normCat(currentCategory);
                    const yearFilter = forceYear ? String(forceYear) : selectedYear;
                    const files = grid.querySelectorAll('.fin-file');
                    let visibles = 0;
                    const isBalanceHay = (hay) => hay.includes('balance') || (hay.includes('situacion') && hay.includes('financiera')) || hay.includes('balance-general');
                    files.forEach(a => {
                        const label = a.getAttribute('data-label') || '';
                        const year = a.getAttribute('data-year') || '';
                        const aCat = normCat(a.getAttribute('data-cat') || '');
                        const path = a.getAttribute('data-path') || '';
                        const hay = `${label} ${year} ${aCat} ${path}`;
                        const matchText = tokens.length === 0 || tokens.every(t => hay.includes(t));
                        let matchCat = true;
                        if (cat === 'all') {
                            matchCat = true;
                        } else if (cat === 'balances') {
                            // Solo mostrar documentos de balances/estado de situación financiera
                            matchCat = isBalanceHay(hay);
                        } else {
                            matchCat = (aCat === cat);
                        }
                        const matchYear = !yearFilter || year === yearFilter;
                        const show = matchText && matchCat && matchYear;
                        a.style.display = show ? '' : 'none';
                        if (show) visibles++;
                    });
                    acc.classList.toggle('fin-empty', visibles === 0);
                }

                let tId = 0;
                if (searchEl) {
                    searchEl.addEventListener('input', () => {
                        clearTimeout(tId);
                        tId = setTimeout(applyFilters, 180);
                    });
                }
                chipButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        chipButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentCategory = btn.getAttribute('data-cat') || 'all';
                        applyFilters();
                    });
                });
                // Ocultar botones expand/contraer si no hay acordeón
                if (expandAllBtn) expandAllBtn.style.display = 'none';
                if (collapseAllBtn) collapseAllBtn.style.display = 'none';
                applyFilters();
            })
            .catch(() => { /* Silencioso: deja el HTML estático si falla */ });
    })();
});