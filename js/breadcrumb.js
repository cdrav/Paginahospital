/**
 * Script para incluir dinámicamente el breadcrumb de navegación en todas las páginas
 * Este script debe ser incluido después de cargar el contenido principal de la página
 */

document.addEventListener('DOMContentLoaded', function() {
  // Mapeo de nombres de archivo a títulos de página para el breadcrumb
  const pageTitles = {
    'citasmedicas.html': 'Citas Médicas',
    'consulta-externa.html': 'Consulta Externa',
    'urgencias.html': 'Urgencias',
    'hospitalizacion.html': 'Hospitalización',
    'laboratorio.html': 'Laboratorio Clínico',
    'partos.html': 'Sala de Partos',
    'diagnostico.html': 'Diagnóstico por Imágenes',
    'promocion-prevencion.html': 'Promoción y Prevención',
    'cuidado-oral.html': 'Cuidado Oral',
    'pqrs.html': 'PQRS',
    'mapa-del-sitio.html': 'Mapa del Sitio',
    'politicas.html': 'Políticas',
    'mecanismos-de-contacto.html': 'Mecanismos de Contacto',
    'Estadisticas.html': 'Estadísticas',
    'transparencia-acceso-informacion-publica.html': 'Transparencia y Acceso a la Información Pública',
    'participa.html': 'Participa',
    'normatividad.html': 'Normatividad',
    'noticias.html': 'Noticias',
    'buscar.html': 'Búsqueda'
  };

  // Obtener el nombre del archivo actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Si es la página de inicio, no mostramos breadcrumb
  if (currentPage === 'index.html' || currentPage === '') {
    return;
  }

  // Obtener el título de la página actual
  const pageTitle = pageTitles[currentPage] || 'Página Actual';
  
  // Crear el breadcrumb
  const breadcrumbHtml = `
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.html">Inicio</a></li>
        <li class="breadcrumb-item active" aria-current="page">${pageTitle}</li>
      </ol>
    </nav>
  `;

  // Insertar el breadcrumb en el contenedor designado o en la ubicación predeterminada
  const breadcrumbContainer = document.getElementById('breadcrumb-container');
  
  if (breadcrumbContainer) {
    // Insertar en el contenedor designado
    breadcrumbContainer.innerHTML = breadcrumbHtml;
  } else {
    // Si no hay contenedor específico, intentar insertar antes del contenido principal
    const mainContent = document.querySelector('main, .main-content, .container:not(#header-placeholder)');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', breadcrumbHtml);
    }
  }
});
