// --- Declaración de Variables ---
const cuerpo = document.body;
const contrastToggleBtn = document.getElementById('cambiarcontraste');

// --- Funcionalidad de Aumentar/Reducir Tamaño de Fuente (existing code, if any) ---
// (Your existing font size code would go here, make sure it's correctly linked to buttons)
const increaseFontBtn = document.querySelector('[title="Aumentar texto"]');
const decreaseFontBtn = document.querySelector('[title="Reducir texto"]');
let currentFontSize = 16; // Default font size
function updateFontSize() {
    cuerpo.style.fontSize = `${currentFontSize}px`;
    // Select all elements you want to scale font for
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, li, button, input, span').forEach(el => {
        // You might need more sophisticated logic here, e.g., to respect relative units
        // For simplicity, we'll just set the font size directly, but consider its implications
        // For example, if an H1 is already 2em, setting it to 20px might not be what you want.
        // A better approach would be to add/remove classes that adjust font-size based on a multiplier.
        // For now, let's just make sure the body font size changes, and assume relative units will adjust.
    });
    localStorage.setItem('fontSize', currentFontSize);
}

if (increaseFontBtn) {
    increaseFontBtn.addEventListener('click', () => {
        currentFontSize += 2;
        updateFontSize();
    });
}
if (decreaseFontBtn) {
    decreaseFontBtn.addEventListener('click', () => {
        currentFontSize -= 2;
        updateFontSize();
    });
}


// --- Funcionalidad de Alternar Contraste (Cycle through multiple classes) ---
const CONTRAST_CLASSES = ['', 'alto-contraste', 'modo-oscuro', 'modo-sepia']; // Add your contrast classes here. '' represents default.
let currentContrastIndex = 0; // Start with the default mode

/**
 * Aplica o remueve el tema de contraste al cuerpo del documento.
 */
function applyContrastTheme() {
    // Remove all contrast classes first
    CONTRAST_CLASSES.forEach(className => {
        if (className !== '') { // Don't try to remove an empty class name
            cuerpo.classList.remove(className);
        }
    });

    // Add the current contrast class if it's not the default empty string
    if (CONTRAST_CLASSES[currentContrastIndex] !== '') {
        cuerpo.classList.add(CONTRAST_CLASSES[currentContrastIndex]);
    }

    // Guarda la preferencia del usuario en localStorage
    localStorage.setItem('contrastModeIndex', currentContrastIndex);
}

if (contrastToggleBtn) {
    contrastToggleBtn.addEventListener('click', () => {
        currentContrastIndex = (currentContrastIndex + 1) % CONTRAST_CLASSES.length; // Cycle to the next mode
        applyContrastTheme();
    });
}

// --- Cargar Preferencias al Cargar la Página ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar preferencia de contraste
    const savedContrastModeIndex = localStorage.getItem('contrastModeIndex');
    if (savedContrastModeIndex !== null) {
        currentContrastIndex = parseInt(savedContrastModeIndex, 10); // Parse integer from string
    }
    applyContrastTheme(); // Apply the saved or default contrast mode

    // Cargar preferencia de tamaño de fuente
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize !== null) {
        currentFontSize = parseInt(savedFontSize, 10);
        updateFontSize();
    }
});