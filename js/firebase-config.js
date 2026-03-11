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

// Exportar la autenticación para usarla en otros archivos
export { auth, db, storage };