const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

// --- Variables de Entorno (leídas una vez) ---
const propertyId = process.env.GA_PROPERTY_ID;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const raw_private_key = process.env.GOOGLE_PRIVATE_KEY;

// --- Funciones de Ayuda ---

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
  return response[0].rows.map(row => ({
    path: row.dimensionValues[0].value,
    title: row.dimensionValues[1].value,
    visits: parseInt(row.metricValues[0].value, 10)
  }));
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

// --- Manejador de la Función ---

const handler = async (event, context) => {
  // Configuración de CORS
  const headers = {
    'Access-Control-Allow-Origin': '*', // O un dominio específico: 'https://hdsa.gov.co'
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

    // 3. Realizar consultas a la API en paralelo (optimizado a 2 llamadas)
    const [topPagesResponse, dailyVisitsResponse] = await Promise.all([
      // Consulta para las páginas más visitadas
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 5,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
      }),
      // Consulta para visitas diarias (de aquí sacaremos el total también)
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      })
    ]);

    // 4. Formatear y procesar la respuesta
    const dailyVisits = formatDailyVisits(dailyVisitsResponse);
    const topPages = formatTopPages(topPagesResponse);

    // Calcular el total de visitantes sumando las visitas diarias
    const totalVisitors = dailyVisits.reduce((sum, day) => sum + day.visits, 0);

    const responsePayload = {
      totalVisitors,
      topPages,
      dailyVisits,
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
