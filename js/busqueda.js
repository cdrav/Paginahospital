// Configuración de la búsqueda
const searchConfig = {
    lunrIndex: null,
    dataStore: {}, // Para mapear URL a datos completos de la página
    isInitialized: false,
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
        // Soporta formularios con clase .search-form o action que termine en buscar.html
        const searchForm = document.querySelector('form.search-form, form[action$="buscar.html"]');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                const input = searchForm.querySelector('input[name="q"]');
                const searchTerm = input ? input.value.trim() : '';
                if (!searchTerm) { return; }
                // Interceptar para usar navegación amigable
                e.preventDefault();
                this.performSearch(searchTerm);
            });
        }
    },
    
    // Carga el índice de búsqueda y lo prepara para ser usado por Lunr.js
    loadSearchData: async function() {
        try {
            console.log('Cargando índice de búsqueda...');
            const response = await fetch('search-index.json');
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
            this.lunrIndex = lunr(function () {
                // Habilitar el stemmer (lematizador) para español
                try {
                    this.use(lunr.es);
                } catch (e) {
                    console.warn('No se pudo cargar el stemmer en español, usando el predeterminado', e);
                }

                this.ref('url');
                this.field('title', { boost: 10 });
                this.field('content');
                
                documents.forEach(doc => {
                    this.add(doc);
                });
            });
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
            this.showError('Ocurrió un error al realizar la búsqueda. Por favor, intente con otros términos.');
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
        resultsCount.textContent = `Se encontraron ${count} resultados.`;

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

        console.log('Mostrando resultados:', results);
        this.updateResultsMessage(term, results.length);
        
        let html = '';
        
        if (results.length === 0) {
            // El mensaje de "no resultados" se maneja en updateResultsMessage
            return;
        } else {
            // Mostrar los resultados sin agrupar primero para depuración
            results.forEach(result => {
                const pageData = this.dataStore[result.ref] || {};
                const pageTitle = pageData.title || 'Sin título';
                const pageContent = pageData.content || '';
                const url = result.ref;
                
                // Generar un extracto del contenido de la página que contenga el término de búsqueda
                const excerpt = this.getExcerpt(pageContent, term);
                
                html += `
                    <div class="card search-result-card mb-4">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">
                                <a href="${url}" class="text-decoration-none">${pageTitle}</a>
                                <small class="text-muted d-block">${url}</small>
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="search-snippet">
                                ${excerpt}
                                <div class="text-muted small mt-2">Relevancia: ${(result.score * 100).toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        resultsContainer.innerHTML = html;
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

/**
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
document.addEventListener('DOMContentLoaded', async () => {
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
