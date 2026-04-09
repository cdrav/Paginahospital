// URLs para enlaces externos
const CENTRO_RELEVO_URL = "https://www.signosenred.gov.co/";
const ENCUESTA_ACCESIBILIDAD_URL = "/encuesta-accesibilidad.html";

// Función para mostrar notificaciones mejoradas
function showNotification(message, type = 'info') {
    // Usar utilidad global si está disponible, con un timeout estándar
    if (window.notify) {
        window.notify(message, { type, timeout: 3000 });
        return;
    }
    // Fallback mínimo si utils.js no ha cargado
    try {
        // Bootstrap alert simple como fallback
        const div = document.createElement('div');
        div.className = `alert alert-${type === 'error' ? 'danger' : type}`;
        div.role = 'alert';
        div.style.position = 'fixed';
        div.style.top = '1rem';
        div.style.right = '1rem';
        div.style.zIndex = '1080';
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    } catch (e) {
        console.log(message);
    }
}

// Función para abrir signos en red
function openCentroRelevo() {
    showNotification('Abriendo Signos en red...', 'signos-en-red');
    setTimeout(() => {
        window.open(CENTRO_RELEVO_URL, '_blank');
    }, 500);
}

// Función para abrir Encuesta de Accesibilidad
function openEncuestaAccesibilidad() {
    showNotification('Redirigiendo a la encuesta de accesibilidad...', 'encuesta-accesibilidad');
    // Usar location.href en lugar de window.open para mejor experiencia en móviles
    setTimeout(() => {
        window.location.href = ENCUESTA_ACCESIBILIDAD_URL;
    }, 500);
}

// Función para cambiar el tamaño del texto
function changeTextSize(direction) {
    const body = document.body;
    const currentSize = parseFloat(getComputedStyle(body).fontSize);
    
    if (direction === 'increase') {
        if (currentSize < 24) { // Límite máximo
            body.style.fontSize = (currentSize + 2) + 'px';
            showNotification('Texto aumentado', 'increase-text');
        } else {
            showNotification('Tamaño máximo alcanzado', 'increase-text');
        }
    } else if (direction === 'decrease') {
        if (currentSize > 12) { // Límite mínimo
            body.style.fontSize = (currentSize - 2) + 'px';
            showNotification('Texto reducido', 'decrease-text');
        } else {
            showNotification('Tamaño mínimo alcanzado', 'decrease-text');
        }
    }
    
    // Guardar en localStorage
    localStorage.setItem('fontSize', body.style.fontSize);
}

// Función para cambiar el contraste
function changeContrast() {
    const body = document.body;
    const currentMode = localStorage.getItem('contrastMode') || 'normal';
    
    // Remover clases anteriores
    body.classList.remove('alto-contraste', 'modo-oscuro', 'modo-sepia');
    
    let newMode;
    let message;
    
    switch (currentMode) {
        case 'normal':
            newMode = 'alto-contraste';
            message = 'Modo alto contraste activado';
            break;
        case 'alto-contraste':
            newMode = 'modo-oscuro';
            message = 'Modo oscuro activado';
            break;
        case 'modo-oscuro':
            newMode = 'modo-sepia';
            message = 'Modo sepia activado';
            break;
        case 'modo-sepia':
            newMode = 'normal';
            message = 'Modo normal activado';
            break;
        default:
            newMode = 'alto-contraste';
            message = 'Modo alto contraste activado';
    }
    
    if (newMode !== 'normal') {
        body.classList.add(newMode);
    }
    
    localStorage.setItem('contrastMode', newMode);
    showNotification(message, 'contrast-change');
}

// Función para resetear configuración
function resetSettings() {
    const body = document.body;
    
    // Resetear tamaño de texto
    body.style.fontSize = '';
    localStorage.removeItem('fontSize');
    
    // Resetear contraste
    body.classList.remove('alto-contraste', 'modo-oscuro', 'modo-sepia');
    localStorage.setItem('contrastMode', 'normal');
    
    showNotification('Configuración restablecida', 'reset-settings');
}

// Event listener para los botones de accesibilidad
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración guardada
    const savedFontSize = localStorage.getItem('fontSize');
    const savedContrastMode = localStorage.getItem('contrastMode');
    
    if (savedFontSize) {
        document.body.style.fontSize = savedFontSize;
    }
    
    if (savedContrastMode && savedContrastMode !== 'normal') {
        document.body.classList.add(savedContrastMode);
    }
    
    // Delegación de eventos para los botones
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.accessibility-buttons-container .btn');
        if (!button) return;
                
        const action = button.getAttribute('data-action');
        switch (action) {
            case 'increase-text':
                changeTextSize('increase');
                break;
            case 'decrease-text':
                changeTextSize('decrease');
                break;
            case 'change-contrast':
                changeContrast();
                break;
            case 'reset-settings':
                resetSettings();
                break;
            case 'centro-relevo':
                openCentroRelevo();
                break;
            case 'encuesta-accesibilidad':
                openEncuestaAccesibilidad();
                break;
        }
    });
    
    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey) {
            switch (e.key) {
                case '=':
                case '+':
                    e.preventDefault();
                    changeTextSize('increase');
                    break;
                case '-':
                    e.preventDefault();
                    changeTextSize('decrease');
                    break;
                case '0':
                    e.preventDefault();
                    resetSettings();
                    break;
            }
        }
    });
    
    // Exponer bandera global para evitar conflictos con otros scripts
    window.ACCESSIBILITY_MANAGED = true;
});