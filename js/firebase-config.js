import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- CONFIGURACIÓN DE FIREBASE ---
// **IMPORTANTE**: Reemplaza este objeto con las credenciales de tu proyecto de Firebase.
// Puedes encontrarlas en:
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

// Exportar la autenticación para usarla en otros archivos
export { auth };