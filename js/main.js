// Inicialización de Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

// Función para mostrar notificación de accesibilidad
function mostrarAviso(mensaje) {
    const aviso = document.getElementById('avisoAccesibilidad');
    if (aviso) {
        aviso.textContent = mensaje;
        aviso.classList.add('mostrar');
        setTimeout(() => {
            aviso.classList.remove('mostrar');
        }, 3000);
    }
}


const contrastToggleBtn = document.getElementById("cambiarContraste");


if (localStorage.getItem('altoContraste') === 'true') {
    document.body.classList.add('alto-contraste');
}


if (contrastToggleBtn) {
    contrastToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('alto-contraste');
        const isActive = document.body.classList.contains('alto-contraste');
        localStorage.setItem('altoContraste', isActive);
        mostrarAviso(isActive ? "Modo alto contraste activado" : "Modo alto contraste desactivado");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const increaseBtn = document.querySelector('[title="Aumentar texto"]');
    const normalBtn = document.querySelector('[title="Tamaño normal"]');
    const decreaseBtn = document.querySelector('[title="Reducir texto"]');

    // Solo modificar el tamaño de fuente si el usuario ya lo cambió antes
    let fontSize = 100;
    if (localStorage.getItem('fontSize') && localStorage.getItem('fontSize') !== "100") {
        fontSize = parseInt(localStorage.getItem('fontSize'));
        document.body.style.fontSize = fontSize + '%';
    } else {
        document.body.style.fontSize = '100%';
        localStorage.setItem('fontSize', 100);
    }

    // Aumentar texto
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (fontSize < 160) { 
                fontSize += 10;
                document.body.style.fontSize = fontSize + '%';
                localStorage.setItem('fontSize', fontSize);
                mostrarAviso("Tamaño de texto aumentado");
            } else {
                mostrarAviso("Tamaño máximo alcanzado");
            }
        });
    }

    // Restaurar tamaño normal
    if (normalBtn) {
        normalBtn.addEventListener('click', () => {
            fontSize = 100; // Reset to 100%
            document.body.style.fontSize = '100%';
            localStorage.setItem('fontSize', fontSize);
            mostrarAviso("Tamaño de texto normal restaurado");
        });
    }

    // Reducir texto
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (fontSize > 80) { // Min font size 80%
                fontSize -= 10;
                document.body.style.fontSize = fontSize + '%';
                localStorage.setItem('fontSize', fontSize);
                mostrarAviso("Tamaño de texto reducido");
            } else {
                mostrarAviso("Tamaño mínimo alcanzado");
            }
        });
    }
});