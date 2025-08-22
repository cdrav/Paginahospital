const fs = require('fs');
const path = require('path');

// Lista de archivos HTML en la carpeta participa
const files = [
  'colaboracion_innovacion_abierta.html',
  'consulta_ciudadana.html',
  'control_social.html',
  'planeacion_presupuesto_participativo.html',
  'rendicion_de_cuentas.html'
];

// Plantilla para los scripts
const scriptsTemplate = `    <!-- Scripts optimizados -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // Cargar scripts en el orden correcto
      function loadScripts() {
        const scripts = [
          '../js/utils.js',
          '../js/layout.js',
          '../js/navbar.js',
          '../js/accesibilidad.js',
          '../js/accessibility-styles.js',
          '../js/busqueda.js',
          '../js/main.js',
          '../js/breadcrumb.js'
        ];
        
        function loadScript(index) {
          if (index >= scripts.length) return;
          
          const script = document.createElement('script');
          script.src = scripts[index];
          script.onload = function() {
            loadScript(index + 1);
          };
          script.onerror = function() {
            console.error('Error al cargar el script:', scripts[index]);
            loadScript(index + 1);
          };
          document.body.appendChild(script);
        }
        
        loadScript(0);
      }
      
      // Iniciar carga de scripts cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadScripts);
      } else {
        loadScripts();
      }
    </script>`;

// Plantilla para los estilos
const stylesTemplate = `    <!-- Hojas de estilos -->
    <link rel="stylesheet" href="../css/site.css" />
    <link rel="stylesheet" href="../css/accesibilidad.css" />
    <link rel="stylesheet" href="../css/accessibility-buttons.css" />
    <link rel="stylesheet" href="../css/formularios.css" />`;

// Función para procesar cada archivo
function processFile(filename) {
  const filePath = path.join(__dirname, 'participa', filename);
  
  try {
    // Leer el contenido del archivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Reemplazar los estilos
    const stylesRegex = /<!-- Hojas de estilos -->[\s\S]*?<\/head>/m;
    content = content.replace(stylesRegex, stylesTemplate + '\n  </head>');
    
    // 2. Reemplazar los scripts
    const scriptsRegex = /<!-- Scripts[\s\S]*?<\/body>/m;
    content = content.replace(scriptsRegex, scriptsTemplate + '\n  </body>');
    
    // Guardar los cambios
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filename} actualizado correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al procesar ${filename}:`, error.message);
    return false;
  }
}

// Procesar todos los archivos
console.log('🚀 Iniciando corrección de archivos en la carpeta participa...\n');

files.forEach((file, index) => {
  console.log(`🔄 Procesando ${file} (${index + 1}/${files.length})...`);
  processFile(file);
});

console.log('\n✅ Proceso completado. Se han actualizado los archivos.');
