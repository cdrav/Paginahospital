// Manejo del envío del formulario PQRS
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[name="pqrs-form"]');
  if (!form) return; // Salir si no hay formulario

  // --- INICIO: CÓDIGO DE MANTENIMIENTO ---
  // Este bloque deshabilita el formulario y muestra un aviso.
  // Para reactivar el formulario, simplemente elimina o comenta este bloque.
  
  const maintenanceHTML = `
    <div class="container py-5 text-center">
      <div class="card shadow-sm p-4 p-md-5" style="max-width: 700px; margin: auto;">
        <i class="bi bi-tools" style="font-size: 3rem; color: #ffc107;"></i>
        <h2 class="card-title fw-bold mt-3">Formulario en Mantenimiento</h2>
        <p class="card-text text-muted lead mt-2">
          Actualmente estamos realizando mejoras en nuestro sistema de PQRS.
        </p>
        <p class="card-text">
          Para cualquier solicitud urgente, por favor comuníquese a través de nuestros otros <a href="/mecanismos-de-contacto.html">canales de contacto</a>. Disculpe las molestias.
        </p>
      </div>
    </div>
  `;

  form.innerHTML = maintenanceHTML; // Reemplaza el contenido del formulario con el mensaje.
  return; // Detiene la ejecución del resto del script para este formulario.
  // --- FIN: CÓDIGO DE MANTENIMIENTO ---

  const submitBtn = document.getElementById('submit-btn');
  const spinner = submitBtn?.querySelector('.spinner-border');
  const btnText = submitBtn?.querySelector('.btn-text');
  const formMessage = document.getElementById('form-message');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Función para mostrar mensajes
  function showMessage(message, type) {
    // Preferir utilidad global unificada con target del formulario
    if (window.notify) {
      window.notify(message, { type, target: formMessage || null, timeout: 4000 });
      return;
    }
    // Fallback anterior si no existe utils.js
    if (formMessage) {
      formMessage.textContent = message;
      formMessage.className = `alert alert-${type} mt-3`;
      formMessage.classList.remove('d-none');
      formMessage.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert(message);
    }
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
