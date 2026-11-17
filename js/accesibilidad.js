// URLs para enlaces externos
const CENTRO_RELEVO_URL = "https://www.signosenred.gov.co/";
const ENCUESTA_ACCESIBILIDAD_URL = "/encuesta-accesibilidad.html";

// Mensaje de la barra de accesibilidad. Usa un solo aviso que se actualiza
// (clave 'accesibilidad'): con varios clics seguidos no se apilan mensajes iguales.
let avisoRespaldo = null;
function avisoAccesibilidad(message) {
    if (window.notify) {
        window.notify(message, { type: 'info', timeout: 3000, key: 'accesibilidad' });
        return;
    }
    // Respaldo si utils.js no está en la página (mismas clases que utils.js, en site.css)
    if (!avisoRespaldo || !avisoRespaldo.isConnected) {
        avisoRespaldo = document.createElement('div');
        avisoRespaldo.className = 'alert alert-info shadow-sm notify-alerta notify-contenedor';
        avisoRespaldo.role = 'alert';
        document.body.appendChild(avisoRespaldo);
    }
    avisoRespaldo.textContent = message;
    clearTimeout(avisoRespaldo._timer);
    avisoRespaldo._timer = setTimeout(() => avisoRespaldo.remove(), 3000);
}

// Función para abrir signos en red
function openCentroRelevo() {
    avisoAccesibilidad('Abriendo Signos en Red...');
    setTimeout(() => {
        window.open(CENTRO_RELEVO_URL, '_blank');
    }, 500);
}

// Función para abrir Encuesta de Accesibilidad
function openEncuestaAccesibilidad() {
    avisoAccesibilidad('Abriendo la encuesta de accesibilidad...');
    // Usar location.href en lugar de window.open para mejor experiencia en móviles
    setTimeout(() => {
        window.location.href = ENCUESTA_ACCESIBILIDAD_URL;
    }, 500);
}

// Función para cambiar el tamaño del texto
function changeTextSize(direction) {
    const body = document.body;
    const currentSize = parseFloat(getComputedStyle(body).fontSize);
    // Tamaño original de la página (sin el ajuste guardado), para mostrar el porcentaje
    const ajuste = body.style.fontSize;
    body.style.fontSize = '';
    const baseSize = parseFloat(getComputedStyle(body).fontSize) || 16;
    body.style.fontSize = ajuste;
    const porcentaje = px => Math.round((px / baseSize) * 100) + ' %';

    if (direction === 'increase') {
        if (currentSize < 24) { // Límite máximo
            body.style.fontSize = (currentSize + 2) + 'px';
            avisoAccesibilidad('Tamaño del texto: ' + porcentaje(currentSize + 2));
        } else {
            avisoAccesibilidad('Tamaño del texto: ' + porcentaje(currentSize) + ' (máximo)');
        }
    } else if (direction === 'decrease') {
        if (currentSize > 12) { // Límite mínimo
            body.style.fontSize = (currentSize - 2) + 'px';
            avisoAccesibilidad('Tamaño del texto: ' + porcentaje(currentSize - 2));
        } else {
            avisoAccesibilidad('Tamaño del texto: ' + porcentaje(currentSize) + ' (mínimo)');
        }
    }
    
    // Guardar en localStorage
    localStorage.setItem('fontSize', body.style.fontSize);
}

// Modos de contraste: la clase va en <html> (los modos oscuro y sepia usan
// filtros CSS, que sobre <body> romperían los elementos position:fixed);
// alto contraste también va en <body>, donde la usan sus reglas CSS.
const CONTRAST_MODES = ['alto-contraste', 'modo-oscuro', 'modo-sepia'];
let fondosObserver = null;
let fondosPendiente = null;

function applyContrastMode(mode) {
    const html = document.documentElement;
    html.classList.remove(...CONTRAST_MODES);
    document.body.classList.remove(...CONTRAST_MODES);
    if (fondosObserver) { fondosObserver.disconnect(); fondosObserver = null; }
    clearTimeout(fondosPendiente); fondosPendiente = null;
    document.querySelectorAll('.acc-reinvertir').forEach(el => el.classList.remove('acc-reinvertir'));
    if (!CONTRAST_MODES.includes(mode)) return;
    html.classList.add(mode);
    if (mode === 'alto-contraste') document.body.classList.add(mode);
    if (mode === 'modo-oscuro') {
        // Se re-invierten (quedan con sus colores originales) los fondos
        // fotográficos y las franjas que ya son oscuras (barra GOV.CO,
        // encabezado, pie), para que no se vuelvan claras. Se revisa también
        // el contenido que se carga después (header, noticias...).
        const oscuro = (bg) => {
            const m = bg.match(/rgba?\(([^)]+)\)/); if (!m) return false;
            const [r, g, b, a = 1] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
            return a >= 0.9 && (0.2126 * r + 0.7152 * g + 0.0722 * b) < 110;
        };
        const marcar = () => {
            fondosPendiente = null;
            const ancho = document.documentElement.clientWidth;
            document.querySelectorAll('body *').forEach(el => {
                if (el.classList.contains('acc-reinvertir') || el.parentElement.closest('.acc-reinvertir')) return;
                const cs = getComputedStyle(el);
                if (/url\(/.test(cs.backgroundImage) && !el.matches('.form-select, .form-check-input, .btn-close, [class*="-icon"]')) {
                    el.classList.add('acc-reinvertir');
                } else if (oscuro(cs.backgroundColor) && (el.offsetWidth >= ancho * 0.6 || el.matches('.accessibility-buttons-container'))) {
                    el.classList.add('acc-reinvertir');
                }
            });
        };
        marcar();
        fondosObserver = new MutationObserver(() => { if (!fondosPendiente) fondosPendiente = setTimeout(marcar, 300); });
        fondosObserver.observe(document.body, { childList: true, subtree: true });
    }
}

// Función para cambiar el contraste
function changeContrast() {
    const currentMode = localStorage.getItem('contrastMode') || 'normal';

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
    
    applyContrastMode(newMode);

    localStorage.setItem('contrastMode', newMode);
    avisoAccesibilidad(message);
}

// Función para resetear configuración
function resetSettings() {
    const body = document.body;
    
    // Resetear tamaño de texto
    body.style.fontSize = '';
    localStorage.removeItem('fontSize');
    
    // Resetear contraste
    applyContrastMode('normal');
    localStorage.setItem('contrastMode', 'normal');
    
    avisoAccesibilidad('Texto y contraste restablecidos');
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
        applyContrastMode(savedContrastMode);
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
    
    // Sin atajos de teclado propios: Ctrl + "+", Ctrl + "-" y Ctrl + 0 quedan para el
    // zoom del navegador, que agranda toda la página y es el que usan las personas con baja visión.

    // Exponer bandera global para evitar conflictos con otros scripts
    window.ACCESSIBILITY_MANAGED = true;
});