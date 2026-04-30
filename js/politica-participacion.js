// Script para el selector de años en Política de Participación Social en Salud

function showYear(year) {
    // Ocultar todos los contenidos de años
    document.querySelectorAll('.year-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar el contenido del año seleccionado
    const selectedContent = document.getElementById('year-' + year);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Actualizar botones
    document.querySelectorAll('.year-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector('[data-year="' + year + '"]');
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que el año 2025 esté activo por defecto
    showYear('2025');
});
