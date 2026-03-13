const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

// Generar certificados SSL auto-firmados
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const app = express();
const PORT = 3000;

// Configuración CORS para permitir todo en desarrollo
app.use(cors({
    origin: ['https://localhost:3000', 'http://localhost:3000', 'https://hdsa.gov.co', 'https://www.hdsa.gov.co'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Middleware para manejar preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.send(204);
});

// Servir archivos estáticos
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas específicas para el portal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/citas-medicas-online.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'citas-medicas-online.html'));
});

app.get('/portal-institucional.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'portal-institucional.html'));
});

app.get('/login-institucional.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-institucional.html'));
});

// Servir archivos CSS y JS
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// API de prueba para simular respuestas
app.post('/api/test-upload', (req, res) => {
    console.log('📁 Test upload recibido:', req.body);
    res.json({
        success: true,
        message: 'Upload simulado exitoso',
        data: req.body
    });
});

// Middleware para logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Crear servidor HTTPS
const https = require('https');
const server = https.createServer({
    key: pems.private,
    cert: pems.cert
}, app);

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`
🚀🏥 SERVIDOR LOCAL HOSPITAL HDSA 🏥🚀

📍 URL Principal: https://localhost:${PORT}
🔒 HTTPS activado con certificado auto-firmado
📂 Serviendo archivos desde: ${__dirname}

📋 Páginas disponibles:
• https://localhost:${PORT}/ - Página principal
• https://localhost:${PORT}/citas-medicas-online.html - Formulario de citas
• https://localhost:${PORT}/portal-institucional.html - Portal administrativo
• https://localhost:${PORT}/login-institucional.html - Login administrativo

🔧 Características:
• ✅ CORS configurado para desarrollo
• ✅ Archivos estáticos servidos
• ✅ Logging de peticiones
• ✅ Manejo de errores
• ✅ API de prueba

⚠️  NOTA: Acepta la advertencia de seguridad del navegador para continuar

🛑 Para detener: Ctrl + C
    `);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Apagando servidor...');
    server.close(() => {
        console.log('✅ Servidor detenido');
        process.exit(0);
    });
});

module.exports = app;
