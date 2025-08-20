// Configuración de la búsqueda
const searchConfig = {
    lunrIndex: null,
    dataStore: {}, // Para mapear URL a datos completos de la página
    
    // Inicialización
    init: function() {
        this.setupSearchForm();
        // La carga del índice se delega al listener del DOM en la página de búsqueda
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
            const response = await fetch('search-index.json');
            if (!response.ok) {
                throw new Error(`Error de red: ${response.statusText}`);
            }
            const documents = await response.json();
            
            // Guardar los datos para mostrarlos en los resultados
            documents.forEach(doc => {
                this.dataStore[doc.url] = doc;
            });

            // Configurar Lunr.js
            this.lunrIndex = lunr(function () {
                // Habilitar el stemmer (lematizador) para español
                this.use(lunr.es);

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

    // Realiza la búsqueda
    performSearch: function(term) {
        if (window.location.pathname.endsWith('buscar.html')) {
            if (!this.lunrIndex) {
                console.warn("Intento de búsqueda antes de que el índice esté listo.");
                return;
            }
            
            try {
                const searchResults = this.lunrIndex.search(term);
                const results = searchResults.map(result => {
                    const doc = this.dataStore[result.ref];
                    return {
                        url: doc.url,
                        title: doc.title,
                        excerpt: this.getExcerpt(doc.content, term)
                    };
                });
                this.displaySearchResults(term, results);
            } catch (e) {
                console.error("Error durante la búsqueda con Lunr:", e);
                this.displaySearchResults(term, []);
            }
        } else {
            // Redirige a la página de resultados de búsqueda
            window.location.href = `buscar.html?q=${encodeURIComponent(term)}`;
        }
    },
    
    // Obtiene un extracto del texto que contiene el término de búsqueda
    getExcerpt: function(text, term) {
        const index = text.toLowerCase().indexOf(term.toLowerCase());
        if (index === -1) {
            return text.substring(0, 250) + '...';
        }
        const start = Math.max(0, index - 80);
        const end = Math.min(text.length, index + term.length + 80);
        let excerpt = text.substring(start, end);
        
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        
        // Resaltar el término de búsqueda
        // Escapar caracteres especiales para la RegExp
        const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return excerpt.replace(new RegExp(escapedTerm, 'gi'), match => `<strong>${match}</strong>`);
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
        if (!resultsContainer) return;

        this.updateResultsMessage(term, results.length);
        
        let html = '';
        
        if (results.length === 0) {
            // El mensaje de "no resultados" se maneja en updateResultsMessage
            return;
        } else {
            const groupedResults = this.groupResultsByPage(results);
            Object.entries(groupedResults).forEach(([url, pageResults]) => {
                // El título de la página es el mismo para todos los resultados agrupados
                const pageTitle = pageResults[0].title;
                html += `
                    <div class="card search-result-card mb-4">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">
                                <a href="${url}" class="text-decoration-none">${pageTitle}</a>
                                <small class="text-muted d-block">${url}</small>
                            </h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                ${pageResults.map(result => `
                                    <li class="mb-3 search-snippet">
                                        <a href="${url}" class="text-decoration-none text-body">
                                            ${result.excerpt}
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
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

// Inicializar la búsqueda cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    searchConfig.init();
    
    if (window.location.pathname.endsWith('buscar.html')) {
        const spinnerContainer = document.querySelector('#search-results .text-center');
        if (spinnerContainer) spinnerContainer.classList.remove('d-none');

        // Cargar el índice de búsqueda
        const indexLoaded = await searchConfig.loadSearchData();
        
        // Ocultar el spinner
        if (spinnerContainer) spinnerContainer.classList.add('d-none');

        if (indexLoaded) {
            const urlParams = new URLSearchParams(window.location.search);
            const searchTerm = urlParams.get('q');
            
            if (searchTerm) {
                document.querySelector('input[name="q"]').value = searchTerm;
                searchConfig.performSearch(searchTerm);
            }
        }
    }
});
