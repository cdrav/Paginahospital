// Solución temporal para CORS - Modo degradado con notificación clara
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Cargando solución temporal para problemas de CORS');
  
  // Función para mostrar notificación CORS
  function mostrarNotificacionCORS() {
    const notificacion = document.createElement('div');
    notificacion.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3';
    notificacion.style.zIndex = '9999';
    notificacion.style.maxWidth = '600px';
    notificacion.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>
          <strong>Problema temporal con adjuntos:</strong> Estamos trabajando para solucionar los problemas técnicos con la subida de archivos. 
          Tu cita se registrará correctamente, pero por ahora los adjuntos deben enviarse por otros medios.
          <br><small class="text-muted">Te contactaremos para coordinar la entrega de tus documentos.</small>
        </div>
        <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;
    document.body.appendChild(notificacion);
    
    // Auto-ocultar después de 10 segundos
    setTimeout(() => {
      if (notificacion.parentElement) {
        notificacion.remove();
      }
    }, 10000);
  }
  
  // Mostrar notificación al cargar la página
  setTimeout(mostrarNotificacionCORS, 2000);
  
  // Interceptar el envío del formulario con manejo CORS
  setTimeout(() => {
    const form = document.getElementById('citaForm');
    if (form) {
      // Remover event listeners anteriores
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, newForm);
      
      // Agregar nuevo event listener con manejo CORS
      newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validación básica
        const motivo = document.getElementById('motivoConsulta')?.value?.trim();
        const tieneWhatsapp = document.querySelector('input[name="tieneWhatsapp"]:checked');
        
        if (!motivo) {
          mostrarError('Por favor, describe el motivo de tu consulta');
          return;
        }
        if (!tieneWhatsapp) {
          mostrarError('Por favor, indica si el número celular tiene WhatsApp');
          return;
        }
        
        // Mostrar carga
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        try {
          // Intentar guardar en Firestore sin archivos
          console.log('🔄 Intentando guardar cita sin archivos debido a CORS');
          
          // Recopilar datos del formulario
        const estadoCita = document.getElementById('estadoCita')?.value || 'Solicitada';
        const formData = {
            paciente: {
              tipoDocumento: document.getElementById('tipoDocumento')?.value || '',
              numeroDocumento: document.getElementById('numeroDocumento')?.value || '',
              nombres: document.getElementById('nombres')?.value || '',
              apellidos: document.getElementById('apellidos')?.value || '',
              genero: document.getElementById('genero')?.value || '',
              telefono: document.getElementById('telefono')?.value || '',
              correo: document.getElementById('correo')?.value || '',
              eps: document.getElementById('eps')?.value || ''
            },
            especialidad: { nombre: 'General' }, // Simplificado
            fecha: new Date().toISOString().split('T')[0],
            hora: '10:00 AM',
            motivoConsulta: motivo,
            tieneWhatsapp: tieneWhatsapp.value,
            ordenesMedicas: [], // Vacío por CORS
            status: estadoCita, // Usar el estado seleccionado
            createdAt: new Date(),
            corsIssue: true, // Marcar para seguimiento
            notaCORS: 'Problema CORS detectado - archivos no subidos'
          };
          
          // Importar funciones de Firebase dinámicamente
          const { db, collection, addDoc, serverTimestamp } = await import('./firebase-config.js');
          
          // Guardar en Firestore
          const docRef = await addDoc(collection(db, "citasOnline"), {
            ...formData,
            createdAt: serverTimestamp()
          });
          
          const citaId = docRef.id;
          
          // Ocultar carga
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          
          // Mostrar confirmación con nota especial
          const numeroRadicado = document.getElementById('numeroRadicado');
          const fechaConfirmada = document.getElementById('fechaConfirmada');
          
          if (numeroRadicado) numeroRadicado.textContent = citaId;
          
          const fechaObj = new Date();
          const fechaFormateada = fechaObj.toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          if (fechaConfirmada) {
            fechaConfirmada.textContent = `${fechaFormateada} a las 10:00 AM`;
          }
          
          // Mostrar modal de éxito
          const modalExito = document.getElementById('modalExito');
          if (modalExito) {
            const modal = new bootstrap.Modal(modalExito);
            modal.show();
          }
          
          // Mostrar mensaje final sobre archivos
          setTimeout(() => {
            alert('✅ Cita registrada exitosamente con el número: ' + citaId + 
                  '\n\n⚠️ Importante: Debido a problemas técnicos, los archivos adjuntos no se pudieron procesar. ' +
                  'Nuestro equipo te contactará pronto para coordinar cómo enviarnos tus documentos médicos.');
          }, 1000);
          
          console.log('✅ Cita guardada sin archivos debido a CORS');
          
        } catch (error) {
          console.error('Error al guardar cita:', error);
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          mostrarError('Error al procesar la cita. Por favor intenta nuevamente o contacta directamente al hospital.');
        }
      });
      
      console.log('✅ Solución CORS temporal cargada');
    }
  }, 1000);
});
