// Botón de salida rápida para páginas sobre violencias basadas en género.
// Abre una página neutra y reemplaza la actual, para que "Atrás" no regrese aquí.
(function () {
  const DESTINO = 'https://www.google.com';
  const ESPERA_ESC_MS = 1000;

  function salir() {
    document.body.style.display = 'none';
    window.open(DESTINO, '_blank', 'noopener');
    window.location.replace(DESTINO);
  }

  const boton = document.getElementById('salida-rapida');
  if (boton) boton.addEventListener('click', salir);

  // Presionar Esc dos veces seguidas también activa la salida.
  let ultimoEsc = 0;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const ahora = Date.now();
    if (ahora - ultimoEsc < ESPERA_ESC_MS) salir();
    ultimoEsc = ahora;
  });
})();
