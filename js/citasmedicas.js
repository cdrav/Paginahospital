/**
 * Funcionalidades específicas para la página de Citas Médicas
 * NOTA: Este es un formulario simple. Para el wizard de varios pasos, ver `citas-medicas-online.js`.
 */

document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectorFecha();
    configurarFormularios();
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
    if (window.notify) {
        window.notify('Tu solicitud de cita ha sido recibida. Recibirás un correo de confirmación con los detalles.', { type: 'success' });
    } else {
        alert('Tu solicitud de cita ha sido recibida. Recibirás un correo de confirmación con los detalles.');
    }
    
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
    if (window.notify) {
        window.notify('Función de consulta de cita en desarrollo. Próximamente disponible.', { type: 'info' });
    } else {
        alert('Función de consulta de cita en desarrollo. Próximamente disponible.');
    }
    
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
        'dermatologia': [
            { id: 'd1', nombre: 'Dra. Carolina Rojas' },
            { id: 'd2', nombre: 'Dr. Javier Molina' }
        ]
    };
    
    return medicosPorEspecialidad[especialidad] || [];
}
