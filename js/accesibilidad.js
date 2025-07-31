document.addEventListener('DOMContentLoaded', () => {
    // --- Declaración de variables y selectores ---
    const cuerpo = document.body;
    const CONTRAST_CLASS = 'alto-contraste';
    const FONT_SIZE_STORAGE_KEY = 'fontSize';
    const CONTRAST_MODE_STORAGE_KEY = 'contrastMode';

    let isContrastMode = false;
    let currentFontSize = 16;
    const minFontSize = 12;
    const maxFontSize = 24;

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
        cuerpo.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, currentFontSize);
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

            switch (target.id) {
                case 'cambiarcontraste':
                    isContrastMode = !isContrastMode;
                    applyContrastTheme();
                    break;
                case 'aumentarTextoBtn': //  botones  IDs
                    if (currentFontSize < maxFontSize) {
                        currentFontSize += 2;
                        applyFontSize();
                    }
                    break;
                case 'reducirTextoBtn': // botones IDs
                    if (currentFontSize > minFontSize) {
                        currentFontSize -= 2;
                        applyFontSize();
                    }
                    break;
                case 'resetContraste':
                    currentFontSize = 16;
                    isContrastMode = false;
                    
                    localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
                    localStorage.removeItem(CONTRAST_MODE_STORAGE_KEY);

                    cuerpo.style.fontSize = '';
                    cuerpo.classList.remove(CONTRAST_CLASS);
                    break;
            }
        });
    }
});