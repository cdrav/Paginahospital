const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

// --- Validación de Variables de Entorno ---
// Esto se ejecuta una vez cuando la función se carga, no en cada invocación.
const propertyId = process.env.GA_PROPERTY_ID;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const raw_private_key = process.env.GOOGLE_PRIVATE_KEY;

// Función para validar que las variables existen.
function validateEnvVars() {
  if (!propertyId) {
    return 'La variable de entorno GA_PROPERTY_ID no está configurada.';
  }
  if (!client_email) {
    return 'La variable de entorno GOOGLE_CLIENT_EMAIL no está configurada.';
  }
  if (!raw_private_key) {
    return 'La variable de entorno GOOGLE_PRIVATE_KEY no está configurada. Asegúrate de copiarla y pegarla correctamente desde el archivo JSON.';
  }
  return null; // Todo está bien
}

// Validar al inicio. Si hay un error, la función handler lo devolverá.
const envValidationError = validateEnvVars();

// Solo procesar la clave si existe.
const private_key = raw_private_key ? raw_private_key.replace(/\\n/g, '\n') : null;

// --- Fin de la Validación ---

// Autenticación con Google
let analyticsDataClient;
if (!envValidationError) {
  const auth = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: 'https://www.googleapis.com/auth/analytics.readonly',
  });
  analyticsDataClient = new BetaAnalyticsDataClient({ auth });
}

// Función para formatear la respuesta de la API
const formatGAResponse = (response) => {
  const result = {};
  if (response && response.rows) {
    response.rows.forEach(row => {
      if (row.dimensionValues && row.metricValues) {
        result[row.dimensionValues[0].value] = row.metricValues[0].value;
      }
    });
  }
  return result;
};

const formatTopPagesResponse = (response) => {
  if (!response || !response.rows) return [];
  return response.rows.map(row => ({
    path: row.dimensionValues[0].value,
    name: row.dimensionValues[1].value,
    visits: row.metricValues[0].value
  }));
};

const formatDailyVisits = (response) => {
  if (!response || !response.rows) return [];
  return response.rows.map(row => ({
    // Formato YYYYMMDD -> YYYY-MM-DD
    date: `${row.dimensionValues[0].value.substring(0, 4)}-${row.dimensionValues[0].value.substring(4, 6)}-${row.dimensionValues[0].value.substring(6, 8)}`,
    visits: row.metricValues[0].value
  }));
};

exports.handler = async (event, context) => {
  // Si hubo un error de validación de variables de entorno, devolverlo inmediatamente.
  if (envValidationError) {
    console.error("Error de configuración:", envValidationError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error de configuración del servidor: ${envValidationError}` }),
    };
  }

  try {
    // Realizar todas las consultas a la API en paralelo
    const [totalVisitors, topPages, dailyVisits] = await Promise.all([
      // Consulta para el total de visitantes
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }],
      }),
      // Consulta para las páginas más visitadas
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' }
        ],
        metrics: [{ name: 'screenPageViews' }],
        limit: 5,
        orderBys: [
          { metric: { metricName: 'screenPageViews' }, desc: true }
        ]
      }),
      // Consulta para visitas diarias
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      })
    ]);

    // Formatear respuestas
    const formattedResponse = {
      totalVisitors: formatGAResponse(totalVisitors[0]),
      topPages: formatTopPagesResponse(topPages[0]),
      dailyVisits: formatDailyVisits(dailyVisits[0])
    };

    return {
      statusCode: 200,
      body: JSON.stringify(formattedResponse)
    };
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    // Devolver un error más específico si es posible
    const errorMessage = error.details || 'Failed to fetch analytics data.';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error al contactar la API de Google: ${errorMessage}` }),
    };
  }
};

