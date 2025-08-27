// js/cookie-consent.js

document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookie-consent-banner');
    const acceptButton = document.getElementById('cookie-consent-button');
    const body = document.body;
    const COOKIE_NAME = 'hospital_cookie_consent';
    const COOKIE_EXPIRATION_DAYS = 365;

    if (!banner || !acceptButton) {
        // No hay banner en esta página, no hacer nada.
        return;
    }

    /**
     * Comprueba si la cookie de consentimiento ya existe.
     * @returns {boolean} - True si la cookie existe, false en caso contrario.
     */
    const hasCookieConsent = () => {
        return document.cookie.split(';').some((item) => item.trim().startsWith(`${COOKIE_NAME}=`));
    };

    /**
     * Muestra el banner de cookies y ajusta el layout.
     */
    const showBanner = () => {
        if (banner) {
            body.classList.add('cookie-banner-visible');
            banner.classList.add('show');
        }
    };

    /**
     * Oculta el banner de cookies y revierte los ajustes de layout.
     */
    const hideBanner = () => {
        if (banner) {
            banner.classList.remove('show');
            // Esperar a que la animación de salida termine para quitar la clase del body
            setTimeout(() => {
                body.classList.remove('cookie-banner-visible');
            }, 500); // Debe coincidir con la duración de la transición CSS
        }
    };

    /**
     * Establece la cookie de consentimiento.
     */
    const setCookieConsent = () => {
        const date = new Date();
        date.setTime(date.getTime() + (COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${COOKIE_NAME}=true;${expires};path=/;SameSite=Lax;Secure`;
    };

    // Lógica principal
    if (!hasCookieConsent()) {
        // Retrasar la aparición del banner ligeramente para no ser tan intrusivo
        setTimeout(showBanner, 1500);
    }

    acceptButton.addEventListener('click', () => {
        setCookieConsent();
        hideBanner();
    });
});
