import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// --- CONFIGURACIÓN DE FIREBASE ---
// Consola de Firebase > Configuración del proyecto (⚙️) > General > Tus apps > App web
const firebaseConfig = {
  apiKey: "AIzaSyBz9WYmEV7Q2_QSY5YpFKvxmubvDVquiSQ",
  authDomain: "portal-institucional-185ec.firebaseapp.com",
  projectId: "portal-institucional-185ec",
  storageBucket: "portal-institucional-185ec.firebasestorage.app",
  messagingSenderId: "580573706657",
  appId: "1:580573706657:web:e48794fcdfe8bfe11bf3e0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- CONFIGURACIÓN PARA DESARROLLO LOCAL ---
// Detectar si estamos en localhost
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('127.0.0.1') ||
                   window.location.hostname.includes('localhost') ||
                   window.location.port === '8000' ||
                   window.location.protocol === 'file:';

console.log('🔍 Verificando entorno:', {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    href: window.location.href,
    isLocalhost: isLocalhost
});

if (isLocalhost) {
    console.log('🔧 Modo desarrollo local detectado - Usando simulación de Storage');
    
    // Crear un storage simulado para desarrollo local
    const mockStorage = {
        ref: (path) => {
            console.log(`📁 Mock Storage: Referencia a ${path}`);
            return {
                uploadBytes: async (file) => {
                    console.log(`📤 Mock Upload: Simulando subida de ${file.name}`);
                    // Simular delay de red
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Crear URL simulada
                    const mockUrl = `http://localhost:8000/mock-storage/${path}/${file.name}`;
                    console.log(`✅ Mock Upload: Archivo simulado en ${mockUrl}`);
                    
                    return {
                        ref: {
                            getDownloadURL: async () => {
                                await new Promise(resolve => setTimeout(resolve, 500));
                                return mockUrl;
                            }
                        }
                    };
                }
            };
        }
    };
    
    // Reemplazar el storage real con el simulado solo en localhost
    window.storage = mockStorage;
} else {
    console.log('🌐 Modo producción detectado - Usando Firebase Storage real');
    window.storage = storage;
}

// Exportar la autenticación para usarla en otros archivos
export { auth, db, storage };
