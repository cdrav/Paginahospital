// Script para configurar CORS usando Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'portal-institucional-185ec.firebasestorage.app'
});

const bucket = admin.storage().bucket();

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
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configurado exitosamente en Firebase Storage');
    
    // Verificar configuración
    const currentCors = await bucket.getCorsConfiguration();
    console.log('📋 Configuración CORS actual:', JSON.stringify(currentCors, null, 2));
    
  } catch (error) {
    console.error('❌ Error al configurar CORS:', error);
  }
}

configureCors();
