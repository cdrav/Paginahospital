/**
 * Manejo del formulario de Google Forms
 * Carga y configura el comportamiento del iframe del formulario
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuración del iframe del formulario
    const configurarFormularioGoogle = () => {
        const iframe = document.querySelector('iframe[title="Formulario de Encuesta de Accesibilidad"]');
        
        if (iframe) {
            // Manejar mensajes del iframe
            window.addEventListener('message', function(event) {
                // Verificar el origen del mensaje para seguridad
                if (event.origin === 'https://docs.google.com') {
                    console.log('Mensaje recibido del formulario:', event.data);
                    // Aquí puedes agregar lógica adicional si necesitas manejar respuestas del formulario
                }
            });
            
            // Asegurar que el iframe sea accesible
            iframe.setAttribute('aria-label', 'Formulario de Encuesta de Accesibilidad');
        }
    };

    // Inicializar
    configurarFormularioGoogle();
});
