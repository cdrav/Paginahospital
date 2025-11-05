// Manejo del formulario PQRS
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[name="pqrs-form"]');
  if (!form) return; // Salir si no hay formulario

  // Mostrar mensaje de mantenimiento
  const maintenanceHTML = `
    <div class="alert alert-warning mt-4">
      <div class="d-flex align-items-center">
        <i class="bi bi-tools fs-3 me-3"></i>
        <div>
          <h4 class="alert-heading">¡Estamos en mantenimiento!</h4>
          <p class="mb-0">El formulario de PQRS se encuentra temporalmente en mantenimiento para mejoras. Por favor, inténtalo nuevamente más tarde o contáctanos a través de nuestros otros canales de comunicación.</p>
          <hr>
          <p class="mb-0">Disculpa las molestias. Estamos trabajando para brindarte un mejor servicio.</p>
        </div>
      </div>
    </div>
  `;

  // Reemplazar el formulario con el mensaje de mantenimiento
  form.outerHTML = maintenanceHTML;
  
  // Salir ya que el resto del código no es necesario
  return;

  // El resto del código original (deshabilitado por el return anterior)
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
  form.addEventListener('submit', async function(e) {
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
    
    try {
      // Crear FormData para el envío
      const formData = new FormData(form);
      
      // Agregar el nombre del formulario
      formData.append('form-name', 'pqrs-form');
      
      // Enviar datos a Netlify
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Redirigir a la página de éxito
        window.location.href = '/pqrs/success.html';
      } else {
        throw new Error('Error al enviar el formulario');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error al enviar el formulario. Por favor, inténtalo de nuevo más tarde.', 'danger');
    } finally {
      // Restaurar botón
      if (spinner && btnText && submitBtn) {
        spinner.classList.add('d-none');
        btnText.textContent = 'Enviar mensaje';
        submitBtn.disabled = false;
      }
    }
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
