// Versión simplificada para desarrollo local sin problemas de CORS
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Cargando versión de desarrollo para citas online');
  
  // Sobrescribir la función de confirmación para manejar CORS
  setTimeout(() => {
    const form = document.getElementById('citaForm');
    if (form) {
      // Remover event listeners anteriores
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, newForm);
      
      // Agregar nuevo event listener con manejo de CORS
      newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validación básica
        const motivo = document.getElementById('motivoConsulta')?.value?.trim();
        const tieneWhatsapp = document.querySelector('input[name="tieneWhatsapp"]:checked');
        
        if (!motivo) {
          alert('Por favor, describe el motivo de tu consulta');
          return;
        }
        if (!tieneWhatsapp) {
          alert('Por favor, indica si el número celular tiene WhatsApp');
          return;
        }
        
        // Mostrar carga
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        try {
          // Simular guardado exitoso para desarrollo
          console.log('🎭 Modo desarrollo: Simulando envío de cita');
          
          // Simular ID de cita
          const citaId = 'DEV-' + Date.now(); 
          
          // Ocultar carga
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          
          // Mostrar confirmación
          const numeroRadicado = document.getElementById('numeroRadicado');
          const fechaConfirmada = document.getElementById('fechaConfirmada');
          
          if (numeroRadicado) numeroRadicado.textContent = citaId;
          
          // Usar datos del formulario para la fecha
          const fechaInput = document.querySelector('input[type="date"]') || 
                           document.querySelector('[data-fecha]') ||
                           new Date().toISOString().split('T')[0];
          const horaSelect = document.querySelector('select') || 
                            { value: '10:00 AM' };
          
          const fechaObj = new Date(fechaInput + 'T12:00:00');
          const fechaFormateada = fechaObj.toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          if (fechaConfirmada) {
            fechaConfirmada.textContent = `${fechaFormateada} a las ${horaSelect.value || '10:00 AM'}`;
          }
          
          // Mostrar modal de éxito
          const modalExito = document.getElementById('modalExito');
          if (modalExito) {
            const modal = new bootstrap.Modal(modalExito);
            modal.show();
          }
          
          // Alerta de desarrollo
          setTimeout(() => {
            alert('✅ Modo Desarrollo: La cita se ha simulado exitosamente. En producción se guardará en Firebase correctamente.');
          }, 1000);
          
        } catch (error) {
          console.error('Error en modo desarrollo:', error);
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          alert('Error en el proceso. Por favor intenta nuevamente.');
        }
      });
      
      console.log('✅ Versión de desarrollo cargada correctamente');
    }
  }, 500);
});
