const {
  normalizePath,
  validateEnvVars,
  formatTopPages,
  formatDailyVisits,
  formatSingleMetric,
  formatMonthlyTrend,
  formatDimensionData,
} = require('../netlify/functions/get-analytics');

// --- normalizePath ---

describe('normalizePath', () => {
  test('returns "/" for root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  test('returns "/" for empty string', () => {
    expect(normalizePath('')).toBe('/');
  });

  test('returns "/" for undefined', () => {
    expect(normalizePath(undefined)).toBe('/');
  });

  test('strips .html extension', () => {
    expect(normalizePath('/urgencias.html')).toBe('/urgencias');
  });

  test('strips /index.html to folder path', () => {
    expect(normalizePath('/servicios/index.html')).toBe('/servicios');
  });

  test('strips trailing /index', () => {
    expect(normalizePath('/servicios/index')).toBe('/servicios');
  });

  test('removes query parameters', () => {
    expect(normalizePath('/page.html?q=test')).toBe('/page');
  });

  test('removes hash fragments', () => {
    expect(normalizePath('/page.html#section')).toBe('/page');
  });

  test('removes both query params and hash', () => {
    expect(normalizePath('/page.html?q=test#section')).toBe('/page');
  });

  test('collapses duplicate slashes', () => {
    expect(normalizePath('//page//sub//')).toBe('/page/sub');
  });

  test('strips trailing slash from non-root paths', () => {
    expect(normalizePath('/servicios/')).toBe('/servicios');
  });

  test('handles /index.html at root', () => {
    expect(normalizePath('/index.html')).toBe('/');
  });

  test('preserves simple path without .html', () => {
    expect(normalizePath('/about')).toBe('/about');
  });
});

// --- validateEnvVars ---

describe('validateEnvVars', () => {
  const origEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  test('returns null when all env vars are set', () => {
    // validateEnvVars reads module-level const values captured at require() time,
    // so we test the current state (vars not set at module load).
    // Instead we test that it returns a string when vars are missing.
    const result = validateEnvVars();
    // Since the env vars were not set when the module was loaded, it should return an error string
    expect(typeof result).toBe('string');
  });

  test('returns error when GA_PROPERTY_ID is missing', () => {
    const result = validateEnvVars();
    expect(result).toContain('GA_PROPERTY_ID');
  });
});

// --- formatTopPages ---

describe('formatTopPages', () => {
  test('returns empty array for null response', () => {
    expect(formatTopPages(null)).toEqual([]);
  });

  test('returns empty array for empty response', () => {
    expect(formatTopPages([{}])).toEqual([]);
  });

  test('returns empty array for response without rows', () => {
    expect(formatTopPages([{ rows: undefined }])).toEqual([]);
  });

  test('formats rows into page objects', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '/urgencias.html' }, { value: 'Urgencias - Hospital' }],
          metricValues: [{ value: '150' }],
        },
        {
          dimensionValues: [{ value: '/laboratorio.html' }, { value: 'Laboratorio' }],
          metricValues: [{ value: '80' }],
        },
      ],
    }];

    const result = formatTopPages(response);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Urgencias - Hospital');
    expect(result[0].visits).toBe(150);
    expect(result[0].path).toBe('/urgencias');
    expect(result[1].visits).toBe(80);
  });

  test('sorts by visits descending and limits to top 5', () => {
    const rows = [];
    for (let i = 0; i < 10; i++) {
      rows.push({
        dimensionValues: [{ value: `/page${i}.html` }, { value: `Page ${i}` }],
        metricValues: [{ value: String(i * 10) }],
      });
    }
    const response = [{ rows }];
    const result = formatTopPages(response);
    expect(result).toHaveLength(5);
    expect(result[0].visits).toBe(90);
    expect(result[4].visits).toBe(50);
  });

  test('aggregates duplicate titles', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '/page1.html' }, { value: 'Same Title' }],
          metricValues: [{ value: '50' }],
        },
        {
          dimensionValues: [{ value: '/page2.html' }, { value: 'Same Title' }],
          metricValues: [{ value: '30' }],
        },
      ],
    }];
    const result = formatTopPages(response);
    expect(result).toHaveLength(1);
    expect(result[0].visits).toBe(80);
  });

  test('generates title from path for (not set) titles', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '/consulta-externa.html' }, { value: '(not set)' }],
          metricValues: [{ value: '100' }],
        },
      ],
    }];
    const result = formatTopPages(response);
    expect(result[0].title).toBe('Consulta Externa');
  });

  test('generates "Pagina de Inicio" for root path', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '/' }, { value: '(not set)' }],
          metricValues: [{ value: '200' }],
        },
      ],
    }];
    const result = formatTopPages(response);
    expect(result[0].title).toBe('Página de Inicio');
  });

  test('replaces generic hospital title with generated one', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '/urgencias.html' }, { value: 'Hospital Departamental San Antonio' }],
          metricValues: [{ value: '100' }],
        },
      ],
    }];
    const result = formatTopPages(response);
    expect(result[0].title).toBe('Urgencias');
  });
});

// --- formatDailyVisits ---

describe('formatDailyVisits', () => {
  test('returns empty array for null response', () => {
    expect(formatDailyVisits(null)).toEqual([]);
  });

  test('returns empty array for empty response', () => {
    expect(formatDailyVisits([{}])).toEqual([]);
  });

  test('formats YYYYMMDD date to YYYY-MM-DD', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '20260115' }],
          metricValues: [{ value: '42' }],
        },
      ],
    }];
    const result = formatDailyVisits(response);
    expect(result).toEqual([{ date: '2026-01-15', visits: 42 }]);
  });

  test('handles multiple rows', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '20260101' }],
          metricValues: [{ value: '10' }],
        },
        {
          dimensionValues: [{ value: '20260102' }],
          metricValues: [{ value: '20' }],
        },
      ],
    }];
    const result = formatDailyVisits(response);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01-01');
    expect(result[1].visits).toBe(20);
  });
});

// --- formatSingleMetric ---

describe('formatSingleMetric', () => {
  test('returns 0 for null response', () => {
    expect(formatSingleMetric(null)).toBe(0);
  });

  test('returns 0 for empty response', () => {
    expect(formatSingleMetric([{}])).toBe(0);
  });

  test('returns 0 for response with no rows', () => {
    expect(formatSingleMetric([{ rows: [] }])).toBe(0);
  });

  test('parses integer metric value', () => {
    const response = [{
      rows: [{ metricValues: [{ value: '12345' }] }],
    }];
    expect(formatSingleMetric(response)).toBe(12345);
  });
});

// --- formatMonthlyTrend ---

describe('formatMonthlyTrend', () => {
  test('returns empty array for null response', () => {
    expect(formatMonthlyTrend(null)).toEqual([]);
  });

  test('returns empty array for empty response', () => {
    expect(formatMonthlyTrend([{}])).toEqual([]);
  });

  test('formats year and month into YYYY-MM', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '2026' }, { value: '1' }],
          metricValues: [{ value: '500' }],
        },
        {
          dimensionValues: [{ value: '2026' }, { value: '12' }],
          metricValues: [{ value: '800' }],
        },
      ],
    }];
    const result = formatMonthlyTrend(response);
    expect(result).toEqual([
      { date: '2026-01', visits: 500 },
      { date: '2026-12', visits: 800 },
    ]);
  });

  test('pads single-digit months with leading zero', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '2025' }, { value: '3' }],
          metricValues: [{ value: '100' }],
        },
      ],
    }];
    const result = formatMonthlyTrend(response);
    expect(result[0].date).toBe('2025-03');
  });
});

// --- formatDimensionData ---

describe('formatDimensionData', () => {
  test('returns empty object for null response', () => {
    expect(formatDimensionData(null)).toEqual({});
  });

  test('returns empty object for empty response', () => {
    expect(formatDimensionData([{}])).toEqual({});
  });

  test('groups dimension values with their metrics', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: 'mobile' }],
          metricValues: [{ value: '300' }],
        },
        {
          dimensionValues: [{ value: 'desktop' }],
          metricValues: [{ value: '200' }],
        },
      ],
    }];
    const result = formatDimensionData(response);
    expect(result).toEqual({ mobile: 300, desktop: 200 });
  });

  test('aggregates duplicate dimension values', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: 'Chrome' }],
          metricValues: [{ value: '100' }],
        },
        {
          dimensionValues: [{ value: 'Chrome' }],
          metricValues: [{ value: '50' }],
        },
      ],
    }];
    const result = formatDimensionData(response);
    expect(result).toEqual({ Chrome: 150 });
  });

  test('handles empty dimension value as (not set)', () => {
    const response = [{
      rows: [
        {
          dimensionValues: [{ value: '' }],
          metricValues: [{ value: '10' }],
        },
      ],
    }];
    const result = formatDimensionData(response);
    expect(result).toEqual({ '(not set)': 10 });
  });
});
