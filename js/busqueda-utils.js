// busqueda-utils.js - Pure utility functions extracted from busqueda.js for reuse and testing.

/**
 * Categorizes a URL according to the site section.
 * @param {string} url
 * @returns {string} category key
 */
function categorizeUrl(url) {
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
}

/**
 * Highlights a search term in a text string using <span> tags.
 * @param {string} text
 * @param {string} term
 * @returns {string}
 */
function highlightTerm(text, term) {
  if (!term || !text) return text;
  try {
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return text.replace(
      new RegExp(escapedTerm, 'gi'),
      match => `<span class="bg-warning text-dark">${match}</span>`
    );
  } catch (e) {
    return text;
  }
}

/**
 * Gets an excerpt of text containing the search term.
 * @param {string} text
 * @param {string} term
 * @returns {string}
 */
function getExcerpt(text, term) {
  if (!text) {
    return 'No hay contenido disponible para mostrar.';
  }
  if (text.length <= 250) {
    return highlightTerm(text, term);
  }
  const searchTerm = term.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(searchTerm);
  if (index === -1) {
    return highlightTerm(text.substring(0, 250) + '...', term);
  }
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + searchTerm.length + 80);
  let excerpt = text.substring(start, end);
  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';
  return highlightTerm(excerpt, term);
}

/**
 * Groups search results by URL.
 * @param {Array} results
 * @returns {Object}
 */
function groupResultsByPage(results) {
  return results.reduce((acc, result) => {
    if (!acc[result.url]) {
      acc[result.url] = [];
    }
    acc[result.url].push(result);
    return acc;
  }, {});
}

// Export for Node.js / testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { categorizeUrl, highlightTerm, getExcerpt, groupResultsByPage };
}
