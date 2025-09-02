const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

// Validar variables de entorno
const propertyId = process.env.GA_PROPERTY_ID;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const raw_private_key = process.env.GOOGLE_PRIVATE_KEY;

function validateEnvVars() {
  if (!propertyId) return 'La variable de entorno GA_PROPERTY_ID no está configurada.';
  if (!client_email) return 'La variable de entorno GOOGLE_CLIENT_EMAIL no está configurada.';
  if (!raw_private_key) return 'La variable de entorno GOOGLE_PRIVATE_KEY no está configurada.';
  return null;
}

const envValidationError = validateEnvVars();
const private_key = raw_private_key ? raw_private_key.replace(/\\n/g, '\n') : null;

// Configurar cliente de Analytics
let analyticsDataClient;
if (!envValidationError) {
  const auth = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: 'https://www.googleapis.com/auth/analytics.readonly',
  });
  analyticsDataClient = new BetaAnalyticsDataClient({ auth });
}

// Funciones de ayuda
const formatGAResponse = (response) => {
  if (!response || !response[0] || !response[0].rows) return 0;
  return parseInt(response[0].rows[0]?.metricValues[0]?.value || 0);
};

const formatTopPages = (response) => {
  if (!response || !response[0] || !response[0].rows) return [];
  return response[0].rows.map(row => ({
    path: row.dimensionValues[0].value,
    title: row.dimensionValues[1].value,
    visits: parseInt(row.metricValues[0].value)
  }));
};

const formatDailyVisits = (response) => {
  if (!response || !response[0] || !response[0].rows) return [];
  return response[0].rows.map(row => {
    const dateStr = row.dimensionValues[0].value;
    return {
      date: `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`, // Formato YYYYMMDD -> YYYY-MM-DD
      visits: parseInt(row.metricValues[0].value)
    };
  });
};

// Manejador de la función
const handler = async (event, context) => {
  // Manejar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
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

  // Verificar errores de configuración
  if (envValidationError) {
    console.error("Error de configuración:", envValidationError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Error de configuración: ${envValidationError}` })
    };
  }

  try {
    // Realizar consultas a la API de Google Analytics
    const [totalVisitors, topPages, dailyVisits] = await Promise.all([
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'totalUsers' }],
      }),
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 5,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
      }),
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      })
    ]);

    // Formatear respuesta
    const response = {
      totalVisitors: formatGAResponse(totalVisitors),
      topPages: formatTopPages(topPages),
      dailyVisits: formatDailyVisits(dailyVisits),
      lastUpdate: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error al obtener datos de Google Analytics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al obtener datos de Google Analytics',
        details: error.message 
      })
    };
  }
};

module.exports = { handler };
