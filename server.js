const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración del servidor HTTPS local
const options = {
  key: fs.readFileSync('cert.key'),
  cert: fs.readFileSync('cert.crt')
};

const server = https.createServer(options, (req, res) => {
  // Obtener la ruta del archivo solicitado
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Obtener la extensión del archivo para el Content-Type
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Leer el archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Archivo no encontrado
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        // Error del servidor
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Respuesta exitosa
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
const HOST = 'https://localhost:3000';

server.listen(PORT, () => {
  console.log('🚀 Servidor HTTPS local iniciado');
  console.log(`📱 Abre tu navegador en: ${HOST}`);
  console.log('🔒 Certificado SSL local activado - Sin problemas de CORS');
  console.log('⚠️  Acepta el certificado autofirmado en tu navegador');
  console.log('\n📋 Acceso directo a las páginas:');
  console.log(`   🏠 Inicio: ${HOST}`);
  console.log(`   📅 Citas Online: ${HOST}/citas-medicas-online.html`);
  console.log(`   🔐 Portal Institucional: ${HOST}/portal-institucional.html`);
});
