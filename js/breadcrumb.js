/**
 * Script para incluir dinámicamente el breadcrumb de navegación en todas las páginas
 * Este script debe ser incluido después de cargar el contenido principal de la página
 */

document.addEventListener('DOMContentLoaded', function() {
  // Obtener el nombre del archivo actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Si es la página de inicio, no mostramos breadcrumb
  if (currentPage === 'index.html' || currentPage === '') {
    return;
  }

  // Obtener el título de la página desde un atributo en el body o el título del documento
  const pageTitle = document.body.dataset.pageTitle || document.title.split('|')[0].split('-')[0].trim() || 'Página Actual';
  
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
    // Si no hay contenedor específico, intentar insertar después del header o antes del contenido principal
    const headerPlaceholder = document.getElementById('header-placeholder');
    const mainContent = document.querySelector('main, .main-content');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', breadcrumbHtml);
    } else if (headerPlaceholder) {
      headerPlaceholder.insertAdjacentHTML('afterend', breadcrumbHtml);
    }
  }
});
