// Configuración de la búsqueda
const searchConfig = {
    lunrIndex: null,
    dataStore: {}, // Para mapear URL a datos completos de la página
    isInitialized: false,
    MAX_RESULTS: 20,
    categories: {
        transparencia: { label: 'Transparencia', icon: 'bi-shield-check', color: '#164443' },
        servicios: { label: 'Servicios de Salud', icon: 'bi-heart-pulse', color: '#dc3545' },
        normatividad: { label: 'Normatividad', icon: 'bi-journal-text', color: '#6f42c1' },
        participacion: { label: 'Participación', icon: 'bi-people', color: '#198754' },
        pqrs: { label: 'PQRSD', icon: 'bi-chat-square-text', color: '#fd7e14' },
        noticias: { label: 'Noticias', icon: 'bi-newspaper', color: '#0d6efd' },
        institucional: { label: 'Institucional', icon: 'bi-building', color: '#20c997' },
        general: { label: 'General', icon: 'bi-info-circle', color: '#6c757d' }
    },
    initializationPromise: null,
    
    // Inicialización
    init: function() {
        this.setupSearchForm();
        // Inicializar el índice si estamos en la página de búsqueda
        if (document.getElementById('search-results')) {
            this.initializeSearch();
        }
    },
    
    // Inicializar la búsqueda
    initializeSearch: function() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                const result = await this.loadSearchData();
                if (result === false) {
                    this.initializationPromise = null;
                    reject(new Error('El índice de búsqueda no se pudo cargar'));
                    return;
                }
                this.isInitialized = true;
                resolve();
            } catch (error) {
                console.error('Error al inicializar la búsqueda:', error);
                this.initializationPromise = null;
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
                    this.performSearch(searchTerm);
                } else {
                    window.location.href = `buscar.html?q=${encodeURIComponent(searchTerm)}`;
                }
            });
        });
    },
    
    // Carga el índice de búsqueda y lo prepara para ser usado por Lunr.js
    loadSearchData: async function() {
        try {
            console.log('Cargando índice de búsqueda...');
            
            // Esperar a que estén disponibles las librerías de lunr
            await waitForGlobal('lunr', 5000);
            
            // Cargar el índice de búsqueda
            const response = await fetch('search-index.json', {
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

            // Configurar Lunr.js
            return new Promise((resolve, reject) => {
                try {
                    // Esperar a que esté disponible el soporte para español
                    if (window.lunr && window.lunr.es) {
                        this.lunrIndex = lunr(function() {
                            this.use(lunr.es);
                            this.ref('url');
                            this.field('title', { boost: 10 });
                            this.field('content');
                            
                            documents.forEach(doc => this.add(doc));
                        });
                        console.log('Índice de búsqueda creado exitosamente');
                        resolve(true);
                    } else {
                        // Usar configuración básica si no hay soporte para español
                        console.warn('Usando configuración básica de lunr (sin soporte para español)');
                        this.lunrIndex = lunr(function() {
                            this.ref('url');
                            this.field('title', { boost: 10 });
                            this.field('content');
                            
                            documents.forEach(doc => this.add(doc));
                        });
                        resolve(true);
                    }
                } catch (error) {
                    console.error('Error al configurar el índice de búsqueda:', error);
                    reject(error);
                }
            });
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
            // Realizar la búsqueda con Lunr
            const results = this.lunrIndex.search(term);
            console.log(`Se encontraron ${results.length} resultados para: ${term}`);
            this.displaySearchResults(term, results);
            return results;
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
            this.showError('Ocurrió un error al realizar la búsqueda. Por favor, intente con otros términos, revise la ortografía o intente más tarde.');
            return [];
        }
    },
    
    // Obtiene un extracto del texto que contiene el término de búsqueda
    getExcerpt: function(text, term) {
        // Manejar casos donde el texto es nulo o indefinido
        if (!text) {
            return 'No hay contenido disponible para mostrar.';
        }
        
        // Si el texto es muy corto, devolverlo completo
        if (text.length <= 250) {
            return this.highlightTerm(text, term);
        }
        
        // Buscar el término en el texto (insensible a mayúsculas/minúsculas)
        const searchTerm = term.toLowerCase();
        const textLower = text.toLowerCase();
        const index = textLower.indexOf(searchTerm);
        
        // Si no se encuentra el término, devolver los primeros 250 caracteres
        if (index === -1) {
            return this.highlightTerm(text.substring(0, 250) + '...', term);
        }
        
        // Obtener un fragmento alrededor del término de búsqueda
        const start = Math.max(0, index - 80);
        const end = Math.min(text.length, index + searchTerm.length + 80);
        let excerpt = text.substring(start, end);
        
        // Agregar puntos suspensivos si es necesario
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        
        // Resaltar el término de búsqueda
        return this.highlightTerm(excerpt, term);
    },
    
    // Función auxiliar para resaltar términos en el texto
    highlightTerm: function(text, term) {
        if (!term || !text) return text;
        
        try {
            // Escapar caracteres especiales para la expresión regular
            const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            return text.replace(
                new RegExp(escapedTerm, 'gi'), 
                match => `<span class="bg-warning text-dark">${match}</span>`
            );
        } catch (e) {
            console.error('Error al resaltar el término:', e);
            return text; // Devolver el texto sin modificar si hay un error
        }
    },
    
    // Actualiza el mensaje de estado de la búsqueda
    updateResultsMessage: function(term, count, isLimited = false) {
        const resultsContainer = document.getElementById('search-results');
        const resultsCount = document.getElementById('results-count');
        const searchTermElement = document.getElementById('search-term');
        const noResultsElement = document.getElementById('no-results');

        if (!resultsContainer || !resultsCount || !searchTermElement || !noResultsElement) return;

        searchTermElement.textContent = `"${term}"`;
        let msg = `Se encontraron ${count} resultados.`;
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
            const pageTitle = pageData.title || 'Sin título';
            const pageContent = pageData.content || '';
            const url = result.ref;
            const cat = this.categorizeUrl(url);
            const cfg = this.categories[cat] || this.categories.general;
            const excerpt = this.getExcerpt(pageContent, term);

            html += `
                <div class="card search-result-card mb-3 border-0 shadow-sm" data-category="${cat}">
                    <div class="card-body py-3">
                        <div class="d-flex align-items-start gap-3">
                            <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                 style="width:42px;height:42px;background:${cfg.color}15;">
                                <i class="${cfg.icon}" style="color:${cfg.color};font-size:1.2rem;"></i>
                            </div>
                            <div class="flex-grow-1" style="min-width:0;">
                                <h6 class="mb-1">
                                    <a href="${url}" class="text-decoration-none">${this.highlightTerm(pageTitle, term)}</a>
                                </h6>
                                <span class="badge rounded-pill mb-2" style="background:${cfg.color}18;color:${cfg.color};font-size:.7rem;font-weight:500;">${cfg.label}</span>
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

            if (indexLoaded) {
                const urlParams = new URLSearchParams(window.location.search);
                const searchTerm = urlParams.get('q');
                if (searchTerm) {
                    document.querySelector('input[name="q"]').value = searchTerm;
                    searchConfig.performSearch(searchTerm);
                }
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
