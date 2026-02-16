import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');

    // Verificar si ya hay sesión iniciada (Firebase lo recuerda automáticamente)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'portal-institucional.html';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (errorDiv) errorDiv.classList.add('d-none');

            // Firebase usa email, no usuario simple.
            // Si tus usuarios usan solo nombre, puedes añadirles @hdsa.gov.co automáticamente
            const username = usernameInput.value.trim();
            const email = username.includes('@') ? username : `${username}@hdsa.gov.co`;
            const password = passwordInput.value.trim();

            // Iniciar sesión con Firebase
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Éxito: La redirección la maneja el onAuthStateChanged de arriba o directa
                    window.location.href = 'portal-institucional.html';
                })
                .catch((error) => {
                    console.error("Error de login:", error.code, error.message);
                    if (errorDiv) {
                        errorDiv.textContent = "Usuario o contraseña incorrectos.";
                        errorDiv.classList.remove('d-none');
                    }
                });
        });
    }

    // --- Lógica de Recuperación de Contraseña ---
    const resetForm = document.getElementById('reset-password-form');
    const resetEmailInput = document.getElementById('reset-email');
    const resetMessage = document.getElementById('reset-message');

    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = resetEmailInput.value.trim();
            
            if (!email) return;

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    resetMessage.className = 'alert alert-success';
                    resetMessage.textContent = 'Enlace enviado. Revisa tu bandeja de entrada (y spam).';
                    resetMessage.classList.remove('d-none');
                    resetForm.reset();
                })
                .catch((error) => {
                    console.error("Error reset password:", error);
                    resetMessage.className = 'alert alert-danger';
                    resetMessage.textContent = 'No se pudo enviar el correo. Verifica que la dirección sea correcta.';
                    resetMessage.classList.remove('d-none');
                });
        });
    }
});