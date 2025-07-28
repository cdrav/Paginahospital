// Inicialización de Google Translate
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'es',
    includedLanguages: 'en',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'google_translate_element');
}

// Función para mostrar notificación accesibilidad 
function mostrarAviso(mensaje) {
  const aviso = document.getElementById('avisoAccesibilidad');
  if (aviso) {
    aviso.textContent = mensaje;
    aviso.classList.add('mostrar');
    setTimeout(() => aviso.classList.remove('mostrar'), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const increaseBtn = document.querySelector('[title="Aumentar texto"]');
  const normalBtn = document.querySelector('[title="Tamaño normal"]');
  const contrastBtn = document.querySelector('[title="Modo alto contraste"]');
  const btnContraste = document.getElementById("cambiarContraste");

  let fontSize = parseInt(localStorage.getItem('fontSize')) || 100;
  document.body.style.fontSize = fontSize + '%';

  // Aumentar texto
  increaseBtn?.addEventListener('click', () => {
    if (fontSize < 160) {
      fontSize += 10;
      document.body.style.fontSize = fontSize + '%';
      localStorage.setItem('fontSize', fontSize);
      mostrarAviso("Tamaño aumentado");
    }
  });

  // Restaurar tamaño normal
  normalBtn?.addEventListener('click', () => {
    fontSize = 100;
    document.body.style.fontSize = '100%';
    localStorage.setItem('fontSize', fontSize);
    mostrarAviso("Tamaño normal restaurado");
  });

  // Modo contraste simple (alto contraste blanco/negro)
  contrastBtn?.addEventListener('click', () => {
    document.body.classList.toggle('alto-contraste');
    const activado = document.body.classList.contains('alto-contraste');
    localStorage.setItem('altoContraste', activado);
    mostrarAviso(activado ? "Contraste activado" : "Contraste desactivado");
  });

  // Restaurar modo contraste si estaba activo
  if (localStorage.getItem('altoContraste') === 'true') {
    document.body.classList.add('alto-contraste');
  }
});


