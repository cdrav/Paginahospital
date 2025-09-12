// js/directorio.js

document.addEventListener('DOMContentLoaded', () => {
    // Datos del personal con área jerárquica.
    const directorioData = [
        // Nivel 1: Gerencia
        { nombre: "Mauricio Saldarriaga", cargo: "Gerente", email: "gerencia@hdsa.gov.co", foto: "mauricio-saldarriaga.jpeg", area: "gerencia" },

        // Nivel 2: Asesores calidad y control interno
       { nombre: "Paulo Castillo Ferreira", cargo: "Jefe Oficina de Calidad", email: "asesorcalidad@hdsa.gov.co", foto: "paulo-castillo-ferreira.jpg", area: "asesor" },
       { nombre: "Zoraida Idarraga", cargo: "Jefe Oficina de Control Interno", email: "controlinterno@hdsa.gov.co", foto: "zoraida-idarraga.jpg", area: "asesor" },
       { nombre: "Julian Hernandez", cargo: "Asesor Jurídico", email: "notificacionesjudiciales@hdsa.gov.co", foto: "julian-hernandez.jpg", area: "asesor" },

        // Nivel 3: Subgerencias
        { nombre: "Yaraví Maite Llanos", cargo: "Subgerente Administrativa", email: "subgerencia@hdsa.gov.co", foto: "yaravi-maite llanos.jpg", area: "subgerencia_admin" },
        { nombre: "Victor Rengifo", cargo: "Subdirector Científico", email: "subdireccioncientifica@hdsa.gov.co", foto: "victor-rengifo.jpg", area: "subgerencia_cientifica" },

        // Nivel 4: Área Asistencial / Científica
        { nombre: "Gilberto Taborda", cargo: "Auditor Medico", email: "auditormedico@hdsa.gov.co", foto: "gilberto-taborda.jpg", area: "asistencial" },
        { nombre: "Julian Humberto Velez", cargo: "Coordinador Médico", email: "coordinacionmedica@hdsa.gov.co", foto: "julian-humberto-velez.jpg", area: "asistencial" },
        { nombre: "Claudia Velez", cargo: "Jefe de Cirugía", email: "cirugia@hdsa.gov.co", foto: "claudia-velez.jpg", area: "asistencial" },
        { nombre: "Daniela Moreno Murcia", cargo: "Coordinadora de Laboratorio", email: "laboratorio@hdsa.gov.co", foto: "daniela-moreno-murcia.jpg", area: "asistencial" },
        { nombre: "Diana Marcela Benitez", cargo: "Jefe enfermería Promoción y Prevención", email: "pyp@hdsa.gov.co", foto: "diana-Marcela-Benitez.jpg", area: "asistencial" },
        { nombre: "Dubisa Alvarez", cargo: "Jefe de Enfermería", email: "urgencias@hdsa.gov.co", foto: "dubisa-alvarez.jpg", area: "asistencial" },
        { nombre: "Lina Maria Madrid", cargo: "Terapia Física", email: "apterapeutico@hdsa.gov.co", foto: "lina-maria-madrid.jpg", area: "asistencial" },
        { nombre: "Lorena Nieto", cargo: "Jefe Enfermería Hospitalización ", email: "urgencias@hdsa.gov.co", foto: "lorena-nieto.jpg", area: "asistencial" },
        { nombre: "Maria Camila Zapata", cargo: "Coordinadora Odontología", email: "odontologia@hdsa.gov.co", foto: "maria-camila-zapata.jpg", area: "asistencial" },
        { nombre: "Sebastian Sarria", cargo: "Biomédico", email: "mantenimiento@hdsa.gov.co", foto: "sebastian-sarria.jpg", area: "asistencial" },
        { nombre: "Amalia Diaz", cargo: "Tecnóloga de Radilogía", email: "tecnóloga de Radilogía", email: "radiologia@hdsa.gov.co ", foto: "amalia-diaz.jpg", area: "asistencial" },
        { nombre: "Lorena Rios", cargo: "Seguridad y Salud en el Trabajo", email: "medicinalaboral@hdsa.gov.co", foto: "lorena-rios.jpg", area: "asistencial" },
        { nombre: "Yeimi Carolina Espinoza", cargo: "Jefe enfermería Ruta Desnutrición", email: "rutadesnutricion@hdsa.gov.co", foto: "yeimi-carolina espinoza.jpg", area: "asistencial" },
        
        // Nivel 5: Área Administrativa
        { nombre: "Stephany Arango", cargo: "Tesorera", email: "tesoreria@hdsa.gov.co", foto: "Stephany-Arango.jpg", area: "administrativa" },
        { nombre: "Rosa Maria Clavijo", cargo: "Contadora", email: "contabilidad@hdsa.gov.co", foto: "rosa-maria-clavijo.jpg", area: "administrativa" },
        { nombre: "Oscar Orley Romero", cargo: "Talento Humano", email: "talentohumano@hdsa.gov.co", foto: "oscar-orley-romero.jpg", area: "administrativa" },
        { nombre: "Olga Martinez", cargo: "Contratación", email: "contratacion@hdsa.gov.co", foto: "olga-martinez.jpg", area: "administrativa" },
        { nombre: "Sandra Milena Chaverra", cargo: "Jefe de Almacén", email: "almacen@hdsa.gov.co", foto: "sandra-chaverra.jpg", area: "administrativa" },
        { nombre: "Dolly Asevena Alvarado", cargo: "Coordinadora Servicios Generales", email: "serv.generales@hdsa.gov.co", foto: "dolly-asevena-alvarado.jpg", area: "administrativa" },
        { nombre: "Wilmar Benitez", cargo: "Jefe de Mantenimiento", email: "mantenimiento@hdsa.gov.co", foto: "wilmar-benitez.jpg", area: "administrativa" },
        { nombre: "Claudia Lorena Salazar", cargo: "Gestión Documental", email: "gestiondocumental@hdsa.gov.co", foto: "Claudia-lorena-salazar.jpg", area: "administrativa" },
        { nombre: "Eliana Bermudez", cargo: "Coordinadora SIAU", email: "coord.siau@hdsa.gov.co", foto: "eliana-bermudez.jpg", area: "administrativa" },
        { nombre: "Isabel Cañizares", cargo: "Coordinadora Facturación", email: "facturacion@hdsa.gov.co", foto: "isabel-cañizares.jpg", area: "administrativa" },
        { nombre: "Luis Nieto", cargo: "Coordinador de Estadística", email: "coord.estadistica@hdsa.gov.co", foto: "luis-nieto.jpg", area: "administrativa" },
        { nombre: "Robert Giraldo", cargo: "Coordinador de Sistemas", email: "coord.sistemas@hdsa.gov.co", foto: "robert-giraldo.jpg", area: "administrativa" },
        { nombre: "Rodrigo Torres", cargo: "Presupuesto", email: "presupuesto@hdsa.gov.co", foto: "rodrigo-torres.jpg", area: "administrativa" },
        
    ];

    const searchInput = document.getElementById('directorio-search');

    // Contenedores para la nueva estructura
    const gerenteContainer = document.getElementById('directorio-gerente');
    const asesoresContainer = document.getElementById('directorio-asesores');
    const subAdminContainer = document.getElementById('directorio-subgerencia-admin');
    const subCientificaContainer = document.getElementById('directorio-subgerencia-cientifica');
    const adminContainer = document.getElementById('directorio-administrativos');
    const asistencialContainer = document.getElementById('directorio-asistenciales');

    function crearTarjeta(persona, esPrincipal = false) {
        const cardClass = esPrincipal ? 'directorio-card-principal' : '';
        const emailButton = persona.email 
            ? `<a href="mailto:${persona.email}" class="btn btn-outline-brand btn-sm rounded-pill directorio-email-btn w-100">
                 <i class="bi bi-envelope me-1"></i><span class="email-text">${persona.email}</span>
               </a>`
            : `<button class="btn btn-outline-secondary btn-sm rounded-pill" disabled>
                 <i class="bi bi-envelope-slash me-1"></i> No disponible
               </button>`;

        return `
          <div class="col directorio-card-col">
            <div class="card h-100 text-center shadow-sm border-0 hover-card ${cardClass}">
              <div class="directorio-img-wrapper">
                <img src="imagenes/Fotos-directorio-institucional/${persona.foto}" class="card-img-top" alt="Foto de ${persona.nombre}" onerror="this.onerror=null;this.src='imagenes/Fotos-directorio-institucional/placeholder.jpg';">
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

    function poblarDirectorio() {
        if (!gerenteContainer) return; // Si no están los contenedores, no hacer nada

        const gerente = directorioData.find(p => p.area === 'gerencia');
        const asesores = directorioData.filter(p => p.area === 'asesor');
        const subAdmin = directorioData.find(p => p.area === 'subgerencia_admin');
        const subCientifica = directorioData.find(p => p.area === 'subgerencia_cientifica');
        const administrativos = directorioData.filter(p => p.area === 'administrativa');
        const asistenciales = directorioData.filter(p => p.area === 'asistencial');

        if (gerente) gerenteContainer.innerHTML = crearTarjeta(gerente, true);
        if (asesoresContainer && asesores.length > 0) {
            asesoresContainer.innerHTML = asesores.map(p => crearTarjeta(p, true)).join('');
        }
        if (subAdmin) subAdminContainer.innerHTML = crearTarjeta(subAdmin, true);
        if (subCientifica) subCientificaContainer.innerHTML = crearTarjeta(subCientifica, true);

        adminContainer.innerHTML = administrativos.map(p => crearTarjeta(p)).join('');
        asistencialContainer.innerHTML = asistenciales.map(p => crearTarjeta(p)).join('');
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

    poblarDirectorio();
    configurarFiltro();
});