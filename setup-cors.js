// Configurar CORS usando Google Cloud Storage
const { Storage } = require('@google-cloud/storage');

// Crear cliente de Storage
const storage = new Storage({
  projectId: 'portal-institucional-185ec'
});

const bucketName = 'portal-institucional-185ec.firebasestorage.app';
const bucket = storage.bucket(bucketName);

// Configuración CORS
const corsConfiguration = [
  {
    origin: [
      "http://127.0.0.1:5524",
      "http://localhost:5524", 
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
      "https://localhost:3000",
      "https://www.hdsa.gov.co",
      "https://hdsa.gov.co",
      "https://pagina-estadisticas-pqrs.netlify.app"
    ],
    method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    responseHeader: ["Content-Type", "Authorization", "x-goog-resumable", "X-Requested-With", "X-HTTP-Method-Override"],
    maxAgeSeconds: 3600
  }
];

// Aplicar configuración CORS
async function configureCors() {
  try {
    console.log('🔧 Configurando CORS en Firebase Storage...');
    
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configurado exitosamente');
    
    // Verificar configuración
    const currentCors = await bucket.getCorsConfiguration();
    console.log('📋 Configuración CORS actual:');
    console.log(JSON.stringify(currentCors, null, 2));
    
  } catch (error) {
    console.error('❌ Error al configurar CORS:', error.message);
    console.log('\n💡 Alternativa: Configura CORS manualmente en Firebase Console');
    console.log('1. Ve a: https://console.firebase.google.com');
    console.log('2. Selecciona tu proyecto: portal-institucional-185ec');
    console.log('3. Ve a Storage → Reglas');
    console.log('4. Agrega las reglas CORS manualmente');
  }
}

configureCors();
