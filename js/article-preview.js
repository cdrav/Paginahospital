/**
 * article-preview.js
 * Muestra una vista previa de los artículos de ley al pasar el mouse
 * sobre las referencias en la página del Consultorio Rosa.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Contenido de los artículos (resúmenes)
  const articleData = {
    'ley-1257-art2': {
      title: 'Ley 1257 de 2008, Artículo 2',
      content: `<strong>Definición de violencia contra la mujer:</strong> Por violencia contra la mujer se entiende cualquier acción u omisión, que le cause muerte, daño o sufrimiento físico, sexual, psicológico, económico o patrimonial por su condición de mujer, así como las amenazas de tales actos, la coacción o la privación arbitraria de la libertad, bien sea que se presente en el ámbito público o en el privado.`
    },
    'ley-1257-art3': {
      title: 'Ley 1257 de 2008, Artículo 3',
      content: `<strong>Definición de daño contra la mujer:</strong><br>
      <strong>a) Daño psicológico:</strong> Consecuencia proveniente de la acción u omisión destinada a degradar o a controlar las acciones, comportamientos, creencias y decisiones de otras personas, por medio de intimidación, manipulación, amenaza, directa o indirecta, humillación, aislamiento o cualquier otra conducta que implique un perjuicio en la salud psicológica, la autodeterminación o el desarrollo personal.<br>
      <strong>b) Daño o sufrimiento físico:</strong> Riesgo o disminución de la integridad corporal de una persona.<br>
      <strong>c) Daño o sufrimiento sexual:</strong> Consecuencias que provienen de la acción consistente en obligar a una persona a mantener contacto sexualizado, físico o verbal, o a participar en otras interacciones sexuales mediante el uso de fuerza, intimidación, coerción, chantaje, soborno, manipulación, amenaza o cualquier otro mecanismo que anule o limite la voluntad personal.<br>
      <strong>d) Daño patrimonial:</strong> Pérdida, transformación, sustracción, destrucción, retención o distracción de objetos, instrumentos de trabajo, documentos personales, bienes, valores, derechos o económicos destinados a satisfacer las necesidades de la mujer.`
    },
    'ley-1719': {
      title: 'Ley 1719 de 2014',
      content: `Esta ley adopta medidas para garantizar el acceso a la justicia de las víctimas de violencia sexual, en especial la violencia sexual con ocasión del conflicto armado. Establece principios de debida diligencia, enfoque diferencial y no revictimización, y crea mecanismos para la investigación, juzgamiento y sanción de estos delitos, así como para la protección y reparación integral de las víctimas.`
    },
    'ley-1257-art15': {
      title: 'Ley 1257 de 2008, Artículo 15',
      content: `<strong>Medidas de sensibilización y prevención.</strong> Todas las autoridades encargadas de formular e implementar políticas públicas, deben reconocer las diferencias y desigualdades sociales, biológicas en las relaciones entre las personas y adoptar medidas para evitar que la violencia contra la mujer se siga produciendo. El Gobierno Nacional: ... deberá formular, aplicar y actualizar estrategias, planes y programas Nacionales integrales para la prevención y la erradicación de todas las formas de la violencia contra la mujer.`
    }
  };

  // 2. Crear el elemento de la vista previa una sola vez
  const previewPane = document.createElement('div');
  previewPane.className = 'article-preview-pane';
  previewPane.style.display = 'none';
  document.body.appendChild(previewPane);

  let hideTimeout;

  // 3. Función para mostrar la vista previa
  const showPreview = (triggerElement) => {
    clearTimeout(hideTimeout);
    const key = triggerElement.dataset.articleKey;
    const data = articleData[key];

    if (!data) return;

    // Poblar el contenido
    previewPane.innerHTML = `
      <h6 class="preview-title">${data.title}</h6>
      <div class="preview-content">${data.content}</div>
    `;

    // Posicionar la vista previa
    const rect = triggerElement.getBoundingClientRect();
    previewPane.style.display = 'block';
    
    // Posicionar arriba del footer, alineado a la izquierda o derecha según el espacio
    const paneHeight = previewPane.offsetHeight;
    previewPane.style.top = `${window.scrollY + rect.top - paneHeight - 10}px`;

    if (rect.left + previewPane.offsetWidth > window.innerWidth - 20) {
      previewPane.style.left = `${rect.right - previewPane.offsetWidth}px`;
    } else {
      previewPane.style.left = `${rect.left}px`;
    }
  };

  // 4. Función para ocultar la vista previa
  const hidePreview = () => {
    hideTimeout = setTimeout(() => {
      previewPane.style.display = 'none';
    }, 200); // Pequeño retraso para permitir mover el cursor al panel
  };

  // 5. Asignar eventos
  const triggers = document.querySelectorAll('.card-footer[data-article-key]');
  triggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => showPreview(trigger));
    trigger.addEventListener('mouseleave', hidePreview);
  });

  // Mantener visible si el cursor está sobre la vista previa
  previewPane.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
  previewPane.addEventListener('mouseleave', hidePreview);
});