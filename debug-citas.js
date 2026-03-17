// Script de depuración para verificar la inicialización
console.log('=== INICIANDO DEPURACIÓN ===');

// Función para verificar botones
function checkButtons() {
    const buttons = document.querySelectorAll('button[data-action]');
    console.log(`Botones con data-action encontrados: ${buttons.length}`);
    
    buttons.forEach((button, index) => {
        console.log(`Botón ${index + 1}:`, {
            action: button.dataset.action,
            step: button.dataset.step,
            text: button.textContent.trim(),
            hasClickListener: button.onclick !== null,
            eventListeners: button._clickHandler ? 'Sí' : 'No'
        });
    });
    
    return buttons.length > 0;
}

// Verificar estado del formulario
function checkFormState() {
    const formContent = document.querySelector('.form-content');
    const slider = document.querySelector('.form-slider');
    const paso1 = document.getElementById('paso1');
    
    console.log('Estado del formulario:', {
        formContent: !!formContent,
        slider: !!slider,
        paso1: !!paso1,
        paso1Active: paso1 ? paso1.classList.contains('active') : false
    });
}

// Verificar variables globales
function checkGlobalVars() {
    console.log('Variables globales:', {
        pasoActual: typeof pasoActual !== 'undefined' ? pasoActual : 'undefined',
        datosCita: typeof datosCita !== 'undefined' ? 'definido' : 'undefined',
        formInitialized: typeof window.formInitialized !== 'undefined' ? window.formInitialized : 'undefined'
    });
}

// Iniciar verificación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado - iniciando verificación...');
    
    setTimeout(() => {
        checkGlobalVars();
        checkFormState();
        
        // Esperar un poco más y verificar botones
        setTimeout(() => {
            if (checkButtons()) {
                console.log('✅ Botones encontrados y configurados');
            } else {
                console.log('❌ No se encontraron botones - reintentando...');
                setTimeout(checkButtons, 1000);
            }
        }, 500);
    }, 1000);
});

// También verificar en el load
window.addEventListener('load', () => {
    console.log('Ventana cargada - verificación final...');
    setTimeout(() => {
        checkButtons();
        checkFormState();
    }, 500);
});
