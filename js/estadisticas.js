document.addEventListener('DOMContentLoaded', () => {
  loadAnalyticsData();
  initializeDateDisplay();
});

function initializeDateDisplay() {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const currentMonthEl = document.getElementById('currentMonth');
  const currentYearEl = document.getElementById('currentYear');
  
  if (currentMonthEl) currentMonthEl.textContent = months[now.getMonth()];
  if (currentYearEl) currentYearEl.textContent = now.getFullYear();
}

async function loadAnalyticsData() {
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('errorMessage');
  const lastUpdateDiv = document.getElementById('lastUpdate');

  try {
    loadingDiv.classList.remove('d-none');
    errorDiv.classList.add('d-none');

    const response = await fetch('/.netlify/functions/get-analytics');
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.statusText}`);
    }
    const stats = await response.json();

    // Poblar los datos en la página
    populateDashboard(stats);

    // Actualizar fecha de última carga
    if (lastUpdateDiv && stats.lastUpdate) {
      lastUpdateDiv.textContent = `Datos actualizados el: ${new Date(stats.lastUpdate).toLocaleString('es-CO')}`;
    }

  } catch (error) {
    console.error('Error al cargar las estadísticas:', error);
    if (errorDiv) {
      errorDiv.textContent = 'No se pudieron cargar las estadísticas. Por favor, intente más tarde.';
      errorDiv.classList.remove('d-none');
    }
  } finally {
    if (loadingDiv) {
      loadingDiv.classList.add('d-none');
    }
  }
}

function populateDashboard(stats) {
  const formatNumber = (num) => parseInt(num).toLocaleString('es-CO');

  // Tarjetas principales
  document.getElementById('totalVisits').textContent = formatNumber(stats.totalVisits);
  document.getElementById('monthlyVisits').textContent = formatNumber(stats.monthlyVisits);

  // Lista de páginas más visitadas
  const topPagesList = document.getElementById('topPagesList');
  topPagesList.innerHTML = stats.topPages.map(page => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <a href="${page.path}" target="_blank" class="text-decoration-none text-dark small" title="${page.path}">
        ${page.name || page.path}
      </a>
      <span class="badge bg-light text-dark">${formatNumber(page.visits)}</span>
    </div>
  `).join('');

  // Renderizar gráficos
  renderVisitsChart(stats.dailyVisits);
  renderDevicesChart(stats.devices);
  renderBrowsersChart(stats.browsers);
}

function renderVisitsChart(dailyVisits) {
  const ctx = document.getElementById('visitsChart').getContext('2d');
  const labels = dailyVisits.map(item => new Date(item.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }));
  const data = dailyVisits.map(item => item.visits);

  if (window.visitsChartInstance) window.visitsChartInstance.destroy();
  window.visitsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Usuarios',
        data: data,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderDevicesChart(devices) {
  const ctx = document.getElementById('devicesChart').getContext('2d');
  const labels = Object.keys(devices).map(label => label.charAt(0).toUpperCase() + label.slice(1)); // Capitalize
  const data = Object.values(devices);

  if (window.devicesChartInstance) window.devicesChartInstance.destroy();
  window.devicesChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#0d6efd', '#198754', '#ffc107'],
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderBrowsersChart(browsers) {
  const ctx = document.getElementById('browsersChart').getContext('2d');
  // Limitar a los 5 navegadores principales
  const topBrowsers = Object.entries(browsers)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5);

  const labels = topBrowsers.map(([key]) => key);
  const data = topBrowsers.map(([, value]) => value);

  if (window.browsersChartInstance) window.browsersChartInstance.destroy();
  window.browsersChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Usuarios',
        data: data,
        backgroundColor: ['#0dcaf0', '#6f42c1', '#d63384', '#fd7e14', '#20c997'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } }
    }
  });
}