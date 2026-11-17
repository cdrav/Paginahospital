// Configuración de la búsqueda
const searchConfig = {
    lunrIndex: null,
    dataStore: {}, // Para mapear URL a datos completos de la página
    isInitialized: false,
    MAX_RESULTS: 20,
    categories: {
        transparencia: { label: 'Transparencia', icon: 'bi-shield-check' },
        servicios: { label: 'Servicios de Salud', icon: 'bi-heart-pulse' },
        normatividad: { label: 'Normatividad', icon: 'bi-journal-text' },
        participacion: { label: 'Participación', icon: 'bi-people' },
        pqrs: { label: 'PQRSD', icon: 'bi-chat-square-text' },
        noticias: { label: 'Noticias', icon: 'bi-newspaper' },
        institucional: { label: 'Institucional', icon: 'bi-building' },
        general: { label: 'General', icon: 'bi-info-circle' }
    },
    initializationPromise: null,
    
    // Inicialización (el índice lo carga el manejador de 'partialsLoaded' en buscar.html)
    init: function() {
        this.setupSearchForm();
    },

    // --- Utilidades de texto ---
    // Quita tildes y pasa a minúsculas conservando la longitud del texto
    normalizar: function(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    },
    escaparHtml: function(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    // Palabras útiles de la consulta: sin tildes, sin símbolos de la sintaxis de lunr y sin palabras vacías ("de", "la"...)
    palabrasDeConsulta: function(term) {
        const filtro = (window.lunr && lunr.es && lunr.es.stopWordFilter) ? lunr.es.stopWordFilter : (p => p);
        return this.normalizar(term)
            .replace(/[^a-z0-9ñ]+/g, ' ')
            .split(' ')
            .filter(p => p.length >= 2 && filtro(p)); // las letras sueltas no aportan
    },
    // Expresión que encuentra cualquiera de las palabras con o sin tildes
    regexResaltado: function(palabras) {
        const variantes = { a: 'aáàäâ', e: 'eéèëê', i: 'iíìïî', o: 'oóòöô', u: 'uúùüû', n: 'nñ', c: 'cç' };
        const partes = palabras.filter(p => p.length >= 2)
            .sort((a, b) => b.length - a.length)
            .map(p => [...p].map(ch => variantes[ch] ? `[${variantes[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(''));
        return partes.length ? new RegExp(`(${partes.join('|')})`, 'gi') : null;
    },
    // Título sin el sufijo repetido " - Hospital Departamental San Antonio" / " | HDSA"
    tituloCorto: function(titulo) {
        const t = String(titulo || '').replace(/\s*[-|–]\s*(Hospital Departamental San Antonio.*|HDSA)\s*$/i, '').trim();
        return t || titulo || 'Sin título';
    },
    
    // Inicializar la búsqueda
    initializeSearch: function() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                await this.loadSearchData();
                this.isInitialized = true;
                resolve();
            } catch (error) {
                console.error('Error al inicializar la búsqueda:', error);
                this.showError('No se pudo cargar la funcionalidad de búsqueda. Por favor, intente recargar la página.');
                reject(error);
            }
        });
        
        return this.initializationPromise;
    },
    
    // Configura el formulario de búsqueda
    setupSearchForm: function() {
        // Selecciona solo los formularios de búsqueda del header/navbar para la búsqueda global.
        // Esto evita conflictos con el buscador en vivo de la página de Transparencia.
        const searchForms = document.querySelectorAll('nav form.search-form, nav form[action$="buscar.html"]');
        
        searchForms.forEach(searchForm => {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Siempre prevenir el submit por defecto
                
                const input = searchForm.querySelector('input[name="q"]');
                const searchTerm = input ? input.value.trim() : '';
                
                if (!searchTerm) { return; } // No hacer nada si está vacío

                // Si estamos en la página de búsqueda, realizamos la búsqueda aquí mismo.
                // Si no, redirigimos a la página de búsqueda.
                if (window.location.pathname.endsWith('/buscar.html')) {
                    const url = new URL(window.location);
                    url.searchParams.set('q', searchTerm);
                    window.history.pushState({}, '', url); // Actualizar URL sin recargar
                    this.sincronizarCampos(searchTerm);
                    this.performSearch(searchTerm);
                } else {
                    // Ruta absoluta: desde páginas en subcarpetas (p. ej. /participa/) también debe ir a /buscar.html
                    window.location.href = `/buscar.html?q=${encodeURIComponent(searchTerm)}`;
                }
            });
        });
    },

    // Pone el término en los campos de búsqueda del header (escritorio y móvil)
    sincronizarCampos: function(term) {
        document.querySelectorAll('nav form[action$="buscar.html"] input[name="q"]').forEach(i => { i.value = term; });
    },

    // Carga el índice de búsqueda y lo prepara para ser usado por Lunr.js
    loadSearchData: async function() {
        if (this.lunrIndex) return true; // ya cargado
        try {
            console.log('Cargando índice de búsqueda...');

            // Esperar a que estén disponibles las librerías de lunr
            await waitForGlobal('lunr', 5000);

            // Cargar el índice de búsqueda
            const response = await fetch('/search-index.json', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error de red: ${response.statusText}`);
            }
            
            const documents = await response.json();
            
            if (!Array.isArray(documents)) {
                throw new Error('El formato del índice de búsqueda no es válido');
            }
            
            console.log(`Se cargaron ${documents.length} documentos para búsqueda`);
            
            // Guardar los datos para mostrarlos en los resultados
            documents.forEach(doc => {
                if (doc && doc.url) {
                    this.dataStore[doc.url] = doc;
                }
            });

            // Configurar Lunr.js. Se indexa el texto sin tildes (y la consulta también se
            // normaliza), así "vacunacion" encuentra "vacunación".
            const normalizar = this.normalizar;
            const sinTildes = documents.filter(d => d && d.url).map(d => ({
                url: d.url, title: normalizar(d.title), content: normalizar(d.content)
            }));
            const usarEspanol = !!(window.lunr && window.lunr.es);
            if (!usarEspanol) console.warn('Usando configuración básica de lunr (sin soporte para español)');
            this.lunrIndex = lunr(function() {
                if (usarEspanol) this.use(lunr.es);
                this.ref('url');
                this.field('title', { boost: 10 });
                this.field('content');
                sinTildes.forEach(doc => this.add(doc));
            });
            this.isInitialized = true;
            console.log('Índice de búsqueda creado exitosamente');
            return true;
        } catch (error) {
            console.error('Error al cargar y construir el índice de búsqueda:', error);
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `<div class="alert alert-danger">Error al cargar la función de búsqueda. Por favor, intente más tarde.</div>`;
            }
            return false;
        }
    },

    // Categoriza una URL según la sección del sitio
    categorizeUrl: function(url) {
        url = (url || '').toLowerCase();
        if (url.includes('transparencia')) return 'transparencia';
        if (url.includes('urgencias') || url.includes('consulta-externa') || url.includes('laboratorio') ||
            url.includes('hospitalizacion') || url.includes('partos') || url.includes('cuidado-oral') ||
            url.includes('diagnostico') || url.includes('promocion-prevencion') || url.includes('consultorio') ||
            url.includes('citas') || url.includes('historia-clinica')) return 'servicios';
        if (url.includes('normatividad')) return 'normatividad';
        if (url.includes('participa')) return 'participacion';
        if (url.includes('pqrs')) return 'pqrs';
        if (url.includes('noticias')) return 'noticias';
        if (url.includes('portal-institucional') || url.includes('directorio-institucional') ||
            url.includes('estadisticas') || url.includes('asociaciones')) return 'institucional';
        return 'general';
    },

    // Muestra un mensaje de error en la interfaz
    showError: function(message) {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${message}
                </div>
            `;
        }
    },
    
    // Realiza la búsqueda
    performSearch: async function(term) {
        if (!this.isInitialized) {
            try {
                await this.initializeSearch();
            } catch (error) {
                console.error('Error al inicializar la búsqueda:', error);
                this.showError('No se pudo inicializar la búsqueda. Por favor, intente recargar la página.');
                return [];
            }
        }
        
        if (!this.lunrIndex) {
            console.error('El índice de búsqueda no está inicializado');
            this.showError('El índice de búsqueda no está disponible. Por favor, intente más tarde.');
            return [];
        }
        
        try {
            const results = this.buscarEnIndice(term);
            console.log(`Se encontraron ${results.length} resultados para: ${term}`);
            this.displaySearchResults(term, results);
            return results;
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
            this.showError('Ocurrió un error al realizar la búsqueda. Por favor, intente con otros términos, revise la ortografía o intente más tarde.');
            return [];
        }
    },
    
    // Busca en el índice: primero páginas que tengan TODAS las palabras; si no hay,
    // páginas con CUALQUIERA; y si tampoco, palabras incompletas como prefijo ("vacun" → vacunación).
    buscarEnIndice: function(term) {
        const palabras = this.palabrasDeConsulta(term);
        if (!palabras.length) return [];
        const P = lunr.Query.presence;
        const consultar = (armar) => { try { return this.lunrIndex.query(armar); } catch (e) { console.warn('Consulta no válida:', e); return []; } };
        let r = consultar(q => palabras.forEach(p => q.term(p, { presence: P.REQUIRED })));
        if (!r.length && palabras.length > 1) r = consultar(q => palabras.forEach(p => q.term(p)));
        if (!r.length) r = consultar(q => palabras.filter(p => p.length >= 3).forEach(p =>
            q.term(p, { wildcard: lunr.Query.wildcard.TRAILING, usePipeline: false })));
        return r;
    },

    // Obtiene un extracto del texto alrededor de la primera coincidencia (ya escapado y resaltado)
    getExcerpt: function(text, term) {
        if (!text) return 'No hay contenido disponible para mostrar.';
        const LARGO = 250;
        if (text.length <= LARGO) return this.highlightTerm(text, term);

        const re = this.regexResaltado(this.palabrasDeConsulta(term));
        const m = re ? re.exec(text) : null;
        if (!m) return this.highlightTerm(text.substring(0, LARGO) + '...', term);

        const start = Math.max(0, m.index - 80);
        const end = Math.min(text.length, m.index + m[0].length + 120);
        let excerpt = text.substring(start, end);
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        return this.highlightTerm(excerpt, term);
    },

    // Escapa el texto y resalta cada palabra buscada (sin importar tildes ni mayúsculas)
    highlightTerm: function(text, term) {
        const re = term ? this.regexResaltado(this.palabrasDeConsulta(term)) : null;
        if (!re || !text) return this.escaparHtml(text);
        let html = '', ultimo = 0, m;
        while ((m = re.exec(text)) !== null) {
            html += this.escaparHtml(text.slice(ultimo, m.index)) + `<mark class="bg-warning text-dark px-0">${this.escaparHtml(m[0])}</mark>`;
            ultimo = m.index + m[0].length;
        }
        return html + this.escaparHtml(text.slice(ultimo));
    },

    // Actualiza el mensaje de estado de la búsqueda
    updateResultsMessage: function(term, count, isLimited = false) {
        const resultsContainer = document.getElementById('search-results');
        const resultsCount = document.getElementById('results-count');
        const searchTermElement = document.getElementById('search-term');
        const noResultsElement = document.getElementById('no-results');

        if (!resultsContainer || !resultsCount || !searchTermElement || !noResultsElement) return;

        searchTermElement.textContent = `"${term}"`;
        let msg = count === 1 ? 'Se encontró 1 resultado.' : `Se encontraron ${count} resultados.`;
        if (isLimited) {
            msg += ` Mostrando los ${this.MAX_RESULTS} más relevantes.`;
        }
        resultsCount.textContent = msg;

        if (count === 0) {
            noResultsElement.classList.remove('d-none');
            resultsContainer.innerHTML = '';
        } else {
            noResultsElement.classList.add('d-none');
        }
    },

    // Muestra los resultados de búsqueda
    displaySearchResults: function(term, results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            console.error('No se encontró el contenedor de resultados');
            return;
        }

        // Excluir páginas irrelevantes de los resultados
        results = results.filter(r => !r.ref.includes('buscar.html'));

        const isLimited = results.length > this.MAX_RESULTS;
        const displayResults = results.slice(0, this.MAX_RESULTS);

        this.updateResultsMessage(term, results.length, isLimited);

        if (displayResults.length === 0) return;

        // Categorizar resultados
        const byCategory = {};
        displayResults.forEach(result => {
            const cat = this.categorizeUrl(result.ref);
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(result);
        });

        // Botones de filtro por categoría
        let html = '<div class="d-flex flex-wrap gap-2 mb-4" role="toolbar" aria-label="Filtrar resultados por categoría">';
        html += `<button class="btn btn-sm btn-brand rounded-pill search-filter-btn active" data-filter="all">
            <i class="bi bi-grid-3x3-gap me-1"></i>Todos <span class="badge bg-white text-dark ms-1">${displayResults.length}</span>
        </button>`;

        Object.entries(byCategory).forEach(([cat, items]) => {
            const cfg = this.categories[cat] || this.categories.general;
            html += `<button class="btn btn-sm btn-outline-secondary rounded-pill search-filter-btn" data-filter="${cat}">
                <i class="${cfg.icon} me-1"></i>${cfg.label} <span class="badge bg-secondary ms-1">${items.length}</span>
            </button>`;
        });
        html += '</div>';

        // Tarjetas de resultados
        displayResults.forEach(result => {
            const pageData = this.dataStore[result.ref] || {};
            const pageTitle = this.tituloCorto(pageData.title);
            const pageContent = pageData.content || '';
            const url = '/' + String(result.ref).replace(/^\/+/, '');
            const cat = this.categorizeUrl(url);
            const catClase = this.categories[cat] ? cat : 'general';
            const cfg = this.categories[catClase];
            const excerpt = this.getExcerpt(pageContent, term);

            html += `
                <div class="card search-result-card mb-3 border-0 shadow-sm busq-cat-${catClase}" data-category="${cat}">
                    <div class="card-body py-3">
                        <div class="d-flex align-items-start gap-3">
                            <div class="busq-icono rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                <i class="${cfg.icon}"></i>
                            </div>
                            <div class="flex-grow-1 min-w-0">
                                <h6 class="mb-1">
                                    <a href="${this.escaparHtml(url)}" class="text-decoration-none">${this.highlightTerm(pageTitle, term)}</a>
                                </h6>
                                <span class="badge rounded-pill mb-2 busq-badge">${cfg.label}</span>
                                <p class="text-muted small mb-0">${excerpt}</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        });

        if (isLimited) {
            html += `<p class="text-muted text-center small mt-3">Mostrando los ${this.MAX_RESULTS} resultados más relevantes de ${results.length} encontrados.</p>`;
        }

        resultsContainer.innerHTML = html;

        // Funcionalidad de filtros por categoría
        resultsContainer.querySelectorAll('.search-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                resultsContainer.querySelectorAll('.search-filter-btn').forEach(b => {
                    b.classList.remove('active', 'btn-brand');
                    b.classList.add('btn-outline-secondary');
                });
                btn.classList.add('active', 'btn-brand');
                btn.classList.remove('btn-outline-secondary');

                resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
                    card.classList.toggle('d-none', filter !== 'all' && card.dataset.category !== filter);
                });
            });
        });
    },
    
    // Agrupa los resultados por página
    groupResultsByPage: function(results) {
        return results.reduce((acc, result) => {
            if (!acc[result.url]) {
                acc[result.url] = [];
            }
            acc[result.url].push(result);
            return acc;
        }, {});
    }
};

/**  librerias se carga localmente para evitar errores en la consola, lunr.js 
 * Espera a que una variable global (como una librería cargada desde un CDN) esté disponible.
 * @param {string} name - El nombre de la variable global a esperar (ej. 'lunr').
 * @param {number} [timeout=3000] - Tiempo máximo de espera en milisegundos.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando la variable está lista.
 */
function waitForGlobal(name, timeout = 3000) {
    return new Promise((resolve, reject) => {
        let waited = 0;
        const interval = 50;
        const check = () => {
            if (window[name]) {
                resolve();
            } else if (waited >= timeout) {
                reject(new Error(`La librería '${name}' no estuvo disponible después de ${timeout}ms`));
            } else {
                waited += interval;
                setTimeout(check, interval);
            }
        };
        check();
    });
}

// Inicializar la búsqueda cuando el DOM esté listo
// Esperar a que el header/footer se carguen para asegurar que el formulario de búsqueda exista.
document.addEventListener('partialsLoaded', async () => {
    // Verificar si el script de lunr realmente existe en el documento
    if (!document.querySelector('script[src*="lunr"]')) {
        console.warn("Lunr.js no detectado. La búsqueda podría no funcionar.");
    }
    searchConfig.init();
    
    if (window.location.pathname.endsWith('buscar.html')) {
        const spinnerContainer = document.querySelector('#search-results .text-center');
        try {
            if (spinnerContainer) spinnerContainer.classList.remove('d-none');
            
            // Esperar a que lunr.js esté cargado y listo para usar
            await waitForGlobal('lunr');

            const indexLoaded = await searchConfig.loadSearchData();
            if (spinnerContainer) spinnerContainer.classList.add('d-none');

            const buscarDesdeUrl = () => {
                const searchTerm = (new URLSearchParams(window.location.search).get('q') || '').trim();
                searchConfig.sincronizarCampos(searchTerm);
                if (searchTerm) {
                    searchConfig.performSearch(searchTerm);
                } else {
                    // Sin término: no dejar el spinner ni "Buscando:" vacío
                    const estado = document.getElementById('search-status');
                    if (estado) estado.innerHTML = 'Escriba un término en el buscador de la parte superior.';
                }
            };
            if (indexLoaded) {
                buscarDesdeUrl();
                // Botones Atrás/Adelante del navegador entre búsquedas
                window.addEventListener('popstate', buscarDesdeUrl);
            }
        } catch (error) {
            console.error("Error al inicializar la búsqueda:", error);
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `<div class="alert alert-danger">Error crítico: La función de búsqueda no se pudo cargar.</div>`;
            }
            if (spinnerContainer) spinnerContainer.classList.add('d-none');
        }
    }
});
