// accesibilidad.js

// --- Declaración de Variables ---
const cuerpo = document.body; // Gets the body element
const contrastToggleBtn = document.getElementById('cambiarcontraste'); // Gets the contrast button by its ID



// --- Funcionalidad de Alternar Contraste (Alterna una sola clase) ---
const CONTRAST_CLASS = 'alto-contraste'; // Define the single contrast class
let isContrastMode = false; // Track if contrast mode is active

/**
 * Aplica o remueve el tema de contraste al cuerpo del documento.
 */
function applyContrastTheme() {
    if (isContrastMode) {
        cuerpo.classList.add(CONTRAST_CLASS);
    } else {
        cuerpo.classList.remove(CONTRAST_CLASS);
    }
    // Guarda la preferencia del usuario en localStorage
    localStorage.setItem('contrastMode', isContrastMode);
}

if (contrastToggleBtn) {
    contrastToggleBtn.addEventListener('click', () => {
        isContrastMode = !isContrastMode; // Toggle the state
        applyContrastTheme();
    });
}

// --- Cargar Preferencias al Cargar la Página ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar preferencia de contraste
    const savedContrastMode = localStorage.getItem('contrastMode');
    if (savedContrastMode !== null) {
        isContrastMode = JSON.parse(savedContrastMode); // Parse boolean from string
    }
    applyContrastTheme();

    // Cargar preferencia de tamaño de fuente (if applicable)
    // const savedFontSize = localStorage.getItem('fontSize');
    // if (savedFontSize !== null) {
    //     currentFontSize = parseInt(savedFontSize);
    //     updateFontSize();
    // }
});

// funcionalidad resetear ajustes de tamaño ---

document.addEventListener('DOMContentLoaded', () => {
    const aumentarBtn = document.querySelector('.accessibility-buttons-container .btn[title="Aumentar texto"]');
    const reducirBtn = document.querySelector('.accessibility-buttons-container .btn[title="Reducir texto"]');
    const cambiarContrasteBtn = document.getElementById('cambiarcontraste');
    const resetContrasteBtn = document.getElementById('resetContraste'); // Get the new reset button
    const body = document.body;
    let currentFontSize = 16; // Assuming base font size is 16px (1em)
    const minFontSize = 12;
    const maxFontSize = 24;

    // --- Font Size Functions ---
    if (aumentarBtn) {
        aumentarBtn.addEventListener('click', () => {
            if (currentFontSize < maxFontSize) {
                currentFontSize += 2;
                body.style.fontSize = `${currentFontSize}px`;
            }
        });
    }

    if (reducirBtn) {
        reducirBtn.addEventListener('click', () => {
            if (currentFontSize > minFontSize) {
                currentFontSize -= 2;
                body.style.fontSize = `${currentFontSize}px`;
            }
        });
    }

    // --- Contrast Function ---
    if (cambiarContrasteBtn) {
        cambiarContrasteBtn.addEventListener('click', () => {
            body.classList.toggle('high-contrast');
        });
    }

    // --- Reset Function ---
    if (resetContrasteBtn) {
        resetContrasteBtn.addEventListener('click', () => {
            // Reset font size
            currentFontSize = 16; // Reset to original base font size
            body.style.fontSize = ''; // Remove inline style to revert to CSS default

            // Reset contrast
            body.classList.remove('high-contrast');
        });
    }
});