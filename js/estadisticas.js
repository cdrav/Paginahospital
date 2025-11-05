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
  const formatNumber = (num) => num.toLocaleString('es-CO');

  // Función para renderizar la lista de páginas más visitadas
  const renderTopPages = (pages) => {
    if (!topPagesListEl || !pages || pages.length === 0) {
      if (topPagesListEl) {
        topPagesListEl.innerHTML = '<div class="alert alert-light text-center p-2">No hay datos de páginas más visitadas.</div>';
      }
      return;
    }

    const listHtml = pages.map(page => {
      const pageUrl = page.path.startsWith('/') ? page.path : `/${page.path}`;
      
      return `
      <a href="${pageUrl}" target="_blank" rel="noopener" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2">
        <span class="text-truncate" title="${page.title}">
          ${page.title}
        </span>
        <span class="badge bg-info-subtle text-info-emphasis rounded-pill">${formatNumber(page.visits)}</span>
      </a>
    `;
    }).join('');

    topPagesListEl.innerHTML = `<div class="list-group list-group-flush">${listHtml}</div>`;
  };

  // Función para destruir un gráfico existente
  const destroyChart = (chartId) => {
    if (charts[chartId]) {
      charts[chartId].destroy();
    }
  };

  // Función para renderizar el gráfico de visitas diarias
  const renderVisitsChart = (dailyVisits) => {
    if (!visitsChartCtx) return;
    destroyChart('visitsChart');
    charts.visitsChart = new Chart(visitsChartCtx, {
      type: 'line',
      data: {
        labels: dailyVisits.map(item => new Date(item.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })),
        datasets: [{
          label: 'Visitas diarias',
          data: dailyVisits.map(item => item.visits),
          borderColor: '#069681',
          backgroundColor: 'rgba(6, 150, 129, 0.1)',
          fill: true,
          tension: 0.3,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
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

  // Función para renderizar el gráfico de tendencia mensual
  const renderMonthlyTrendChart = (monthlyTrend) => {
    if (!monthlyTrendChartCtx) return;
    destroyChart('monthlyTrendChart');
    charts.monthlyTrendChart = new Chart(monthlyTrendChartCtx, {
      type: 'bar',
      data: {
        labels: monthlyTrend.map(item => new Date(item.date + '-02').toLocaleString('es-CO', { month: 'long', year: 'numeric' })),
        datasets: [{
          label: 'Visitas mensuales',
          data: monthlyTrend.map(item => item.visits),
          backgroundColor: 'rgba(6, 150, 129, 0.7)',
          borderColor: '#069681',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  };

  // Función para obtener datos de la función de Netlify
  async function fetchAnalyticsData() {
    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener datos de estadísticas');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener datos de estadísticas:', error);
      showError('No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo más tarde.');
      return null;
    }
  }

  // Función para procesar los datos de la API de Netlify
  function processAnalyticsData(apiData) {
    if (!apiData || !apiData.success) {
      console.error('Datos de API no válidos:', apiData);
      return analyticsData; // Devolver datos vacíos si no hay datos
    }

    // Los datos ya vienen formateados de la función de Netlify
    const {
      totalVisits = 0,
      monthlyVisits = 0,
      dailyVisits = [],
      devices = {},
      browsers = {},
      topPages = [],
      monthlyTrend = []
    } = apiData.data || {};

    // Si no hay visitas diarias pero sí hay datos en la respuesta, intentar formatearlos
    if (dailyVisits.length === 0 && apiData.data) {
      // Intenta extraer datos de la respuesta de la API
      if (apiData.data.rows) {
        // Formato de respuesta de GA4
        return {
          totalVisits: apiData.data.totals?.[0]?.metricValues?.[0]?.value || 0,
          monthlyVisits: 0, // Se calcula abajo
          dailyVisits: apiData.data.rows.map(row => ({
            date: row.dimensionValues?.[0]?.value || '',
            visits: parseInt(row.metricValues?.[0]?.value || 0)
          })),
          devices: {},
          browsers: {},
          topPages: [],
          monthlyTrend: []
        };
      }
    }

    // Si los datos vienen directamente de la API de GA4 sin procesar
    if (apiData.rows) {
      const dailyVisits = apiData.rows.map(row => ({
        date: row.dimensionValues?.[0]?.value || '',
        visits: parseInt(row.metricValues?.[0]?.value || 0)
      }));

      return {
        totalVisits: apiData.totals?.[0]?.metricValues?.[0]?.value || 0,
        monthlyVisits: dailyVisits.reduce((sum, day) => sum + day.visits, 0),
        dailyVisits,
        devices: {},
        browsers: {},
        topPages: [],
        monthlyTrend: [],
        lastUpdate: new Date().toISOString()
      };
    }

    // Si los datos ya vienen procesados de la función de Netlify
    return {
      totalVisits: apiData.data?.totalVisits || 0,
      monthlyVisits: apiData.data?.monthlyVisits || 0,
      dailyVisits: apiData.data?.dailyVisits || [],
      devices: apiData.data?.devices || {},
      browsers: apiData.data?.browsers || {},
      topPages: apiData.data?.topPages || [],
      monthlyTrend: apiData.data?.monthlyTrend || [],
      lastUpdate: new Date().toISOString()
    };
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