// js/noticias.js - Lógica para filtrar noticias por categoría

document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('.filter-btn-group .btn');
  const newsItems = document.querySelectorAll('.news-item');

  // Si no hay botones de filtro en la página, no hacer nada.
  if (filterButtons.length === 0 || newsItems.length === 0) {
    return;
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Manejar estado activo de los botones
      filterButtons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      });
      this.classList.remove('btn-outline-primary');
      this.classList.add('btn-primary');

      const filter = this.getAttribute('data-filter');

      newsItems.forEach(item => {
        item.style.display = (filter === 'all' || item.getAttribute('data-category') === filter) ? '' : 'none';
      });
    });
  });
});