const { categorizeUrl, highlightTerm, getExcerpt, groupResultsByPage } = require('../js/busqueda-utils');

// --- categorizeUrl ---

describe('categorizeUrl', () => {
  test('returns "transparencia" for transparency URLs', () => {
    expect(categorizeUrl('transparencia-acceso-informacion-publica.html')).toBe('transparencia');
  });

  test('returns "servicios" for urgencias URL', () => {
    expect(categorizeUrl('urgencias.html')).toBe('servicios');
  });

  test('returns "servicios" for consulta-externa URL', () => {
    expect(categorizeUrl('consulta-externa.html')).toBe('servicios');
  });

  test('returns "servicios" for laboratorio URL', () => {
    expect(categorizeUrl('laboratorio.html')).toBe('servicios');
  });

  test('returns "servicios" for hospitalizacion URL', () => {
    expect(categorizeUrl('hospitalizacion.html')).toBe('servicios');
  });

  test('returns "servicios" for partos URL', () => {
    expect(categorizeUrl('partos.html')).toBe('servicios');
  });

  test('returns "servicios" for cuidado-oral URL', () => {
    expect(categorizeUrl('cuidado-oral.html')).toBe('servicios');
  });

  test('returns "servicios" for diagnostico URL', () => {
    expect(categorizeUrl('diagnostico.html')).toBe('servicios');
  });

  test('returns "servicios" for promocion-prevencion URL', () => {
    expect(categorizeUrl('promocion-prevencion.html')).toBe('servicios');
  });

  test('returns "servicios" for consultorio URL', () => {
    expect(categorizeUrl('consultorio-rosa.html')).toBe('servicios');
  });

  test('returns "servicios" for citas URL', () => {
    expect(categorizeUrl('citas-medicas-online.html')).toBe('servicios');
  });

  test('returns "servicios" for historia-clinica URL', () => {
    expect(categorizeUrl('historia-clinica.html')).toBe('servicios');
  });

  test('returns "normatividad" for normatividad URL', () => {
    expect(categorizeUrl('normatividad.html')).toBe('normatividad');
  });

  test('returns "participacion" for participa URL', () => {
    expect(categorizeUrl('participa.html')).toBe('participacion');
  });

  test('returns "pqrs" for pqrs URL', () => {
    expect(categorizeUrl('pqrs.html')).toBe('pqrs');
  });

  test('returns "noticias" for noticias URL', () => {
    expect(categorizeUrl('noticias.html')).toBe('noticias');
  });

  test('returns "institucional" for portal-institucional URL', () => {
    expect(categorizeUrl('portal-institucional.html')).toBe('institucional');
  });

  test('returns "institucional" for directorio-institucional URL', () => {
    expect(categorizeUrl('directorio-institucional.html')).toBe('institucional');
  });

  test('returns "institucional" for estadisticas URL', () => {
    expect(categorizeUrl('estadisticas.html')).toBe('institucional');
  });

  test('returns "institucional" for asociaciones URL', () => {
    expect(categorizeUrl('asociaciones_usuarios.html')).toBe('institucional');
  });

  test('returns "general" for index page', () => {
    expect(categorizeUrl('index.html')).toBe('general');
  });

  test('returns "general" for unknown URLs', () => {
    expect(categorizeUrl('random-page.html')).toBe('general');
  });

  test('handles null/undefined input', () => {
    expect(categorizeUrl(null)).toBe('general');
    expect(categorizeUrl(undefined)).toBe('general');
  });

  test('handles empty string', () => {
    expect(categorizeUrl('')).toBe('general');
  });

  test('is case insensitive', () => {
    expect(categorizeUrl('URGENCIAS.HTML')).toBe('servicios');
    expect(categorizeUrl('Transparencia.html')).toBe('transparencia');
  });
});

// --- highlightTerm ---

describe('highlightTerm', () => {
  test('wraps matching term in highlight span', () => {
    const result = highlightTerm('Hello world', 'world');
    expect(result).toBe('Hello <span class="bg-warning text-dark">world</span>');
  });

  test('is case insensitive', () => {
    const result = highlightTerm('Hello World', 'world');
    expect(result).toBe('Hello <span class="bg-warning text-dark">World</span>');
  });

  test('highlights all occurrences', () => {
    const result = highlightTerm('test a test', 'test');
    expect(result).toBe('<span class="bg-warning text-dark">test</span> a <span class="bg-warning text-dark">test</span>');
  });

  test('returns original text if term is empty', () => {
    expect(highlightTerm('Hello world', '')).toBe('Hello world');
  });

  test('returns original text if term is null', () => {
    expect(highlightTerm('Hello world', null)).toBe('Hello world');
  });

  test('returns text if text is null', () => {
    expect(highlightTerm(null, 'test')).toBe(null);
  });

  test('escapes regex special characters in term', () => {
    const result = highlightTerm('price is $5.00', '$5.00');
    expect(result).toBe('price is <span class="bg-warning text-dark">$5.00</span>');
  });

  test('handles parentheses in search term', () => {
    const result = highlightTerm('function(x)', '(x)');
    expect(result).toBe('function<span class="bg-warning text-dark">(x)</span>');
  });
});

// --- getExcerpt ---

describe('getExcerpt', () => {
  test('returns default message for null text', () => {
    expect(getExcerpt(null, 'test')).toBe('No hay contenido disponible para mostrar.');
  });

  test('returns default message for undefined text', () => {
    expect(getExcerpt(undefined, 'test')).toBe('No hay contenido disponible para mostrar.');
  });

  test('returns default message for empty string', () => {
    expect(getExcerpt('', 'test')).toBe('No hay contenido disponible para mostrar.');
  });

  test('returns full highlighted text for short strings', () => {
    const result = getExcerpt('Short text with term', 'term');
    expect(result).toContain('bg-warning');
    expect(result).toContain('term');
  });

  test('returns first 250 chars with ellipsis when term not found in long text', () => {
    const longText = 'A'.repeat(300);
    const result = getExcerpt(longText, 'xyz');
    expect(result).toContain('...');
    expect(result.replace('...', '').length).toBeLessThanOrEqual(250);
  });

  test('centers excerpt around found term', () => {
    const prefix = 'A'.repeat(200);
    const suffix = 'B'.repeat(200);
    const text = prefix + ' findme ' + suffix;
    const result = getExcerpt(text, 'findme');
    expect(result).toContain('findme');
    expect(result.startsWith('...')).toBe(true);
    expect(result.endsWith('...')).toBe(true);
  });

  test('does not add leading ellipsis if term is near start', () => {
    const text = 'findme ' + 'B'.repeat(300);
    const result = getExcerpt(text, 'findme');
    expect(result.startsWith('...')).toBe(false);
  });

  test('does not add trailing ellipsis if term is near end', () => {
    const text = 'A'.repeat(200) + ' findme';
    const result = getExcerpt(text, 'findme');
    expect(result.endsWith('...')).toBe(false);
  });

  test('highlights the found term in excerpt', () => {
    const text = 'A'.repeat(200) + ' hospital ' + 'B'.repeat(200);
    const result = getExcerpt(text, 'hospital');
    expect(result).toContain('<span class="bg-warning text-dark">hospital</span>');
  });
});

// --- groupResultsByPage ---

describe('groupResultsByPage', () => {
  test('groups results by URL', () => {
    const results = [
      { url: '/page1.html', score: 1 },
      { url: '/page2.html', score: 2 },
      { url: '/page1.html', score: 3 },
    ];
    const grouped = groupResultsByPage(results);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['/page1.html']).toHaveLength(2);
    expect(grouped['/page2.html']).toHaveLength(1);
  });

  test('returns empty object for empty array', () => {
    expect(groupResultsByPage([])).toEqual({});
  });

  test('handles single result', () => {
    const results = [{ url: '/only.html', score: 1 }];
    const grouped = groupResultsByPage(results);
    expect(grouped['/only.html']).toHaveLength(1);
  });

  test('preserves all result properties', () => {
    const results = [{ url: '/page.html', score: 5, title: 'Test' }];
    const grouped = groupResultsByPage(results);
    expect(grouped['/page.html'][0]).toEqual({ url: '/page.html', score: 5, title: 'Test' });
  });
});
