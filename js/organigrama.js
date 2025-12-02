// Datos del organigrama
const organigramaData = [
  // Nivel 1: Gerencia
  {
    id: 'gerencia',
    nombre: 'Gerencia',
    cargo: 'Gerente',
    nombreResponsable: 'Mauricio Saldarriaga',
    email: 'gerencia@hdsa.gov.co',
    descripcion: 'Máxima autoridad administrativa del hospital, responsable de la dirección general y estrategia institucional.',
    nivel: 1
  },
  
  // Nivel 2: Subgerencias y Asesorías
  {
    id: 'subgerencia-administrativa',
    nombre: 'Subgerencia Administrativa',
    cargo: 'Subgerente Administrativo',
    nombreResponsable: 'Yaravi Maite Llanos',
    email: 'subgerencia@hdsa.gov.co',
    descripcion: 'Gestión de procesos administrativos, financieros y de recursos humanos del hospital.',
    nivel: 2,
    jefeId: 'gerencia'
  },
  {
    id: 'subgerencia-cientifica',
    nombre: 'Subgerencia Científica',
    cargo: 'Subgerente Científico',
    nombreResponsable: 'Víctor Rengifo',
    email: 'subdireccioncientifica@hdsa.gov.co',
    descripcion: 'Responsable de la gestión asistencial, calidad y docencia del hospital.',
    nivel: 2,
    jefeId: 'gerencia'
  },
  
  // Nivel 3: Área Administrativa
  {
    id: 'talento-humano',
    nombre: 'Talento Humano',
    cargo: 'Jefe de Talento Humano',
    nombreResponsable: 'Oscar Orley Romero',
    email: 'talentohumano@hdsa.gov.co',
    descripcion: 'Gestión del talento humano, nómina y bienestar laboral.',
    nivel: 3,
    jefeId: 'subgerencia-administrativa'
  },
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    cargo: 'Contadora',
    nombreResponsable: 'Rosa María Clavijo',
    email: 'contabilidad@hdsa.gov.co',
    descripcion: 'Gestión contable y financiera del hospital.',
    nivel: 3,
    jefeId: 'subgerencia-administrativa'
  },
  {
    id: 'tesoreria',
    nombre: 'Tesorería',
    cargo: 'Tesorera',
    nombreResponsable: 'Stephany Arango',
    email: 'tesoreria@hdsa.gov.co',
    descripcion: 'Manejo de recursos financieros y presupuestales.',
    nivel: 3,
    jefeId: 'subgerencia-administrativa'
  },
  
  // Nivel 3: Área Asistencial
  {
    id: 'enfermeria',
    nombre: 'Enfermería',
    cargo: 'Jefe de Enfermería',
    nombreResponsable: 'Dubisa Álvarez',
    email: 'enfermeria@hdsa.gov.co',
    descripcion: 'Coordinación del personal de enfermería y atención al paciente.',
    nivel: 3,
    jefeId: 'subgerencia-cientifica'
  },
  {
    id: 'urgencias',
    nombre: 'Urgencias',
    cargo: 'Coordinador de Urgencias',
    nombreResponsable: 'Julian Humberto Vélez',
    email: 'urgencias@hdsa.gov.co',
    extension: '221',
    descripcion: 'Atención médica de urgencias y emergencias.',
    nivel: 3,
    jefeId: 'subgerencia-cientifica'
  },
  {
    id: 'laboratorio',
    nombre: 'Laboratorio Clínico',
    cargo: 'Coordinador de Laboratorio',
    nombreResponsable: 'Daniela Moreno Murcia',
    email: 'laboratorio@hdsa.gov.co',
    extension: '222',
    descripcion: 'Análisis clínicos y procesamiento de muestras médicas.',
    nivel: 3,
    jefeId: 'subgerencia-cientifica'
  }
];

// Función para renderizar el organigrama
function renderOrganigrama() {
  const container = document.getElementById('organigrama-interactivo');
  if (!container) return;
  
  // Agrupar por niveles
  const niveles = {};
  organigramaData.forEach(nodo => {
    if (!niveles[nodo.nivel]) {
      niveles[nodo.nivel] = [];
    }
    niveles[nodo.nivel].push(nodo);
  });
  
  // Ordenar niveles
  const nivelesOrdenados = Object.keys(niveles).sort().map(nivel => niveles[nivel]);
  
  // Generar HTML para cada nivel
  let html = '';
  
  nivelesOrdenados.forEach((nivel, index) => {
    const esPrimerNivel = index === 0;
    const esUltimoNivel = index === nivelesOrdenados.length - 1;
    
    // Agregar líneas de conexión entre niveles
    if (index > 0) {
      html += `
        <div class="org-connector">
          <div class="org-connector-line"></div>
        </div>`;
    }
    
    // Contenedor del nivel
    html += `
      <div class="org-level org-level-${index + 1} ${esPrimerNivel ? 'org-level-first' : ''} ${esUltimoNivel ? 'org-level-last' : ''}">
        <div class="org-nodes">`;
    
    // Nodos del nivel
    nivel.forEach(nodo => {
      const tieneSubordinados = organigramaData.some(n => n.jefeId === nodo.id);
      
      html += `
        <div class="org-node" data-nodo-id="${nodo.id}">
          <div class="org-node-inner">
            <div class="org-node-header">
              <h4 class="org-node-title">${nodo.nombreResponsable}</h4>
              <p class="org-node-position">${nodo.cargo}</p>
            </div>
            <div class="org-node-body">
              <p class="org-node-departamento">${nodo.nombre}</p>
              <p class="org-node-email">
                <i class="bi bi-envelope"></i> ${nodo.email}
              </p>
              <p class="org-node-extension">
                <i class="bi bi-telephone"></i> Ext: ${nodo.extension}
              </p>
            </div>
            ${tieneSubordinados ? '<div class="org-node-arrow"><i class="bi bi-chevron-down"></i></div>' : ''}
          </div>
          <div class="org-node-detail">
            <p class="small mb-0">${nodo.descripcion}</p>
          </div>
        </div>`;
    });
    
    html += `
        </div>
      </div>`;
  });
  
  container.innerHTML = html;
  
  // Agregar eventos de interacción
  setupOrganigramaInteractions();
}

// Configurar interacciones del organigrama
function setupOrganigramaInteractions() {
  const nodos = document.querySelectorAll('.org-node');
  
  nodos.forEach(nodo => {
    // Toggle de detalles al hacer clic en el nodo
    nodo.addEventListener('click', (e) => {
      // Evitar que se active si se hace clic en un enlace
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        return;
      }
      
      // Cerrar otros nodos abiertos en el mismo nivel
      const nivel = nodo.closest('.org-level');
      if (nivel) {
        nivel.querySelectorAll('.org-node').forEach(otroNodo => {
          if (otroNodo !== nodo) {
            otroNodo.classList.remove('active');
          }
        });
      }
      
      // Alternar el nodo actual
      nodo.classList.toggle('active');
    });
    
    // Efecto hover
    nodo.addEventListener('mouseenter', () => {
      if (!nodo.classList.contains('active')) {
        nodo.classList.add('hover');
      }
    });
    
    nodo.addEventListener('mouseleave', () => {
      nodo.classList.remove('hover');
    });
  });
}

// Inicializar el organigrama cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  renderOrganigrama();
  
  // Agregar estilos dinámicamente si no están ya en el documento
  if (!document.getElementById('organigrama-styles')) {
    const link = document.createElement('link');
    link.id = 'organigrama-styles';
    link.rel = 'stylesheet';
    link.href = 'css/organigrama.css';
    document.head.appendChild(link);
  }
});

// Hacer la función accesible globalmente
window.organigrama = {
  render: renderOrganigrama,
  updateData: (nuevosDatos) => {
    if (Array.isArray(nuevosDatos)) {
      organigramaData.length = 0;
      organigramaData.push(...nuevosDatos);
      renderOrganigrama();
    }
  }
};
