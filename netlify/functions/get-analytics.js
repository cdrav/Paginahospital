const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

// --- Variables de Entorno (leídas una vez) ---
const propertyId = process.env.GA_PROPERTY_ID;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const raw_private_key = process.env.GOOGLE_PRIVATE_KEY;

// --- Funciones de Ayuda ---

// Normaliza una ruta, eliminando .html, index.html, query params y hashes.
const normalizePath = (path) => {
  let p = (path || '/').replace(/\/+/g, '/').split('?')[0].split('#')[0];
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -10); // remove 'index.html' -> /folder/
  }
  if (p.endsWith('.html')) {
    p = p.slice(0, -5); // remove '.html'
  }
  if (p.endsWith('/index')) {
    p = p.slice(0, -5); // remove 'index'
  }
  // Si después de quitar /index.html queda algo como /folder/, quitar la última barra
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  if (p === '') {
    p = '/';
  }
  return p;
};

// Valida que las variables de entorno necesarias existan.
function validateEnvVars() {
  if (!propertyId) return 'La variable de entorno GA_PROPERTY_ID no está configurada.';
  if (!client_email) return 'La variable de entorno GOOGLE_CLIENT_EMAIL no está configurada.';
  if (!raw_private_key) return 'La variable de entorno GOOGLE_PRIVATE_KEY no está configurada.';
  return null;
}

// Formatea la respuesta de las páginas más visitadas.
const formatTopPages = (response) => {
  if (!response || !response[0] || !response[0].rows) return [];

  const pageData = new Map();

  // Función para obtener un título descriptivo de la ruta
  const getPageTitleFromPath = (path) => {
    const cleanPath = normalizePath(path);

    if (cleanPath === '/') return 'Página de Inicio';
    
    // Eliminar la barra inicial y la extensión .html si existe
    let title = cleanPath.replace(/^\//, '');
    
    // Si después de limpiar queda vacío, es una página sin título válido
    if (!title.trim()) return 'Página sin título';

    // Reemplazar guiones y guiones bajos con espacios
    title = title.replace(/[-_]/g, ' ');
    
    // Capitalizar primera letra de cada palabra
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return title;
  };

  response[0].rows.forEach(row => {
    const path = row.dimensionValues[0].value;
    let title = row.dimensionValues[1].value;
    
    const normalizedPath = normalizePath(path);

    // Si el título no es válido, está vacío, es igual a la ruta, o es un título genérico, generamos uno nuevo.
    const isInvalidTitle = !title || !title.trim() || title === '(not set)' || title === '(none)' || title.trim() === path.trim() || title === 'Hospital Departamental San Antonio';

    if (isInvalidTitle) {
      title = getPageTitleFromPath(path);
    }
    
    const visits = parseInt(row.metricValues[0].value, 10);

    // Si la página ya existe en el mapa, suma las visitas.
    // No sobreescribimos el título, asumimos que el primero que llega (el de más visitas) es el bueno.
    if (pageData.has(normalizedPath)) {
      const existing = pageData.get(normalizedPath);
      existing.visits += visits;
    } else {
      pageData.set(normalizedPath, { 
        path: normalizedPath, 
        title: title,
        visits: visits 
      });
    }
  });

  // Asegurarse de que la página de inicio siempre tenga el título correcto.
  if (pageData.has('/')) {
    pageData.get('/').title = 'Página de Inicio';
  }

  // Convierte el mapa a un array para poder manipularlo y ordenarlo.
  const pagesArray = Array.from(pageData.values());

  // Ordena por visitas y toma el top 5
  return pagesArray.sort((a, b) => b.visits - a.visits).slice(0, 5);
};

// Formatea la respuesta de las visitas diarias.
const formatDailyVisits = (response) => {
  if (!response || !response[0] || !response[0].rows) return [];
  return response[0].rows.map(row => {
    const dateStr = row.dimensionValues[0].value;
    return {
      date: `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`, // Formato YYYYMMDD -> YYYY-MM-DD
      visits: parseInt(row.metricValues[0].value, 10)
    };
  });
};

// Formatea una respuesta de métrica única (como total de visitas).
const formatSingleMetric = (response) => {
  if (!response || !response[0] || !response[0].rows || response[0].rows.length === 0) {
    return 0;
  }
  return parseInt(response[0].rows[0].metricValues[0].value, 10);
};

// Formatea la respuesta de visitas mensuales para el gráfico de tendencia.
const formatMonthlyTrend = (response) => {
  if (!response || !response[0] || !response[0].rows) return [];
  return response[0].rows.map(row => ({
    // La API devuelve el mes como un número (1-12). Lo formateamos a 'YYYY-MM'.
    date: `${row.dimensionValues[0].value}-${String(row.dimensionValues[1].value).padStart(2, '0')}`,
    visits: parseInt(row.metricValues[0].value, 10)
  }));
};

// Formatea la respuesta de dispositivos o navegadores en un objeto {clave: valor}.
const formatDimensionData = (response) => {
  if (!response || !response[0] || !response[0].rows) return {};
  const data = {};
  response[0].rows.forEach(row => {
    // Usar 'Desconocido' si el valor de la dimensión está vacío o es '(not set)'
    const dimensionValue = row.dimensionValues[0].value || '(not set)';
    const metricValue = parseInt(row.metricValues[0].value, 10);
    data[dimensionValue] = (data[dimensionValue] || 0) + metricValue;
  });
  return data;
};

// --- Manejador de la Función ---

const handler = async (event, context) => {
  // Configuración de CORS
  const headers = {
    'Access-Control-Allow-Origin': '*', // O un dominio específico: 'https://www.hdsa.gov.co'
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Manejar solicitud OPTIONS para CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Verificar método HTTP
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Helper para obtener el primer día del mes actual en formato YYYY-MM-DD
  const getFirstDayOfMonth = () => {
      const date = new Date();
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}-01`;
  };

  try {
    // 1. Validar variables de entorno DENTRO del handler
    const envValidationError = validateEnvVars();
    if (envValidationError) {
      // Lanza un error para ser capturado por el bloque catch
      throw new Error(envValidationError);
    }

    // 2. Inicializar el cliente de Google Analytics DENTRO del try/catch
    // Esto asegura que cualquier error de autenticación sea capturado y reportado.
    const private_key = raw_private_key.replace(/\\n/g, '\n');
    const auth = new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: 'https://www.googleapis.com/auth/analytics.readonly',
    });
    const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

    // 3. Realizar todas las consultas a la API en paralelo
    const [
      topPagesResponse,
      dailyVisitsResponse,
      devicesResponse,
      browsersResponse,
      lifetimeVisitorsResponse,
      monthlyVisitsResponse,
      monthlyTrendResponse
    ] = await Promise.all([
      // Consulta para las páginas más visitadas
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 25, // Aumentado para capturar variaciones y normalizar
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
      }),
      // Consulta para visitas diarias (de aquí sacaremos el total también)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      }),
      // Consulta para dispositivos
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }]
      }),
      // Consulta para navegadores
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'browser' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 6 // Top 5 + 'otros'
      }),
      // Consulta para visitas totales (lifetime)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '2023-01-01', endDate: 'today' }], // Fecha de inicio del seguimiento
        metrics: [{ name: 'totalUsers' }],
      }),
      // Consulta para visitas de este mes
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: getFirstDayOfMonth(), endDate: 'today' }],
        metrics: [{ name: 'totalUsers' }],
      }),
      // Consulta para tendencia de los últimos 6 meses
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '180daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'year' }, { name: 'month' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ dimension: { dimensionName: 'year' } }, { dimension: { dimensionName: 'month' } }]
      })
    ]);

    // 4. Formatear y procesar la respuesta
    const dailyVisits = formatDailyVisits(dailyVisitsResponse);
    const topPages = formatTopPages(topPagesResponse);
    const devices = formatDimensionData(devicesResponse);
    const browsers = formatDimensionData(browsersResponse);
    const totalVisits = formatSingleMetric(lifetimeVisitorsResponse); // Renombrado para coincidir con el ID del frontend
    const monthlyVisits = formatSingleMetric(monthlyVisitsResponse);
    const monthlyTrend = formatMonthlyTrend(monthlyTrendResponse);

    const responsePayload = {
      totalVisits,
      monthlyVisits,
      monthlyTrend,
      topPages,
      dailyVisits,
      devices,
      browsers,
      lastUpdate: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responsePayload)
    };

  } catch (error) {
    // Captura errores de validación, autenticación o de la API de Google
    console.error('Error en la función get-analytics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al obtener los datos de Google Analytics.',
        // Proporcionar detalles del error para facilitar la depuración
        details: error.message 
      })
    };
  }
};

module.exports = { handler };