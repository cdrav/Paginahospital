// Manejo del envío del formulario PQRS
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[name="pqrs-form"]');
  if (!form) return; // Salir si no hay formulario

  const submitBtn = document.getElementById('submit-btn');
  const spinner = submitBtn?.querySelector('.spinner-border');
  const btnText = submitBtn?.querySelector('.btn-text');
  const formMessage = document.getElementById('form-message');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Función para mostrar mensajes
  function showMessage(message, type) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.className = `alert alert-${type} mt-3`;
    formMessage.classList.remove('d-none');
    formMessage.scrollIntoView({ behavior: 'smooth' });
  }

  // Validación del formulario
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validación de campos requeridos
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      showMessage('Por favor complete todos los campos obligatorios.', 'warning');
      return;
    }

    // Mostrar spinner y deshabilitar botón
    if (spinner && btnText && submitBtn) {
      spinner.classList.remove('d-none');
      btnText.textContent = 'Enviando...';
      submitBtn.disabled = true;
    }
    
    // Envío según entorno
    if (isLocal) {
      // Entorno local: no hay backend que acepte POST. Simulamos éxito.
      console.log('Entorno local: simulando envío y redirigiendo a la página de éxito.');
      setTimeout(() => {
        window.location.href = '/pqrs/success.html';
      }, 400);
      return;
    }

    // Producción (Netlify): envío nativo para que Netlify Forms lo capture (soporta archivos)
    try {
      // Asegurar que exista el campo 'form-name'
      if (!form.querySelector('input[name="form-name"]')) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'form-name';
        hidden.value = 'pqrs-form';
        form.appendChild(hidden);
      }
      form.submit();
    } finally {
      // No restauramos botones porque la página navegará
    }
  });

  // Validación de formulario Bootstrap
  (function () {
    'use strict'
    // Obtener todos los formularios a los que queremos aplicar estilos de validación de Bootstrap
    var forms = document.querySelectorAll('.needs-validation')

    // Bucle sobre ellos y evitar el envío
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
          form.classList.add('was-validated')
        }, false)
      })
  })()
});
