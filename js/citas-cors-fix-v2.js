// Manejo de CORS para desarrollo local - Versión mejorada
(function() {
    'use strict';
    
    console.log('🔧 CORS Fix activado - Modo desarrollo local');
    
    // Función para mostrar notificación de CORS
    function mostrarNotificacionCORS() {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-info-circle-fill me-2"></i>
                <div>
                    <strong>Modo Desarrollo Local</strong><br>
                    <small>Los archivos se guardarán sin restricciones CORS</small>
                </div>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }
    
    // Función para mostrar errores
    function mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
        errorDiv.style.zIndex = '9999';
        errorDiv.style.minWidth = '300px';
        errorDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>${mensaje}</div>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // Función para guardar cita con manejo CORS
    async function guardarCitaConCORS() {
        try {
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
            
            console.log('🔄 Guardando cita en modo desarrollo local...');
            
            // Recopilar datos del formulario
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
                especialidad: { nombre: 'Medicina General' },
                fecha: new Date().toISOString().split('T')[0],
                hora: '10:00 AM',
                motivoConsulta: motivo,
                tieneWhatsapp: tieneWhatsapp.value,
                ordenesMedicas: [],
                status: 'Solicitada',
                createdAt: new Date(),
                modoDesarrollo: true
            };
            
            // Importar funciones de Firebase dinámicamente
            const { db, collection, addDoc, serverTimestamp } = await import('./firebase-config.js');
            
            // Guardar en Firestore
            const docRef = await addDoc(collection(db, "citasOnline"), {
                ...formData,
                createdAt: serverTimestamp()
            });
            
            console.log('✅ Cita guardada exitosamente:', docRef.id);
            
            // Éxito
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            // Actualizar modal de éxito
            const numeroRadicado = document.getElementById('numeroRadicado');
            const fechaConfirmada = document.getElementById('fechaConfirmada');
            
            if (numeroRadicado) numeroRadicado.textContent = docRef.id;
            if (fechaConfirmada) {
                const fechaObj = new Date();
                fechaConfirmada.textContent = fechaObj.toLocaleDateString('es-CO', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                }) + ' a las 10:00 AM';
            }
            
            // Mostrar modal de éxito
            const modalExito = document.getElementById('modalExito');
            if (modalExito) {
                const modal = new bootstrap.Modal(modalExito);
                modal.show();
            }
            
        } catch (error) {
            console.error('❌ Error al guardar cita:', error);
            
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            mostrarError('Error al guardar la cita: ' + error.message);
        }
    }
    
    // Mostrar notificación al cargar la página
    setTimeout(mostrarNotificacionCORS, 2000);
    
    // Interceptar el envío del formulario con manejo CORS
    setTimeout(() => {
        const form = document.getElementById('citaForm');
        if (form && form.parentNode) {
            try {
                // Remover event listeners anteriores de forma segura
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                // Agregar nuevo event listener con manejo CORS
                newForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    await guardarCitaConCORS();
                });
                
                console.log('✅ Event listener del formulario configurado');
            } catch (error) {
                console.warn('⚠️ No se pudo modificar el formulario, usando método alternativo:', error);
                
                // Método alternativo: agregar event listener directamente
                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    await guardarCitaConCORS();
                });
            }
        } else {
            console.warn('⚠️ Formulario no encontrado');
        }
    }, 3000);
    
})();
