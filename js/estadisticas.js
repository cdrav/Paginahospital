// URL de la función de Netlify
const NETLIFY_FUNCTION_URL = 'https://aesthetic-hotteok-de9d99.netlify.app/.netlify/functions/get-analytics';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('errorMessage');
  const lastUpdateEl = document.getElementById('lastUpdate');

  // Elementos para las estadísticas
  const totalVisitsEl = document.getElementById('totalVisits');
  const monthlyVisitsEl = document.getElementById('monthlyVisits');
  const topPagesListEl = document.getElementById('topPagesList');
  const currentMonthEl = document.getElementById('currentMonth');
  const currentYearEl = document.getElementById('currentYear');

  // Contextos de los gráficos
  const visitsChartCtx = document.getElementById('visitsChart')?.getContext('2d');
  const devicesChartCtx = document.getElementById('devicesChart')?.getContext('2d');
  const browsersChartCtx = document.getElementById('browsersChart')?.getContext('2d');
  const monthlyTrendChartCtx = document.getElementById('monthlyTrendChart')?.getContext('2d');

  // Instancias de los gráficos
  let charts = {};
  
  // Datos de ejemplo (se reemplazarán con datos reales de la API)
  let analyticsData = {
    totalVisits: 0,
    monthlyVisits: 0,
    dailyVisits: [],
    devices: {},
    browsers: {},
    topPages: [],
    monthlyTrend: []
  };

  // Función para mostrar errores
  const showError = (message) => {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) {
      errorEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> ${message}`;
      errorEl.classList.remove('d-none');
    }
  };
  
  // Función para formatear números
  const formatNumber = (num) => {
    // Asegurarse de que el valor sea un número
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    // Verificar si el número es válido
    if (isNaN(number)) return '0';
    return number.toLocaleString('es-CO');
  };

  // Función para renderizar la lista de páginas más visitadas
  const renderTopPages = (pages) => {
    if (!topPagesListEl) return;
    
    // Verificar si no hay páginas o si es un array vacío
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      topPagesListEl.innerHTML = '<div class="alert alert-light text-center p-2">No hay datos de páginas más visitadas.</div>';
      return;
    }

    // Tomar solo las primeras 5 páginas para mostrar
    const topFivePages = pages.slice(0, 5);
    
    const listHtml = topFivePages.map(page => {
      // Asegurarse de que la página tenga los campos necesarios
      if (!page || !page.path || !page.title) return '';
      
      const pageUrl = page.path.startsWith('/') ? page.path : `/${page.path}`;
      // Usar views si está disponible, de lo contrario usar visits
      const visits = page.views || page.visits || 0;
      
      return `
      <a href="${pageUrl}" target="_blank" rel="noopener" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2">
        <span class="text-truncate" title="${page.title}">
          ${page.title}
        </span>
        <span class="badge bg-info-subtle text-info-emphasis rounded-pill">${formatNumber(visits)}</span>
      </a>
    `;
    }).filter(Boolean).join(''); // Filtrar elementos vacíos

    topPagesListEl.innerHTML = `<div class="list-group list-group-flush">${listHtml}</div>`;
  };

  // Función para destruir un gráfico existente
  const destroyChart = (chartId) => {
    if (charts[chartId]) {
      charts[chartId].destroy();
    }
  };

  // Función para formatear fechas en formato YYYYMMDD a fecha legible
  const formatChartDate = (dateStr) => {
    try {
      // Si la fecha ya está en formato ISO o similar, usarla directamente
      if (dateStr.includes('-') || dateStr.includes('/')) {
        return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      }
      
      // Si la fecha está en formato YYYYMMDD (ej: 20251001)
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // Los meses en JS van de 0 a 11
        const day = dateStr.substring(6, 8);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      }
      
      return dateStr; // Devolver el valor original si no coincide con ningún formato conocido
    } catch (e) {
      console.error('Error al formatear fecha:', dateStr, e);
      return dateStr; // Devolver el valor original en caso de error
    }
  };

  // Función para renderizar el gráfico de visitas diarias
  const renderVisitsChart = (dailyVisits) => {
    if (!visitsChartCtx || !dailyVisits || dailyVisits.length === 0) {
      console.error('No hay datos de visitas diarias o el contexto del gráfico no está disponible');
      return;
    }
    
    // Ordenar las fechas en orden ascendente
    const sortedVisits = [...dailyVisits].sort((a, b) => {
      return (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0);
    });
    
    // Filtrar solo los últimos 3 meses (septiembre a noviembre 2025)
    const filteredVisits = sortedVisits.filter(item => {
      if (!item.date) return false;
      const dateStr = item.date.toString();
      // Filtrar solo fechas de septiembre (09), octubre (10) y noviembre (11) de 2025
      return dateStr.startsWith('202509') || 
             dateStr.startsWith('202510') || 
             dateStr.startsWith('202511');
    });

    destroyChart('visitsChart');
    charts.visitsChart = new Chart(visitsChartCtx, {
      type: 'line',
      data: {
        labels: filteredVisits.map(item => formatChartDate(item.date)),
        datasets: [{
          label: 'Visitas diarias',
          data: filteredVisits.map(item => item.visits || 0),
          borderColor: '#069681',
          backgroundColor: 'rgba(6, 150, 129, 0.1)',
          fill: true,
          tension: 0.3,
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Número de visitas'
            },
            beginAtZero: true
          }
        }
      }
    });
  };

  // Función para renderizar el gráfico de dispositivos
  const renderDevicesChart = (devices) => {
    if (!devicesChartCtx) return;
    destroyChart('devicesChart');
    charts.devicesChart = new Chart(devicesChartCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(devices),
        datasets: [{
          data: Object.values(devices),
          backgroundColor: ['#069681', '#17a2b8', '#ffc107'],
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  // Función para renderizar el gráfico de navegadores
  const renderBrowsersChart = (browsers) => {
    if (!browsersChartCtx) return;
    destroyChart('browsersChart');
    charts.browsersChart = new Chart(browsersChartCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(browsers),
        datasets: [{
          data: Object.values(browsers),
          backgroundColor: ['#069681', '#17a2b8', '#ffc107', '#dc3545', '#6c757d', '#f8f9fa'],
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  // Función para formatear el período mensual
  const formatMonthlyPeriod = (period) => {
    if (!period) return '';
    
    // Si el período ya está formateado (ej: "sept 2025"), convertirlo a mayúscula la primera letra
    if (typeof period === 'string' && period.match(/^[a-z]{3,9} \d{4}$/i)) {
      return period.charAt(0).toUpperCase() + period.slice(1);
    }
    
    // Si es una fecha en formato YYYY-MM o similar
    if (typeof period === 'string' && period.match(/^\d{4}-\d{1,2}/)) {
      const [year, month] = period.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
    }
    
    // Si no reconocemos el formato, devolver el valor original
    return period;
  };

  // Función para renderizar el gráfico de tendencia mensual
  const renderMonthlyTrendChart = (monthlyTrend) => {
    if (!monthlyTrendChartCtx) return;
    
    // Ordenar los meses cronológicamente
    const sortedTrend = [...(monthlyTrend || [])].sort((a, b) => {
      return (a.period || '').localeCompare(b.period || '') || 
             (a.date || '').localeCompare(b.date || '');
    });
    
    // Filtrar solo los últimos 3 meses (septiembre a noviembre 2025)
    const filteredTrend = sortedTrend.filter(item => {
      const period = (item.period || '').toLowerCase();
      return period.includes('sept 2025') || 
             period.includes('oct 2025') || 
             period.includes('nov 2025') ||
             (item.date && (
               item.date.toString().includes('2025-09') ||
               item.date.toString().includes('2025-10') ||
               item.date.toString().includes('2025-11')
             ));
    });

    // Si no hay datos, mostrar un mensaje
    if (filteredTrend.length === 0) {
      console.warn('No hay datos de tendencia mensual para mostrar');
      return;
    }

    destroyChart('monthlyTrendChart');
    charts.monthlyTrendChart = new Chart(monthlyTrendChartCtx, {
      type: 'bar',
      data: {
        labels: filteredTrend.map(item => 
          formatMonthlyPeriod(item.period) || 
          (item.date ? formatMonthlyPeriod(item.date) : '')
        ),
        datasets: [{
          label: 'Visitas mensuales',
          data: filteredTrend.map(item => item.visits || 0),
          backgroundColor: 'rgba(6, 150, 129, 0.7)',
          borderColor: '#069681',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de visitas'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Mes'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Visitas: ${context.raw.toLocaleString('es-CO')}`;
              }
            }
          }
        }
      }
    });
  };

  // Función para obtener datos de la función de Netlify
  async function fetchAnalyticsData() {
    try {
      console.log('Solicitando datos a:', NETLIFY_FUNCTION_URL);
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        // Añadimos credenciales 'same-origin' para asegurar que se envíen las cookies si es necesario
        credentials: 'same-origin'
      });

      console.log('Respuesta recibida, estado:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no podemos parsear el error como JSON, usamos el texto plano
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Datos recibidos de la API:', data);
      return data;
    } catch (error) {
      console.error('Error al obtener datos de estadísticas:', error);
      showError('No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo más tarde.');
      return null;
    }
  }

  // Función para procesar los datos de la API de Netlify
  function processAnalyticsData(apiData) {
    console.log('Datos recibidos de la API:', apiData);
    
    // Si no hay datos, devolver estructura vacía
    if (!apiData) {
      console.error('No se recibieron datos de la API');
      return analyticsData;
    }

    // Si la respuesta tiene un error, mostrarlo
    if (apiData.error) {
      console.error('Error en la respuesta de la API:', apiData.error);
      showError(apiData.error);
      return analyticsData;
    }

    // Función para procesar las páginas más visitadas
    const processTopPages = (pages) => {
      if (!Array.isArray(pages)) return [];
      
      return pages.map(page => {
        // Si el objeto page es una cadena o no tiene las propiedades esperadas, lo ignoramos
        if (typeof page !== 'object' || page === null) return null;
        
        // Asegurarse de que existan las propiedades necesarias
        return {
          path: page.path || '',
          title: page.title || 'Sin título',
          // Usar views o visits, convertir a número y asegurar que sea un número válido
          visits: Math.max(0, parseInt(page.views || page.visits || 0, 10)) || 0,
          views: Math.max(0, parseInt(page.views || page.visits || 0, 10)) || 0
        };
      }).filter(Boolean); // Eliminar elementos nulos o inválidos
    };

    // Si los datos vienen en el formato esperado (con data y success)
    if (apiData.success !== undefined && apiData.data) {
      return {
        totalVisits: parseInt(apiData.data.totalVisits) || 0,
        monthlyVisits: parseInt(apiData.data.monthlyVisits) || 0,
        dailyVisits: Array.isArray(apiData.data.dailyVisits) ? apiData.data.dailyVisits : [],
        devices: typeof apiData.data.devices === 'object' ? apiData.data.devices : {},
        browsers: typeof apiData.data.browsers === 'object' ? apiData.data.browsers : {},
        topPages: processTopPages(apiData.data.topPages),
        monthlyTrend: Array.isArray(apiData.data.monthlyTrend) ? apiData.data.monthlyTrend : [],
        lastUpdate: apiData.data.lastUpdate || new Date().toISOString()
      };
    }
    
    // Si los datos vienen directamente (sin el wrapper success/data)
    if (apiData.totalVisits !== undefined) {
      return {
        totalVisits: parseInt(apiData.totalVisits) || 0,
        monthlyVisits: parseInt(apiData.monthlyVisits) || 0,
        dailyVisits: Array.isArray(apiData.dailyVisits) ? apiData.dailyVisits : [],
        devices: typeof apiData.devices === 'object' ? apiData.devices : {},
        browsers: typeof apiData.browsers === 'object' ? apiData.browsers : {},
        topPages: processTopPages(apiData.topPages),
        monthlyTrend: Array.isArray(apiData.monthlyTrend) ? apiData.monthlyTrend : [],
        lastUpdate: apiData.lastUpdate || new Date().toISOString()
      };
    }

    // Si los datos vienen en formato de filas (formato GA4)
    if (apiData.rows) {
      const dailyVisits = apiData.rows.map(row => ({
        date: row.dimensionValues?.[0]?.value || '',
        visits: Math.max(0, parseInt(row.metricValues?.[0]?.value || 0, 10))
      }));

      return {
        totalVisits: Math.max(0, parseInt(apiData.totals?.[0]?.metricValues?.[0]?.value || 0, 10)),
        monthlyVisits: dailyVisits.reduce((sum, day) => sum + day.visits, 0),
        dailyVisits: dailyVisits,
        devices: {},
        browsers: {},
        topPages: [],
        monthlyTrend: [],
        lastUpdate: new Date().toISOString()
      };
    }

    console.error('Formato de datos no reconocido:', apiData);
    return analyticsData;
  }

  // Función principal para obtener y renderizar los datos
  const fetchAndRenderAnalytics = async () => {
    try {
      // Mostrar indicador de carga
      if (loadingEl) loadingEl.classList.remove('d-none');
      if (errorEl) errorEl.classList.add('d-none');
      
      // Obtener datos de la función de Netlify
      const responseData = await fetchAnalyticsData();
      
      // Procesar los datos para mostrarlos en la interfaz
      const data = processAnalyticsData(responseData);

      // Ocultar carga y mostrar fecha de actualización
      if (loadingEl) loadingEl.classList.add('d-none');
      if (lastUpdateEl) {
        lastUpdateEl.textContent = `Actualizado: ${new Date().toLocaleString('es-CO')}`;
      }

      // Actualizar la interfaz con los datos
      if (totalVisitsEl) totalVisitsEl.textContent = formatNumber(data.totalVisits);
      if (monthlyVisitsEl) monthlyVisitsEl.textContent = formatNumber(data.monthlyVisits);
      
      const now = new Date();
      if (currentMonthEl) {
        const monthName = now.toLocaleString('es-CO', { month: 'long' });
        currentMonthEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      }
      if (currentYearEl) currentYearEl.textContent = now.getFullYear();

      // Renderizar las páginas más visitadas
      renderTopPages(data.topPages);

      // Renderizar los gráficos solo si hay datos
      if (data.dailyVisits && data.dailyVisits.length > 0) {
        renderVisitsChart(data.dailyVisits);
      }
      
      if (data.devices && Object.keys(data.devices).length > 0) {
        renderDevicesChart(data.devices);
      }
      
      if (data.browsers && Object.keys(data.browsers).length > 0) {
        renderBrowsersChart(data.browsers);
      }
      
      if (data.monthlyTrend && data.monthlyTrend.length > 0) {
        renderMonthlyTrendChart(data.monthlyTrend);
      }

    } catch (error) {
      console.error('Error al obtener datos de analíticas:', error);
      showError('No se pudieron cargar las estadísticas. Por favor, verifica tu conexión e inténtalo de nuevo.');
    }
  };

  // Iniciar la carga de datos
  fetchAndRenderAnalytics();
});