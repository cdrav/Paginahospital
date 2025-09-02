// Configuración de la API de Google Analytics 4
const GA_PROPERTY_ID = 'G-78BE6ZZGWW';
const CLIENT_ID = '267316066415-8j1jnack4742lg45nbkgkirquetq9ohd.apps.googleusercontent.com'; // Reemplaza con tu Client ID de OAuth 2.0
const API_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const DISCOVERY_DOC = 'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Objeto para manejar el estado de la interfaz de usuario
const ui = {
    authorizeBtn: null,
    updateBtn: null,
    signoutBtn: null,
    loadingIndicator: null,
    userInfo: null,
    
    init() {
        this.authorizeBtn = document.getElementById('authorize_button');
        this.updateBtn = document.getElementById('updateStatsBtn');
        this.signoutBtn = document.getElementById('signout_button');
        this.loadingIndicator = document.getElementById('loading');
        this.userInfo = document.getElementById('userInfo');

        this.authorizeBtn.addEventListener('click', handleAuthClick);
        this.updateBtn.addEventListener('click', updateStats);
        this.signoutBtn.addEventListener('click', handleSignoutClick);
    },

    setState(state, message = '') {
        // Estados: 'unauthenticated', 'authenticating', 'authenticated', 'updating'
        this.authorizeBtn.classList.toggle('d-none', state !== 'unauthenticated' && state !== 'authenticating');
        this.updateBtn.classList.toggle('d-none', state !== 'authenticated' && state !== 'updating');
        this.signoutBtn.classList.toggle('d-none', state !== 'authenticated' && state !== 'updating');
        this.userInfo.classList.toggle('d-none', state === 'unauthenticated');
        this.loadingIndicator.classList.toggle('d-none', state !== 'updating');

        this.authorizeBtn.disabled = (state === 'authenticating');
        this.authorizeBtn.innerHTML = (state === 'authenticating') ? '<span class="spinner-border spinner-border-sm me-2"></span>Autorizando...' : '<i class="fas fa-sign-in-alt me-2"></i>Iniciar sesión con Google';

        this.updateBtn.disabled = (state === 'updating');
        this.updateBtn.innerHTML = (state === 'updating') ? '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...' : '<i class="fas fa-sync-alt me-2"></i>Actualizar';

        this.userInfo.textContent = message;
    }
};

// Función para formatear números
function formatNumber(num) {
    return new Intl.NumberFormat('es-CO').format(num);
}

// Función para formatear porcentajes
function formatPercent(num) {
    return new Intl.NumberFormat('es-CO', { 
        style: 'percent', 
        minimumFractionDigits: 1,
        maximumFractionDigits: 1 
    }).format(num);
}

// Función para formatear duración
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min`;
}

// Función auxiliar para traducir categorías de dispositivos
function translateDeviceCategory(category) {
    const translations = {
        'desktop': 'Escritorio',
        'mobile': 'Móvil',
        'tablet': 'Tableta'
    };
    return translations[category.toLowerCase()] || category;
}
// Función para actualizar las estadísticas
let isUpdating = false;

async function updateStats() {
    // Evitar múltiples ejecuciones simultáneas
    if (isUpdating) return;
    
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    try {
        isUpdating = true;
        ui.setState('updating', ui.userInfo.textContent);

        // Actualizar marca de tiempo
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        };
        
        lastUpdateElement.textContent = `Última actualización: ${now.toLocaleDateString('es-ES', options)}`;

        // Obtener datos de la API
        const stats = await fetchAnalyticsData();
        
        // Actualizar la interfaz de usuario
        updateDashboardUI(stats);
        
    } catch (error) {
        console.error('Error en updateStats:', error);
        showError('No se pudieron cargar las estadísticas. Por favor, intente de nuevo.');
    } finally {
        isUpdating = false;
        const token = gapi.client.getToken();
        if (token) {
            const userInfo = await gapi.client.oauth2.userinfo.get();
            ui.setState('authenticated', `Sesión iniciada: ${userInfo.result.email}`);
        } else {
            ui.setState('unauthenticated');
        }
    }
}

// Función auxiliar para actualizar la interfaz con los datos
function updateDashboardUI(stats) {
    if (!stats) return;
    
    // Actualizar contadores
    const totalVisitsElement = document.getElementById('totalVisits');
    const monthlyVisitsElement = document.getElementById('monthlyVisits');
    
    if (totalVisitsElement) totalVisitsElement.textContent = formatNumber(stats.totalVisits || 0);
    if (monthlyVisitsElement) monthlyVisitsElement.textContent = formatNumber(stats.monthlyVisits || 0);
    
    // Actualizar lista de páginas más visitadas
    const topPagesList = document.getElementById('topPagesList');
    if (topPagesList) {
        topPagesList.innerHTML = '';
        
        if (stats.topPages && stats.topPages.length > 0) {
            stats.topPages.forEach((page, index) => {
                if (page && page.title !== undefined) {
                    const item = document.createElement('div');
                    item.className = 'd-flex justify-content-between mb-2';
                    item.innerHTML = `
                        <span class="text-truncate me-2">${index + 1}. ${page.title}</span>
                        <span class="text-muted text-nowrap">${formatNumber(page.views || 0)}</span>
                    `;
                    topPagesList.appendChild(item);
                }
            });
        } else {
            topPagesList.innerHTML = '<div class="text-muted">No hay datos disponibles</div>';
        }
    }

    // --- Actualizar Gráficos ---

    // 1. Gráfico de visitas diarias
    if (visitsChart && stats.dailyVisitsData) {
        visitsChart.data.labels = stats.dailyVisitsData.labels;
        visitsChart.data.datasets[0].data = stats.dailyVisitsData.data;
        visitsChart.update();
    }

    // 2. Gráfico de dispositivos
    if (devicesChart && stats.devicesData && stats.devicesData.data.length > 0) {
        devicesChart.data.labels = stats.devicesData.labels;
        devicesChart.data.datasets[0].data = stats.devicesData.data;
        devicesChart.update();
    }

    // 3. Gráfico de navegadores
    if (browsersChart && stats.browsersData && stats.browsersData.data.length > 0) {
        browsersChart.data.labels = stats.browsersData.labels;
        browsersChart.data.datasets[0].data = stats.browsersData.data;
        browsersChart.update();
    }
}

// Función para mostrar errores
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
            errorElement.classList.add('d-none');
        }, 5000);
    } else {
        alert(message);
    }
}

// Función para obtener datos de la API de Google Analytics
async function fetchAnalyticsData() {
    try {
        // Ejecutar todas las peticiones en paralelo para mayor eficiencia
        const [
            totalVisits,
            monthlyVisits,
            topPages,
            dailyVisits,
            devices,
            browsers
        ] = await Promise.all([
        // 1. Obtener visitas totales
            fetchGAData({
                metrics: [{ name: 'totalUsers' }],
                dateRanges: [{
                    startDate: '2020-01-01', // Fecha de inicio de tu sitio web
                    endDate: 'today'
                }]
            }),
            // 2. Obtener visitas del mes actual
            fetchGAData({
                metrics: [{ name: 'sessions' }],
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }]
            }),
            // 3. Obtener páginas más visitadas
            fetchGAData({
                dimensions: [{ name: 'pageTitle' }],
                metrics: [{ name: 'screenPageViews' }],
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }],
                limit: 5,
                orderBys: [{
                    metric: { metricName: 'screenPageViews' },
                    desc: true
                }]
            }),
            // 4. Datos para el gráfico de visitas diarias
            fetchGAData({
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'sessions' }],
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }],
                orderBys: [{
                    dimension: { dimensionName: 'date' }
                }]
            }),
            // 5. Datos para el gráfico de dispositivos
            fetchGAData({
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'sessions' }],
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
            }),
            // 6. Datos para el gráfico de navegadores
            fetchGAData({
                dimensions: [{ name: 'browser' }],
                metrics: [{ name: 'sessions' }],
                dateRanges: [{
                    startDate: '30daysAgo',
                    endDate: 'today'
                }],
                limit: 5,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
            })
        ]);

        // Formatear fecha para el gráfico de visitas (YYYYMMDD -> DD/MM)
        const formatChartDate = (dateString) => {
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            return `${day}/${month}`;
        };

        return {
            totalVisits: totalVisits.rows?.[0]?.metricValues?.[0]?.value || 0,
            monthlyVisits: monthlyVisits.rows?.[0]?.metricValues?.[0]?.value || 0,
            topPages: topPages.rows?.map(row => ({
                title: row.dimensionValues?.[0]?.value || 'Sin título',
                views: parseInt(row.metricValues?.[0]?.value, 10) || 0
            })) || [],
            dailyVisitsData: {
                labels: dailyVisits.rows?.map(row => formatChartDate(row.dimensionValues[0].value)) || [],
                data: dailyVisits.rows?.map(row => parseInt(row.metricValues[0].value, 10)) || []
            },
            devicesData: {
                labels: devices.rows?.map(row => translateDeviceCategory(row.dimensionValues[0].value)) || [],
                data: devices.rows?.map(row => parseInt(row.metricValues[0].value, 10)) || []
            },
            browsersData: {
                labels: browsers.rows?.map(row => row.dimensionValues[0].value) || [],
                data: browsers.rows?.map(row => parseInt(row.metricValues[0].value, 10)) || []
            }
        };
    } catch (error) {
        console.error('Error al obtener datos de Analytics:', error);
        throw error;
    }
}

// Inicializa la API de Google Analytics
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({});
    // Cargar la API de OAuth2 para obtener info del usuario
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest');
    gapiInited = true;
    maybeEnableButtons();
}

// Inicializa el cliente de Google Identity Services
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: API_SCOPE,
        callback: tokenCallback, // Asignar el callback aquí
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        ui.setState('unauthenticated');
    }
}

// Función para autenticar y obtener token
function handleAuthClick() {
    ui.setState('authenticating');
    // Solicitar token
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Callback para manejar la respuesta del token
async function tokenCallback(resp) {
    if (resp.error !== undefined) {
        console.error('Error de autenticación:', resp.error);
        showError(`Error de autenticación: ${resp.error}. Intente de nuevo.`);
        ui.setState('unauthenticated');
        throw new Error(resp.error);
    }
    
    const userInfo = await gapi.client.oauth2.userinfo.get();
    ui.setState('authenticated', `Sesión iniciada: ${userInfo.result.email}`);
    await updateStats(); // Actualizar estadísticas inmediatamente después del login
}

// Función para cerrar sesión
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            ui.setState('unauthenticated');
            // Limpiar UI si es necesario
            document.getElementById('totalVisits').textContent = '-';
            document.getElementById('monthlyVisits').textContent = '-';
            document.getElementById('topPagesList').innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-muted" role="status"><span class="visually-hidden">Cargando...</span></div><span class="ms-2">Cargando datos...</span></div>';
            document.getElementById('lastUpdate').textContent = '';
            initCharts(); // Reinicia los gráficos a su estado inicial
        });
    }
}

// Función para hacer peticiones a la API de Google Analytics
async function fetchGAData(requestBody) {
    let response;
    try {
        response = await gapi.client.analyticsdata.properties.runReport({
            'property': `properties/${GA_PROPERTY_ID}`,
            'resource': requestBody
        });
        return response.result;
    } catch (err) {
        console.error('Error en la petición a la API:', err);
        throw new Error(err.result?.error?.message || 'Error en la petición a la API');
    }
}

// Inicializar gráficos
let visitsChart, devicesChart, browsersChart;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar las APIs necesarias
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => { gapiLoaded(); };
    document.head.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => { gisLoaded(); };
    document.head.appendChild(gisScript);

    // Inicializar UI y botones
    ui.init();
    // Inicializar gráficos con datos de ejemplo
    initCharts();
});

// Inicializar gráficos con Chart.js
function initCharts() {
    const ctx1 = document.getElementById('visitsChart').getContext('2d');
    const ctx2 = document.getElementById('devicesChart').getContext('2d');
    const ctx3 = document.getElementById('browsersChart').getContext('2d');
    
    // Configuración común para los gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 20
                }
            }
        }
    };
    
    // Gráfico de visitas
    visitsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Visitas',
                data: [],
                borderColor: '#164443',
                backgroundColor: 'rgba(22, 68, 67, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Gráfico de dispositivos
    devicesChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Móvil', 'Escritorio', 'Tablet'],
            datasets: [{
                data: [60, 35, 5],
                backgroundColor: [
                    '#164443',
                    '#1a9b94',
                    '#0f3332'
                ],
                borderWidth: 0
            }]
        },
        options: chartOptions
    });
    
    // Gráfico de navegadores
    browsersChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Otros'],
            datasets: [{
                data: [65, 15, 10, 5, 5],
                backgroundColor: [
                    '#164443',
                    '#1a9b94',
                    '#0f3332',
                    '#1d7a74',
                    '#2bb8b0'
                ],
                borderWidth: 0
            }]
        },
        options: chartOptions
    });
}
