// Configuración de la búsqueda
const searchConfig = {
    // Páginas donde se realizará la búsqueda
    searchablePages: [
        'index.html',
        'Transparencia y acceso a la información Publica.html',
        'Atención y servicios a la ciudadania.html',
        'Participa.html',
        // Agrega aquí más páginas según sea necesario
    ],
    
    // Inicialización
    init: function() {
        this.setupSearchForm();
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
    
    // Realiza la búsqueda
    performSearch: function(term) {
        // Verifica si estamos en la página de resultados
        if (window.location.pathname.endsWith('buscar.html')) {
            this.displaySearchResults(term, this.searchInCurrentPage(term));
        } else {
            // Redirige a la página de resultados de búsqueda
            window.location.href = `buscar.html?q=${encodeURIComponent(term)}`;
        }
    },
    
    // Busca en la página actual
    searchInCurrentPage: function(term) {
        const results = [];
        const searchableElements = document.querySelectorAll('main, article, section, .card, p, h1, h2, h3, h4, h5, h6');
        
        searchableElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            const searchTerm = term.toLowerCase();
            
            if (text.includes(searchTerm)) {
                // Obtener el título más cercano para el contexto
                const title = this.getClosestTitle(element);
                const url = window.location.pathname.split('/').pop();
                
                results.push({
                    title: title || document.title,
                    url: url,
                    excerpt: this.getExcerpt(text, searchTerm),
                    element: element
                });
            }
        });
        
        return results;
    },
    
    // Obtiene el título más cercano al elemento
    getClosestTitle: function(element) {
        let current = element;
        while (current) {
            if (current.tagName && current.tagName.match(/^H[1-6]$/)) {
                return current.textContent;
            }
            current = current.parentElement;
        }
        return null;
    },
    
    // Obtiene un extracto del texto que contiene el término de búsqueda
    getExcerpt: function(text, term) {
        const index = text.indexOf(term.toLowerCase());
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + term.length + 50);
        let excerpt = text.substring(start, end);
        
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        
        // Resaltar el término de búsqueda
        return excerpt.replace(new RegExp(term, 'gi'), match => `<strong>${match}</strong>`);
    },
    
    // Muestra los resultados de búsqueda
    displaySearchResults: function(term, results) {
        const resultsContainer = document.getElementById('search-results');
        const resultsCount = document.getElementById('results-count');
        const searchTermElement = document.getElementById('search-term');
        
        if (!resultsContainer || !resultsCount || !searchTermElement) return;
        
        searchTermElement.textContent = `"${term}"`;
        resultsCount.textContent = results.length;
        
        let html = '';
        
        if (results.length === 0) {
            html = `
                <div class="alert alert-info">
                    No se encontraron resultados para "${term}". Intenta con otros términos de búsqueda.
                </div>
            `;
        } else {
            const groupedResults = this.groupResultsByPage(results);
            
            Object.entries(groupedResults).forEach(([url, pageResults]) => {
                const firstResult = pageResults[0];
                
                html += `
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">
                                <a href="${url}" class="text-decoration-none">${firstResult.title}</a>
                                <small class="text-muted d-block">${url}</small>
                            </h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                ${pageResults.map(result => `
                                    <li class="mb-2">
                                        <a href="${url}#${this.getElementId(result.element) || ''}" class="text-decoration-none">
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
    },
    
    // Obtiene el ID del elemento o genera uno
    getElementId: function(element) {
        if (element.id) return element.id;
        
        // Si el elemento no tiene ID, intenta encontrar un ID en los padres
        let current = element;
        while (current) {
            if (current.id) return current.id;
            current = current.parentElement;
        }
        
        return null;
    }
};

// Inicializar la búsqueda cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    searchConfig.init();
    
    // Si estamos en la página de resultados, realizar la búsqueda
    if (window.location.pathname.endsWith('buscar.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('q');
        
        if (searchTerm) {
            document.querySelector('input[name="q"]').value = searchTerm;
            searchConfig.performSearch(searchTerm);
        }
    }
});
