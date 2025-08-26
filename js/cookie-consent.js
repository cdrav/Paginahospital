/**
 * cookie-consent.js
 * Maneja la lógica para el banner de consentimiento de cookies.
 */
document.addEventListener('DOMContentLoaded', () => {
    const COOKIE_CONSENT_KEY = 'hospital_cookie_consent_accepted';
    const banner = document.getElementById('cookie-consent-banner');
    const acceptButton = document.getElementById('cookie-consent-button');

    // Si los elementos no existen, no hacer nada.
    if (!banner || !acceptButton) {
        return;
    }

    // Verificar si el usuario ya ha aceptado las cookies.
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!hasConsented) {
        // Mostrar el banner si no hay consentimiento previo.
        // Usar un pequeño timeout para asegurar que la transición CSS se aplique correctamente.
        setTimeout(() => {
            banner.classList.add('show');
        }, 500);
    }

    // Manejar el clic en el botón de aceptar.
    acceptButton.addEventListener('click', () => {
        // Guardar el consentimiento en localStorage.
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
        // Ocultar el banner con la transición.
        banner.classList.remove('show');
    });
});