// Script para limpiar cache y errores del formulario
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧹 Limpiando cache y errores del formulario');
    
    // Limpiar cualquier event listener residual
    setTimeout(() => {
        const form = document.getElementById('citaForm');
        if (form) {
            console.log('✅ Formulario encontrado, limpiando...');
            
            // Eliminar cualquier script CORS residual
            const scripts = document.querySelectorAll('script[src*="citas-cors"]');
            scripts.forEach(script => {
                console.log('🗑️ Eliminando script CORS residual:', script.src);
                script.remove();
            });
            
            // Reiniciar el formulario
            form.reset();
            
            // Limpiar clases de validación
            const campos = form.querySelectorAll('.is-invalid, .is-valid');
            campos.forEach(campo => {
                campo.classList.remove('is-invalid', 'is-valid');
            });
            
            console.log('✅ Formulario limpiado y listo para usar');
        } else {
            console.error('❌ Formulario no encontrado');
        }
    }, 1000);
    
    // Forzar recarga de cache si es necesario
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
                console.log('🗑️ Service worker eliminado');
            }
        });
    }
});
