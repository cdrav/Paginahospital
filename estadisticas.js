document.addEventListener('DOMContentLoaded', () => {
  // URL de la función de Netlify para obtener datos de Google Analytics
  const API_URL = 'https://paginawebhospital.netlify.app/.netlify/functions/get-analytics';

  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('errorMessage');
  const mainContent = document.querySelector('main.py-5');

  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  function showLoading() {
    loadingEl.classList.remove('d-none');
    mainContent.classList.add('d-none');
    errorEl.classList.add('d-none');
  }

  function hideLoading() {
    loadingEl.classList.add('d-none');
    mainContent.classList.remove('d-none');
  }

  function showError(message) {
    loadingEl.classList.add('d-none');
    errorEl.textContent = `Error: ${message}`;
    errorEl.classList.remove('d-none');
  }

  async function fetchData() {
    showLoading();
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `El servidor respondió con un estado ${response.status}`);
      }
      const data = await response.json();
      renderData(data);
      hideLoading();
    } catch (error) {
      console.error('Error al obtener datos de analíticas:', error);
      showError(error.message);
    }
  }

  function renderData(data) {
    // Actualizar KPIs
    document.getElementById('totalVisits').textContent = data.totalVisits.toLocaleString('es-CO');
    document.getElementById('monthlyVisits').textContent = data.monthlyVisits.toLocaleString('es-CO');
    const now = new Date();
    document.getElementById('currentMonth').textContent = now.toLocaleString('es-CO', { month: 'long' });
    document.getElementById('currentYear').textContent = now.getFullYear();
    document.getElementById('lastUpdate').textContent = `Actualizado: ${new Date(data.lastUpdate).toLocaleString('es-CO')}`;

    // Renderizar Top Pages
    const topPagesList = document.getElementById('topPagesList');
    topPagesList.innerHTML = data.topPages.map(page => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="text-truncate" title="${page.title}">${page.title}</span>
        <span class="badge bg-light text-dark">${page.visits.toLocaleString('es-CO')}</span>
      </div>
    `).join('');

    // Renderizar Gráficos
    renderVisitsChart(data.dailyVisits);
    renderDevicesChart(data.devices);
    renderBrowsersChart(data.browsers);
    renderMonthlyTrendChart(data.monthlyTrend);
  }

  function renderVisitsChart(dailyVisits) {
    const ctx = document.getElementById('visitsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dailyVisits.map(item => item.date),
        datasets: [{
          label: 'Visitas',
          data: dailyVisits.map(item => item.visits),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        }],
      },
      options: chartConfig,
    });
  }

  function renderDevicesChart(devices) {
    const ctx = document.getElementById('devicesChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(devices),
        datasets: [{
          data: Object.values(devices),
          backgroundColor: ['#0d6efd', '#198754', '#ffc107'],
          borderWidth: 2,
        }],
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 10 }
            }
          },
        },
      },
    });
  }

  function renderBrowsersChart(browsers) {
    const ctx = document.getElementById('browsersChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(browsers),
        datasets: [{
          data: Object.values(browsers),
          backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d', '#0dcaf0'],
          borderWidth: 2,
        }],
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 10 }
            }
          },
        },
      },
    });
  }

  function renderMonthlyTrendChart(monthlyTrend) {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyTrend.map(item => {
          const [year, month] = item.date.split('-');
          return new Date(year, month - 1).toLocaleString('es-CO', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Visitas Mensuales',
          data: monthlyTrend.map(item => item.visits),
          backgroundColor: 'rgba(25, 135, 84, 0.7)',
          borderColor: '#198754',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        ...chartConfig,
        scales: {
          ...chartConfig.scales,
          x: {
            ...chartConfig.scales.x,
            grid: { display: false }
          }
        },
        plugins: {
          ...chartConfig.plugins,
          legend: { display: false }
        }
      },
    });
  }

  fetchData();
});
