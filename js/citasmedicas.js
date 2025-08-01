/**
 * Funcionalidades específicas para la página de Citas Médicas
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el selector de fecha con fecha mínima (mañana)
    inicializarSelectorFecha();
    
    // Configurar manejadores de eventos para los formularios
    configurarFormularios();
    
    // Inicializar funcionalidad de acordeón para las preguntas frecuentes
    inicializarAcordeonFAQ();
});

/**
 * Inicializa el selector de fecha con la fecha mínima (mañana)
 */
function inicializarSelectorFecha() {
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    // Formatear fecha en YYYY-MM-DD
    const dd = String(manana.getDate()).padStart(2, '0');
    const mm = String(manana.getMonth() + 1).padStart(2, '0');
    const yyyy = manana.getFullYear();
    const fechaMinima = yyyy + '-' + mm + '-' + dd;
    
    const selectorFecha = document.getElementById('fechaCita');
    if (selectorFecha) {
        selectorFecha.min = fechaMinima;
    }
}

/**
 * Configura los manejadores de eventos para los formularios
 */
function configurarFormularios() {
    // Formulario de solicitud de cita
    const formCita = document.getElementById('formCitaMedica');
    if (formCita) {
        formCita.addEventListener('submit', manejarEnvioCita);
    }
    
    // Formulario de consulta de cita
    const formConsulta = document.getElementById('formConsultarCita');
    if (formConsulta) {
        formConsulta.addEventListener('submit', manejarConsultaCita);
    }
    
    // Cargar médicos dinámicamente al cambiar la especialidad
    const selectorEspecialidad = document.getElementById('especialidad');
    if (selectorEspecialidad) {
        selectorEspecialidad.addEventListener('change', cargarMedicos);
    }
}

/**
 * Maneja el envío del formulario de solicitud de cita
 * @param {Event} e - Evento de envío del formulario
 */
function manejarEnvioCita(e) {
    e.preventDefault();
    
    // Validar el formulario
    if (!this.checkValidity()) {
        this.classList.add('was-validated');
        return;
    }
    
    // Aquí iría la lógica para enviar los datos al servidor
    // Por ahora, solo mostramos un mensaje de éxito
    mostrarMensaje('Tu solicitud de cita ha sido recibida. Recibirás un correo de confirmación con los detalles.', 'success');
    
    // Reiniciar el formulario
    this.reset();
    this.classList.remove('was-validated');
}

/**
 * Maneja la consulta de una cita existente
 * @param {Event} e - Evento de envío del formulario
 */
function manejarConsultaCita(e) {
    e.preventDefault();
    
    // Validar el formulario
    if (!this.checkValidity()) {
        this.classList.add('was-validated');
        return;
    }
    
    // Aquí iría la lógica para consultar la cita en el servidor
    // Por ahora, mostramos un mensaje informativo
    mostrarMensaje('Función de consulta de cita en desarrollo. Próximamente disponible.', 'info');
    
    // No reiniciamos el formulario para permitir al usuario intentar de nuevo
    this.classList.remove('was-validated');
}

/**
 * Carga dinámicamente la lista de médicos según la especialidad seleccionada
 */
function cargarMedicos() {
    const selectorEspecialidad = this;
    const selectorMedico = document.getElementById('medico');
    
    if (!selectorMedico) return;
    
    // Limpiar opciones actuales excepto la primera
    while (selectorMedico.options.length > 1) {
        selectorMedico.remove(1);
    }
    
    // Si no hay especialidad seleccionada, no hacer nada más
    if (!selectorEspecialidad.value) return;
    
    // Simular carga de médicos desde el servidor
    // En una implementación real, esto sería una llamada AJAX
    const medicos = obtenerMedicosPorEspecialidad(selectorEspecialidad.value);
    
    // Agregar médicos al selector
    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.id;
        option.textContent = medico.nombre;
        selectorMedico.appendChild(option);
    });
}

/**
 * Simula la obtención de médicos por especialidad desde el servidor
 * @param {string} especialidad - ID de la especialidad
 * @returns {Array} Lista de médicos
 */
function obtenerMedicosPorEspecialidad(especialidad) {
    // Datos de ejemplo - en una aplicación real, esto vendría de una API
    const medicosPorEspecialidad = {
        'medicina-general': [
            { id: 'mg1', nombre: 'Dr. Juan Pérez' },
            { id: 'mg2', nombre: 'Dra. Ana Gómez' }
        ],
        'pediatria': [
            { id: 'p1', nombre: 'Dra. María Rodríguez' },
            { id: 'p2', nombre: 'Dr. Carlos López' }
        ],
        'ginecologia': [
            { id: 'g1', nombre: 'Dra. Laura Martínez' },
            { id: 'g2', nombre: 'Dra. Sofía Ramírez' }
        ],
        'cardiologia': [
            { id: 'c1', nombre: 'Dr. Andrés Vargas' },
            { id: 'c2', nombre: 'Dra. Patricia Díaz' }
        ],
        'dermatologia': [
            { id: 'd1', nombre: 'Dra. Carolina Rojas' },
            { id: 'd2', nombre: 'Dr. Javier Molina' }
        ]
    };
    
    return medicosPorEspecialidad[especialidad] || [];
}

/**
 * Inicializa la funcionalidad del acordeón de preguntas frecuentes
 */
function inicializarAcordeonFAQ() {
    const preguntas = document.querySelectorAll('.accordion-button');
    
    preguntas.forEach(pregunta => {
        pregunta.addEventListener('click', function() {
            // Cerrar otras preguntas abiertas
            const preguntaAbierta = document.querySelector('.accordion-button[aria-expanded="true"]');
            if (preguntaAbierta && preguntaAbierta !== this) {
                const contenidoId = preguntaAbierta.getAttribute('aria-controls');
                const contenido = document.getElementById(contenidoId);
                
                preguntaAbierta.setAttribute('aria-expanded', 'false');
                contenido.classList.remove('show');
            }
        });
    });
}

/**
 * Muestra un mensaje al usuario
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo de mensaje (success, error, info, warning)
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear el contenedor del mensaje si no existe
    let contenedorMensajes = document.getElementById('mensajes-flotantes');
    
    if (!contenedorMensajes) {
        contenedorMensajes = document.createElement('div');
        contenedorMensajes.id = 'mensajes-flotantes';
        contenedorMensajes.style.position = 'fixed';
        contenedorMensajes.style.top = '20px';
        contenedorMensajes.style.right = '20px';
        contenedorMensajes.style.zIndex = '9999';
        document.body.appendChild(contenedorMensajes);
    }
    
    // Crear el mensaje
    const mensajeElemento = document.createElement('div');
    mensajeElemento.className = `alert alert-${tipo} alert-dismissible fade show`;
    mensajeElemento.role = 'alert';
    mensajeElemento.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    // Agregar el mensaje al contenedor
    contenedorMensajes.appendChild(mensajeElemento);
    
    // Eliminar el mensaje después de 5 segundos
    setTimeout(() => {
        mensajeElemento.classList.remove('show');
        mensajeElemento.classList.add('fade');
        
        // Eliminar el elemento después de la animación
        setTimeout(() => {
            mensajeElemento.remove();
            
            // Si no hay más mensajes, eliminar el contenedor
            if (contenedorMensajes.children.length === 0) {
                contenedorMensajes.remove();
            }
        }, 150);
    }, 5000);
}
