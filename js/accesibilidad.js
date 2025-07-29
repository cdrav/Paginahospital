// Obtener referencias a los elementos del DOM
const cuerpo = document.body;
const increaseTextBtn = document.querySelector('button[title="Aumentar texto"]');
const decreaseTextBtn = document.querySelector('button[title="Reducir texto"]');
const contrastToggleBtn = document.getElementById('cambiarcontraste'); // Asegúrate de que este ID existe en tu HTML

// --- Configuración de Tamaños de Fuente ---
let currentFontSize = parseFloat(getComputedStyle(cuerpo).fontSize) || 16;
const FONT_SIZE_STEP = 2; // Cantidad en píxeles para aumentar/reducir la fuente
const MIN_FONT_SIZE = 10; // Tamaño de fuente mínimo permitido
const MAX_FONT_SIZE = 32; // Tamaño de fuente máximo permitido (ajusta según tus necesidades)

/**
 * Aplica el tamaño de fuente actual al cuerpo del documento.
 */
function applyFontSize() {
    cuerpo.style.fontSize = `${currentFontSize}px`;
}

// Asegurarse de que el tamaño de fuente inicial se aplique al cargar
applyFontSize();

// --- Funcionalidad de Aumentar Tamaño de Texto ---
if (increaseTextBtn) {
    increaseTextBtn.addEventListener('click', () => {
        if (currentFontSize < MAX_FONT_SIZE) { // Evita que la fuente crezca indefinidamente
            currentFontSize += FONT_SIZE_STEP;
            applyFontSize();
        }
    });
}

// --- Funcionalidad de Reducir Tamaño de Texto ---
if (decreaseTextBtn) {
    decreaseTextBtn.addEventListener('click', () => {
        if (currentFontSize > MIN_FONT_SIZE) { // Evita que la fuente sea demasiado pequeña
            currentFontSize -= FONT_SIZE_STEP;
            applyFontSize();
        }
    });
}

// --- Funcionalidad de Alternar Contraste (Múltiples Temas) ---
// Define tus temas de contraste como un array de nombres de clases CSS
const CONTRAST_THEMES = [
    '', // Tema por defecto (sin clase de contraste)
    'alto-contraste-oscuro', // Ejemplo: Fondo oscuro, texto claro
    'alto-contraste-claro',  // Ejemplo: Fondo claro, texto oscuro (diferente al default)
    'alto-contraste-azul'    // Ejemplo: Esquema de color azul
];
let currentContrastThemeIndex = 0; // Índice del tema de contraste actual

/**
 * Aplica el tema de contraste actual al cuerpo del documento.
 */
function applyContrastTheme() {
    // Primero, elimina todas las clases de contraste existentes para evitar conflictos
    CONTRAST_THEMES.forEach(themeClass => {
        if (themeClass) { // Evita intentar eliminar una cadena vacía
            cuerpo.classList.remove(themeClass);
        }
    });

    // Añade la clase del tema actual si no es la cadena vacía (tema por defecto)
    const activeTheme = CONTRAST_THEMES[currentContrastThemeIndex];
    if (activeTheme) {
        cuerpo.classList.add(activeTheme);
    }

    // Guarda la preferencia del usuario en localStorage
    localStorage.setItem('contrastModeIndex', currentContrastThemeIndex);
}

if (contrastToggleBtn) {
    contrastToggleBtn.addEventListener('click', () => {
        // Incrementa el índice, volviendo a 0 si se excede el número de temas
        currentContrastThemeIndex = (currentContrastThemeIndex + 1) % CONTRAST_THEMES.length;
        applyContrastTheme();
    });
}

// --- Cargar Preferencias al Cargar la Página ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar preferencia de contraste
    const savedContrastIndex = localStorage.getItem('contrastModeIndex');
    if (savedContrastIndex !== null) {
        currentContrastThemeIndex = parseInt(savedContrastIndex, 10);
    }
    applyContrastTheme(); // Aplica el tema guardado o el por defecto

    // Si tuvieras una preferencia de tamaño de fuente guardada, la cargarías aquí también
});