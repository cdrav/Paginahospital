document.addEventListener('DOMContentLoaded', () => {
    // --- Declaración de variables y selectores ---
    const cuerpo = document.body;
    const FONT_SIZE_STORAGE_KEY = 'fontSize';
    const CONTRAST_MODE_STORAGE_KEY = 'contrastMode';

    // Modos de contraste disponibles
    const CONTRAST_MODES = {
        NORMAL: 'normal',
        ALTO_CONTRASTE: 'alto-contraste',
        MODO_OSCURO: 'modo-oscuro',
        MODO_SEPIA: 'modo-sepia'
    };

    const CONTRAST_CLASSES = [CONTRAST_MODES.ALTO_CONTRASTE, CONTRAST_MODES.MODO_OSCURO, CONTRAST_MODES.MODO_SEPIA];
    
    let currentContrastMode = CONTRAST_MODES.NORMAL;
    let currentFontSize = 100; // Usar porcentaje en lugar de px
    const minFontSize = 80;
    const maxFontSize = 140;
    const defaultFontSize = 100;

    // --- Funciones para aplicar y guardar estilos ---
    function applyContrastTheme() {
        // Remover todas las clases de contraste
        CONTRAST_CLASSES.forEach(className => {
            cuerpo.classList.remove(className);
        });
        
        // Aplicar la clase actual si no es normal
        if (currentContrastMode !== CONTRAST_MODES.NORMAL) {
            cuerpo.classList.add(currentContrastMode);
        }
        
        localStorage.setItem(CONTRAST_MODE_STORAGE_KEY, currentContrastMode);
    }

    function cycleContrastMode() {
        const modes = Object.values(CONTRAST_MODES);
        const currentIndex = modes.indexOf(currentContrastMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        currentContrastMode = modes[nextIndex];
        applyContrastTheme();
        
        // Mostrar notificación del modo actual
        showContrastNotification();
    }

    function showContrastNotification() {
        const modeNames = {
            [CONTRAST_MODES.NORMAL]: 'Modo Normal',
            [CONTRAST_MODES.ALTO_CONTRASTE]: 'Alto Contraste',
            [CONTRAST_MODES.MODO_OSCURO]: 'Modo Oscuro',
            [CONTRAST_MODES.MODO_SEPIA]: 'Modo Sepia'
        };
        
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.textContent = `Contraste: ${modeNames[currentContrastMode]}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 9999;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 2 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    function applyFontSize() {
        // Aplicar el tamaño de fuente como porcentaje al html en lugar del body
        document.documentElement.style.fontSize = `${currentFontSize}%`;
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, currentFontSize);
    }

    function resetStyles() {
        currentFontSize = defaultFontSize;
        currentContrastMode = CONTRAST_MODES.NORMAL;
        
        localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
        localStorage.removeItem(CONTRAST_MODE_STORAGE_KEY);

        document.documentElement.style.fontSize = '';
        // Remover todas las clases de contraste
        CONTRAST_CLASSES.forEach(className => {
            cuerpo.classList.remove(className);
        });
    }

    // --- Cargar preferencias guardadas al inicio ---
    const savedContrastMode = localStorage.getItem(CONTRAST_MODE_STORAGE_KEY);
    if (savedContrastMode !== null) {
        currentContrastMode = savedContrastMode;
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
                cycleContrastMode();
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