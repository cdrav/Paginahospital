// js/directorio.js

// Función para verificar si una imagen existe
async function verificarImagen(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Error al verificar la imagen:', url, error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Datos del personal con área jerárquica.
    const directorioData = [
        // Nivel 1: Gerencia
        { nombre: "Mauricio Saldarriaga", cargo: "Gerente", email: "gerencia@hdsa.gov.co", foto: "mauricio-saldarriaga.webp", area: "gerencia" },

        // Nivel 2: Asesores calidad y control interno
        { nombre: "Paulo Castillo Ferreira", cargo: "Jefe Oficina de Calidad", email: "asesorcalidad@hdsa.gov.co", foto: "paulo-castillo-ferreira.webp", area: "asesor" },
        { nombre: "Zoraida Idarraga", cargo: "Jefe Oficina de Control Interno", email: "controlinterno@hdsa.gov.co", foto: "zoraida-idarraga.webp", area: "asesor" },
        { nombre: "Julian Hernandez", cargo: "Asesor Jurídico", email: "notificacionesjudiciales@hdsa.gov.co", foto: "julian-hernandez.webp", area: "asesor" },

        // Nivel 3: Subgerencias
        { nombre: "Yaraví Maite Llanos", cargo: "Subgerente Administrativa", email: "subgerencia@hdsa.gov.co", foto: "yaravi-maite-llanos.webp", area: "subgerencia_admin" },
        { nombre: "Victor Rengifo", cargo: "Subdirector Científico", email: "subdireccioncientifica@hdsa.gov.co", foto: "victor-rengifo.webp", area: "subgerencia_cientifica" },

        // Nivel 4: Área Asistencial / Científica
        { nombre: "Gilberto Taborda", cargo: "Auditor Medico", email: "auditormedico@hdsa.gov.co", foto: "gilberto-taborda.webp", area: "asistencial" },
        { nombre: "Julian Humberto Velez", cargo: "Coordinador Médico", email: "coordinacionmedica@hdsa.gov.co", foto: "julian-humberto-velez.webp", area: "asistencial" },
        { nombre: "Claudia Velez", cargo: "Jefe de Cirugía", email: "cirugia@hdsa.gov.co", foto: "claudia-velez.webp", area: "asistencial" },
        { nombre: "Daniela Moreno Murcia", cargo: "Coordinadora de Laboratorio", email: "laboratorio@hdsa.gov.co", foto: "daniela-moreno-murcia.webp", area: "asistencial" },
        { nombre: "Diana Marcela Benitez", cargo: "Jefe enfermería Promoción y Prevención", email: "pyp@hdsa.gov.co", foto: "diana-marcela-benitez.webp", area: "asistencial" },
        { nombre: "Dubisa Alvarez", cargo: "Jefe de Enfermería", email: "urgencias@hdsa.gov.co", foto: "dubisa-alvarez.webp", area: "asistencial" },
        { nombre: "Lina Maria Madrid", cargo: "Terapia Física", email: "apterapeutico@hdsa.gov.co", foto: "lina-maria-madrid.webp", area: "asistencial" },
        { nombre: "Lorena Nieto", cargo: "Jefe Enfermería Hospitalización", email: "urgencias@hdsa.gov.co", foto: "lorena-nieto.webp", area: "asistencial" },
        { nombre: "Maria Camila Zapata", cargo: "Coordinadora Odontología", email: "odontologia@hdsa.gov.co", foto: "maria-camila-zapata.webp", area: "asistencial" },
        { nombre: "Sebastian Sarria", cargo: "Biomédico", email: "mantenimiento@hdsa.gov.co", foto: "sebastian-sarria.webp", area: "asistencial" },
        { nombre: "Amalia Diaz", cargo: "Tecnóloga de Radiología", email: "radiologia@hdsa.gov.co", foto: "amalia-diaz.webp", area: "asistencial" },
        { nombre: "Lorena Rios", cargo: "Seguridad y Salud en el Trabajo", email: "medicinalaboral@hdsa.gov.co", foto: "lorena-rios.webp", area: "asistencial" },
        { nombre: "Yeimi Carolina Espinoza", cargo: "Jefe enfermería Ruta Desnutrición", email: "rutadesnutricion@hdsa.gov.co", foto: "yeimi-carolina-espinoza.webp", area: "asistencial" },
        
        // Nivel 5: Área Administrativa
        { nombre: "Stephany Arango", cargo: "Tesorera", email: "tesoreria@hdsa.gov.co", foto: "stephany-arango.webp", area: "administrativa" },
        { nombre: "Rosa Maria Clavijo", cargo: "Contadora", email: "contabilidad@hdsa.gov.co", foto: "rosa-maria-clavijo.webp", area: "administrativa" },
        { nombre: "Oscar Orley Romero", cargo: "Talento Humano", email: "talentohumano@hdsa.gov.co", foto: "oscar-orley-romero.webp", area: "administrativa" },
        { nombre: "Olga Martinez", cargo: "Contratación", email: "contratacion@hdsa.gov.co", foto: "olga-martinez.webp", area: "administrativa" },
        { nombre: "Sandra Milena Chaverra", cargo: "Jefe de Almacén", email: "almacen@hdsa.gov.co", foto: "sandra-chaverra.webp", area: "administrativa" },
        { nombre: "Dolly Asevena Alvarado", cargo: "Coordinadora Servicios Generales", email: "serv.generales@hdsa.gov.co", foto: "dolly-asevena-alvarado.webp", area: "administrativa" },
        { nombre: "Wilmar Benitez", cargo: "Jefe de Mantenimiento", email: "mantenimiento@hdsa.gov.co", foto: "wilmar-benitez.webp", area: "administrativa" },
        { nombre: "Claudia Lorena Salazar", cargo: "Gestión Documental", email: "gestiondocumental@hdsa.gov.co", foto: "claudia-lorena-salazar.webp", area: "administrativa" },
        { nombre: "Eliana Bermudez", cargo: "Coordinadora SIAU", email: "coord.siau@hdsa.gov.co", foto: "eliana-bermudez.webp", area: "administrativa" },
        { nombre: "Isabel Canizales", cargo: "Coordinadora Facturación", email: "facturacion@hdsa.gov.co", foto: "isabel-canizales.webp", area: "administrativa" },
        { nombre: "Luis Nieto", cargo: "Coordinador de Estadística", email: "coord.estadistica@hdsa.gov.co", foto: "luis-nieto.webp", area: "administrativa" },
        { nombre: "Robert Giraldo", cargo: "Coordinador de Sistemas", email: "coord.sistemas@hdsa.gov.co", foto: "robert-giraldo.webp", area: "administrativa" },
        { nombre: "Rodrigo Torres", cargo: "Presupuesto", email: "presupuesto@hdsa.gov.co", foto: "rodrigo-torres.webp", area: "administrativa" }
    ];

    const searchInput = document.getElementById('directorio-search');

    // Contenedores para la nueva estructura
    const gerenteContainer = document.getElementById('directorio-gerente');
    const asesoresContainer = document.getElementById('directorio-asesores');
    const subAdminContainer = document.getElementById('directorio-subgerencia-admin');
    const subCientificaContainer = document.getElementById('directorio-subgerencia-cientifica');
    const adminContainer = document.getElementById('directorio-administrativos');
    const asistencialContainer = document.getElementById('directorio-asistenciales');

    // Función para crear tarjeta con manejo mejorado de imágenes
    async function crearTarjeta(persona, esPrincipal = false) {
        const cardClass = esPrincipal ? 'directorio-card-principal' : '';
        const emailButton = persona.email 
            ? `<a href="mailto:${persona.email}" class="btn btn-outline-brand btn-sm rounded-pill directorio-email-btn w-100">
                 <i class="bi bi-envelope me-1"></i><span class="email-text">${persona.email}</span>
               </a>`
            : `<button class="btn btn-outline-secondary btn-sm rounded-pill" disabled>
                 <i class="bi bi-envelope-slash me-1"></i> No disponible
               </button>`;

        // Ruta de la imagen
        const imgPath = `/imagenes/Fotos-directorio-institucional/${persona.foto}`;
        
        // Verificar si la imagen existe
        const imagenExiste = await verificarImagen(imgPath);
        const imgSrc = imagenExiste ? imgPath : '/imagenes/Fotos-directorio-institucional/placeholder.webp';

        return `
          <div class="col directorio-card-col">
            <div class="card h-100 text-center shadow-sm border-0 hover-card ${cardClass}">
              <div class="directorio-img-wrapper">
                <img src="${imgSrc}" 
                     class="card-img-top" 
                     alt="Foto de ${persona.nombre}" 
                     loading="lazy" 
                     decoding="async"
                     onerror="this.onerror=null; this.src='/imagenes/Fotos-directorio-institucional/placeholder.webp';"
                     style="object-fit: cover; width: 100%; height: 200px;">
              </div>
              <div class="card-body d-flex flex-column">
                <h5 class="card-title fw-bold">${persona.nombre}</h5>
                <p class="card-text text-brand fw-semibold mb-2">${persona.cargo}</p>
                <p class="card-text text-muted small mb-3">
                  <i class="bi bi-telephone-fill me-1"></i> PBX: +57 602 891 2317
                </p>
                <div class="mt-auto">
                  ${emailButton}
                </div>
              </div>
            </div>
          </div>
        `;
    }

    // Función para poblar el directorio con manejo asíncrono
    async function poblarDirectorio() {
        if (!gerenteContainer) return; // Si no están los contenedores, no hacer nada

        const gerente = directorioData.find(p => p.area === 'gerencia');
        const asesores = directorioData.filter(p => p.area === 'asesor');
        const subAdmin = directorioData.find(p => p.area === 'subgerencia_admin');
        const subCientifica = directorioData.find(p => p.area === 'subgerencia_cientifica');
        const administrativos = directorioData.filter(p => p.area === 'administrativa');
        const asistenciales = directorioData.filter(p => p.area === 'asistencial');

        try {
            // Cargar el gerente
            if (gerente) {
                gerenteContainer.innerHTML = await crearTarjeta(gerente, true);
            }
            
            // Cargar asesores
            if (asesoresContainer && asesores.length > 0) {
                const asesoresHTML = await Promise.all(asesores.map(p => crearTarjeta(p, true)));
                asesoresContainer.innerHTML = asesoresHTML.join('');
            }
            
            // Cargar subgerentes
            if (subAdmin) {
                subAdminContainer.innerHTML = await crearTarjeta(subAdmin, true);
            }
            
            if (subCientifica) {
                subCientificaContainer.innerHTML = await crearTarjeta(subCientifica, true);
            }

            // Cargar personal administrativo y asistencial
            const adminHTML = await Promise.all(administrativos.map(p => crearTarjeta(p)));
            adminContainer.innerHTML = adminHTML.join('');
            
            const asistencialHTML = await Promise.all(asistenciales.map(p => crearTarjeta(p)));
            asistencialContainer.innerHTML = asistencialHTML.join('');
            
        } catch (error) {
            console.error('Error al cargar el directorio:', error);
            
            // Mostrar mensaje de error en la interfaz
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.textContent = 'Error al cargar el directorio. Por favor, recarga la página.';
            
            if (gerenteContainer) {
                gerenteContainer.parentNode.insertBefore(errorMessage, gerenteContainer.nextSibling);
            } else if (document.querySelector('main')) {
                document.querySelector('main').prepend(errorMessage);
            }
        }
    }

    function configurarFiltro() {
        if (!searchInput) return;

        searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            const cards = document.querySelectorAll('.directorio-card-col');
            let visibleCount = 0;
            
            cards.forEach(cardCol => {
                const nameElement = cardCol.querySelector('.card-title');
                const positionElement = cardCol.querySelector('.card-text');
                const name = nameElement ? nameElement.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : "";
                const position = positionElement ? positionElement.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : "";

                if (name.includes(filter) || position.includes(filter)) {
                    cardCol.style.display = '';
                    visibleCount++;
                } else {
                    cardCol.style.display = 'none';
                }
            });

            // Opcional: Mostrar un mensaje si no hay resultados
            const noResults = document.getElementById('no-results-message');
            if (noResults) {
                noResults.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    }

    // Iniciar la carga del directorio
    poblarDirectorio().then(() => {
        console.log('Directorio cargado exitosamente');
    }).catch(error => {
        console.error('Error al cargar el directorio:', error);
    });
    
    configurarFiltro();
});