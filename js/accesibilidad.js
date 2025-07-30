// accesibilidad.js

document.addEventListener('DOMContentLoaded', () => {
    // --- declaración de variables ---
    const cuerpo = document.body;
    const contrastToggleBtn = document.getElementById('cambiarcontraste');
    const aumentarBtn = document.querySelector('.accessibility-buttons-container .btn[title="Aumentar texto"]');
    const reducirBtn = document.querySelector('.accessibility-buttons-container .btn[title="Reducir texto"]');
    const resetAccessibilityBtn = document.getElementById('resetContraste'); // Renamed for clarity

    // --- ajustes de contraste ---
    const CONTRAST_CLASS = 'alto-contraste'; 
    let isContrastMode = false;

    // ---tamaño variables ---
    let currentFontSize = 16; 
    const minFontSize = 12;
    const maxFontSize = 24;
    const FONT_SIZE_STORAGE_KEY = 'fontSize'; 
    const CONTRAST_MODE_STORAGE_KEY = 'contrastMode'; 

    
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

  
    if (contrastToggleBtn) {
        contrastToggleBtn.addEventListener('click', () => {
            isContrastMode = !isContrastMode; 
            applyContrastTheme(); 
        });
    }

    
    if (aumentarBtn) {
        aumentarBtn.addEventListener('click', () => {
            if (currentFontSize < maxFontSize) {
                currentFontSize += 2;
                applyFontSize(); 
            }
        });
    }

    if (reducirBtn) {
        reducirBtn.addEventListener('click', () => {
            if (currentFontSize > minFontSize) {
                currentFontSize -= 2;
                applyFontSize(); 
            }
        });
    }
 
    if (resetAccessibilityBtn) {
        resetAccessibilityBtn.addEventListener('click', () => {
      
            currentFontSize = 16;
            localStorage.removeItem(FONT_SIZE_STORAGE_KEY); 
            cuerpo.style.fontSize = ''; 

            
            isContrastMode = false;
            localStorage.removeItem(CONTRAST_MODE_STORAGE_KEY); 
            cuerpo.classList.remove(CONTRAST_CLASS); 
        });
    }
});   


