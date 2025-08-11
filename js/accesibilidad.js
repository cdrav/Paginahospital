// URLs para enlaces externos
const CENTRO_RELEVO_URL = "https://www.centroderelevo.gov.co/632/w3-propertyvalue-15254.html";
const ENCUESTA_ACCESIBILIDAD_URL = "https://forms.gle/example";

// Función para mostrar notificaciones mejoradas
function showNotification(message, type = 'default') {
    console.log('Mostrando notificación:', message, type); // Debug
    
    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.contrast-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `contrast-notification notification-${type}`;
    notification.textContent = message;
    
    // Agregar al body
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Función para abrir Centro de Relevo
function openCentroRelevo() {
    showNotification('Abriendo Centro de Relevo para personas sordas...', 'centro-relevo');
    setTimeout(() => {
        window.open(CENTRO_RELEVO_URL, '_blank');
    }, 500);
}

// Función para abrir Encuesta de Accesibilidad
function openEncuestaAccesibilidad() {
    showNotification('Abriendo Encuesta de Usabilidad y Accesibilidad...', 'encuesta-accesibilidad');
    setTimeout(() => {
        window.open(ENCUESTA_ACCESIBILIDAD_URL, '_blank');
    }, 500);
}

// Función para cambiar el tamaño del texto
function changeTextSize(direction) {
    console.log('Cambiando tamaño de texto:', direction); // Debug
    
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
    console.log('Cambiando contraste'); // Debug
    
    const body = document.body;
    const currentMode = localStorage.getItem('contrastMode') || 'normal';
    
    console.log('Modo actual:', currentMode); // Debug
    
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
    
    console.log('Nuevo modo:', newMode); // Debug
    
    if (newMode !== 'normal') {
        body.classList.add(newMode);
        console.log('Clase agregada:', newMode); // Debug
    }
    
    localStorage.setItem('contrastMode', newMode);
    showNotification(message, 'contrast-change');
}

// Función para resetear configuración
function resetSettings() {
    console.log('Reseteando configuración'); // Debug
    
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
    console.log('DOM cargado, inicializando accesibilidad'); // Debug
    
    // Cargar configuración guardada
    const savedFontSize = localStorage.getItem('fontSize');
    const savedContrastMode = localStorage.getItem('contrastMode');
    
    if (savedFontSize) {
        document.body.style.fontSize = savedFontSize;
    }
    
    if (savedContrastMode && savedContrastMode !== 'normal') {
        document.body.classList.add(savedContrastMode);
        console.log('Modo cargado:', savedContrastMode); // Debug
    }
    
    // Delegación de eventos para los botones
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.accessibility-buttons-container .btn');
        if (!button) return;
        
        console.log('Botón clickeado:', button); // Debug
        
        const action = button.getAttribute('data-action');
        console.log('Acción:', action); // Debug
        
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
            default:
                console.log('Acción no reconocida:', action); // Debug
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
    
    console.log('Accesibilidad inicializada correctamente'); // Debug
    // Exponer bandera global para evitar conflictos con otros scripts
    window.ACCESSIBILITY_MANAGED = true;
});