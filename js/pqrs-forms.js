// pqrs-forms.js - Lógica para el formulario de PQRSD

(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init("gcybOcZM8nYnJy19f");
  } else {
    console.error('EmailJS no está disponible. El formulario PQRS no podrá enviar correos.');
  }
})();

// Función para enviar el formulario
function sendEmail(e) {
  e.preventDefault();
  
  // Mostrar carga
  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
  submitBtn.disabled = true;

  // Obtener los datos del formulario
  const formData = new FormData(e.target);
  const formProps = Object.fromEntries(formData);
  
  // Obtener la fecha actual formateada
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Preparar datos del formulario
  const templateParams = {
    // Nombres de variables deben coincidir EXACTAMENTE con los de la plantilla
    TipoDeSolicitud: formProps.TipoDeSolicitud || 'No especificado',
    RazonSocial: formProps.RazonSocial || 'No aplica',
    Fecha: fechaActual,
    TipoDeDocumento: formProps.TipoDeDocumento || 'No especificado',
    NumeroDeDocumento: formProps.NumeroDeDocumento || 'No especificado',
    Nombres: formProps.Nombres || 'No especificado',
    Apellidos: formProps.Apellidos || 'No especificado',
    Telefono: formProps.Telefono || 'No especificado',
    CorreoElectronico: formProps.CorreoElectronico || 'No especificado',
    Direccion: formProps.Direccion || 'No especificado',
    Municipio: formProps.Municipio || 'No especificado',
    Departamento: formProps.Departamento || 'No especificado',
    Asunto: formProps.Asunto || 'Sin asunto',
    Descripcion: formProps.Descripcion || 'Sin descripción',
    to_email: "ventanillaunica@hdsa.gov.co",
    reply_to: formProps.CorreoElectronico || 'ventanillaunica@hdsa.gov.co',
    timestamp: new Date().getTime()
  };
  
  // Verificar disponibilidad de EmailJS antes de enviar
  if (typeof emailjs === 'undefined') {
    const messageDiv = document.getElementById('form-message');
    messageDiv.className = 'alert alert-danger';
    messageDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>El servicio de correo no está disponible. Por favor, recargue la página e intente de nuevo.';
    messageDiv.classList.remove('d-none');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }

  // Enviar el correo con los parámetros
  emailjs.send("service_dxylc2z", "template_3qcvx07", templateParams)
    .then(function(response) {
      // Mostrar mensaje de éxito
      const messageDiv = document.getElementById('form-message');
      messageDiv.className = 'alert alert-success';
      messageDiv.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>¡Su PQRS ha sido enviada exitosamente! Nos pondremos en contacto contigo pronto.';
      messageDiv.classList.remove('d-none');
      
      // Limpiar formulario
      document.getElementById('pqrs-form').reset();
      
      // Desplazarse al mensaje
      messageDiv.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(function(error) {
      // Mostrar mensaje de error
      const messageDiv = document.getElementById('form-message');
    messageDiv.className = 'alert alert-danger';
    messageDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Error al enviar el formulario. Por favor, inténtalo de nuevo más tarde.';
    messageDiv.classList.remove('d-none');
    console.error('Error al enviar el correo:', error);
  })
  .finally(() => {
    // Restaurar el botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

// Asignar el evento de envío al formulario y manejar la lógica del checkbox anónimo
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('pqrs-form');
  if (form) {
    form.addEventListener('submit', sendEmail);

    // Lógica para el checkbox de solicitud anónima
    const anonimoCheck = document.getElementById('anonimo-check');
    const datosPersonalesContainer = document.getElementById('datos-personales-container');
    const camposPersonales = datosPersonalesContainer.querySelectorAll('input, select');

    // Función para actualizar el estado de los campos
    const toggleCamposPersonales = () => {
      const esAnonimo = anonimoCheck.checked;
      
      datosPersonalesContainer.style.display = esAnonimo ? 'none' : 'block';

      camposPersonales.forEach(campo => {
        if (campo.id === 'razonSocial') return;

        if (esAnonimo) {
          campo.removeAttribute('required');
          campo.value = '';
        } else {
          const label = document.querySelector(`label[for="${campo.id}"]`);
          if (label && label.classList.contains('required-field')) {
            campo.setAttribute('required', 'required');
          }
        }
      });
    };

    anonimoCheck.addEventListener('change', toggleCamposPersonales);
    toggleCamposPersonales();
  }
});