import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

// Protección de ruta: Firebase verifica si hay usuario activo
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Si no hay usuario, mandar al login
        window.location.href = 'login-institucional.html';
    } else {
        console.log("Usuario autenticado:", user.email);
        
        // Mostrar mensaje de bienvenida
        const welcomeElement = document.getElementById('user-welcome');
        if (welcomeElement) welcomeElement.textContent = `Hola, ${user.email}`;

        // Lógica de Administrador: Mostrar tarjeta de gestión solo a coord.sistemas
        if (user.email && user.email.toLowerCase() === 'coord.sistemas@hdsa.gov.co') {
            const adminCard = document.getElementById('admin-card');
            const firebaseCard = document.getElementById('firebase-card');
            
            if (adminCard) adminCard.classList.remove('d-none');
            if (firebaseCard) firebaseCard.classList.remove('d-none');
        }
    }
});

// Lógica de la página
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login-institucional.html';
            });
        });
    }
});