document.addEventListener('DOMContentLoaded', () => {
    // --- Declaración de variables y selectores ---
    const cuerpo = document.body;
    const CONTRAST_CLASS = 'alto-contraste';
    const FONT_SIZE_STORAGE_KEY = 'fontSize';
    const CONTRAST_MODE_STORAGE_KEY = 'contrastMode';

    let isContrastMode = false;
    let currentFontSize = 100; // Usar porcentaje en lugar de px
    const minFontSize = 80;
    const maxFontSize = 140;
    const defaultFontSize = 100;

    // --- Funciones para aplicar y guardar estilos ---
    function applyContrastTheme() {
        if (isContrastMode) {
            cuerpo.classList.add(CONTRAST_CLASS);
        } else {
            cuerpo.classList.remove(CONTRAST_CLASS);
        }
        localStorage.setItem(CONTRAST_MODE_STORAGE_KEY, isContrastMode);
    }

    function applyFontSize() {
        // Aplicar el tamaño de fuente como porcentaje al html en lugar del body
        document.documentElement.style.fontSize = `${currentFontSize}%`;
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, currentFontSize);
    }

    function resetStyles() {
        currentFontSize = defaultFontSize;
        isContrastMode = false;
        
        localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
        localStorage.removeItem(CONTRAST_MODE_STORAGE_KEY);

        document.documentElement.style.fontSize = '';
        cuerpo.classList.remove(CONTRAST_CLASS);
    }

    // --- Cargar preferencias guardadas al inicio ---
    const savedContrastMode = localStorage.getItem(CONTRAST_MODE_STORAGE_KEY);
    if (savedContrastMode !== null) {
        isContrastMode = JSON.parse(savedContrastMode);
    }
    applyContrastTheme();

    const savedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (savedFontSize !== null) {
        currentFontSize = parseFloat(savedFontSize);
    }
    applyFontSize();

    // --- Manejo de eventos usando delegación ---
    const accessibilityContainer = document.querySelector('.accessibility-buttons-container');

    if (accessibilityContainer) {
        accessibilityContainer.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            // Identificar botones por su contenido de icono o título
            const title = target.getAttribute('title');
            const ariaLabel = target.getAttribute('aria-label');
            const iconClass = target.querySelector('i')?.className;

            if (target.id === 'cambiarcontraste' || title === 'Cambiar contraste') {
                isContrastMode = !isContrastMode;
                applyContrastTheme();
            } else if (target.id === 'resetContraste' || title === 'Restablecer Contraste y Texto') {
                resetStyles();
            } else if (title === 'Aumentar texto' || iconClass?.includes('bi-plus-circle')) {
                if (currentFontSize < maxFontSize) {
                    currentFontSize += 10;
                    applyFontSize();
                }
            } else if (title === 'Reducir texto' || iconClass?.includes('bi-dash-circle')) {
                if (currentFontSize > minFontSize) {
                    currentFontSize -= 10;
                    applyFontSize();
                }
            }
        });
    }
});