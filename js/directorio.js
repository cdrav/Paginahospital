// js/directorio.js

document.addEventListener('DOMContentLoaded', () => {
    // Datos del personal.
    const directorioData = [
        { nombre: "Gilberto Taborda", cargo: "Medico General", email: "auditormedico@hdsa.gov.co", foto: "gilberto-taborda.jpg" },
        { nombre: "Claudia Lorena Salazar", cargo: "Gestión Documental", email: "hdsa@hospitalroldanillo.gov.co", foto: "Claudia-lorena-salazar.jpg" },
        { nombre: "Daniela Moreno Murcia", cargo: "Coordinadora de laboratorio", email: "laboratorio@hdsa.gov.co", foto: "daniela-moreno-murcia.jpg" },
        { nombre: "Julian Hernandez", cargo: "Asesor Jurídico", email: "", foto: "julian-hernandez.jpg" },
        { nombre: "Amalia Diaz", cargo: "Tecnico Area Salud", email: "hdsa@hospitalroldanillo.gov.co", foto: "amalia-diaz.jpg" },
        { nombre: "Claudia Velez", cargo: "Jefe de cirugía", email: "hdsa@hospitalroldanillo.gov.co", foto: "claudia-velez.jpg" },
        { nombre: "Diana Marcela Benitez", cargo: "Promoción y prevención", email: "hdsa@hospitalroldanillo.gov.co", foto: "diana-Marcela-Benitez.jpg" },
        { nombre: "Dolor Alvarado", cargo: "Coordinadora servicios generales", email: "hdsa@hospitalroldanillo.gov.co", foto: "dolor-alvarado.jpg" },
        { nombre: "Dubisa Alvarez", cargo: "Gefe Enfermeria", email: "hdsa@hospitalroldanillo.gov.co", foto: "dubisa-alvarez.jpg" },
        { nombre: "Eliana Bermudez", cargo: "Tecnico Area Salud", email: "hdsa@hospitalroldanillo.gov.co", foto: "eliana-bermudez.jpg" },
        { nombre: "Isabel Cañizares", cargo: "Coordinadora facturación", email: "hdsa@hospitalroldanillo.gov.co", foto: "isabel-cañizares.jpg" },
        { nombre: "Julian Humberto Velez", cargo: "Medico General", email: "coordinacionmedica@hdsa.gov.co", foto: "julian-humberto-velez.jpg" },
        { nombre: "Lina Maria Madrid", cargo: "Terapia Fisica", email: "apterapeutico@hdsa.gov.co", foto: "lina-maria-madrid.jpg" },  
        { nombre: "Lorena Nieto", cargo: "Enfermero", email: "hdsa@hospitalroldanillo.gov.co", foto: "lorena-nieto.jpg" },
        { nombre: "Luis Nieto", cargo: "Auxiliar Administrativo", email: "coord.estadistica@hdsa.gov.co", foto: "luis-nieto.jpg" },
        { nombre: "Maria Camila Zapata", cargo: "Coordinadora odontología", email: "hdsa@hospitalroldanillo.gov.co", foto: "maria-camila-zapata.jpg" },
        { nombre: "Olga Martines", cargo: "Contrataccion", email: "hospitalizacion@hdsa.gov.co", foto: "olga-martinez.jpg" },
        { nombre: "Oscar Orley Romero", cargo: "Talento Humano", email: "talentohumano@hdsa.gov.co", foto: "oscar-orley-romero.jpg" },
        { nombre: "Paulo Castillo Ferreira", cargo: "Asesor de Calidad", email: "hdsa@hospitalroldanillo.gov.co", foto: "paulo-castillo-ferreira.jpg" },
        { nombre: "Robert Giraldo", cargo: "Auxiliar Administrativo", email: "coord.sistemas@hdsa.gov.co", foto: "robert-giraldo.jpg" },
        { nombre: "Rodrigo Torres", cargo: "Presupuesto", email: "presupuesto@hdsa.gov.co", foto: "rodrigo-torres.jpg" },
        { nombre: "Rosa Maria Clavijo", cargo: "Contadora", email: "hdsa@hospitalroldanillo.gov.co", foto: "rosa-maria-clavijo.jpg" },
        { nombre: "Sandra Milena Chaverra", cargo: "Gefe almacén", email: "hospitalizacion@hdsa.gov.co", foto: "sandra-chaverra.jpg" },
        { nombre: "Sebastian Sarria", cargo: "Biomedico", email: "hdsa@hospitalroldanillo.gov.co", foto: "sebastian-sarria.jpg" },
        { nombre: "Stephany Arango", cargo: "Tesorera", email: "tesoreria@hdsa.gov.co", foto: "Stephany-Arango.jpg" },
        { nombre: "Victor Rengifo", cargo: "Subdirector cientifico", email: "hdsa@hospitalroldanillo.gov.co", foto: "victor-rengifo.jpg" },
        { nombre: "Wilmar Benitez", cargo: "Gefe de mantenimiento", email: "hdsa@hospitalroldanillo.gov.co", foto: "wilmar-benitez.jpg" },
        { nombre: "Yaraví Maite Llanos", cargo: "Subgerente", email: "subgerencia@hdsa.gov.co", foto: "yaravi-maite llanos.jpg" },
        { nombre: "Yeimi Carolina Espinoza", cargo: "", email: "", foto: "yeimi-carolina espinoza.jpg" },
        { nombre: "Zoraida Idarraga", cargo: "Control Interno", email: "hdsa@hospitalroldanillo.gov.co", foto: "zoraida-idarraga.jpg" },
        { nombre: "Lorena Rios", cargo: "Seguridad y Salud", email: "medicinalaboral@hdsa.gov.co", foto: "lorena-rios.jpg" },
        
    ];

    const container = document.getElementById('directorio-container');
    const searchInput = document.getElementById('directorio-search');

    function generarTarjetas(data) {
        if (!container) return;
        container.innerHTML = ''; // Limpiar contenedor por si acaso
        
        data.forEach(persona => {
            const col = document.createElement('div');
            col.className = 'col directorio-card-col';
            col.innerHTML = `
              <div class="card h-100 text-center shadow-sm border-0 hover-card">
                <img src="imagenes/Fotos-directorio-institucional/${persona.foto}" class="card-img-top directorio-card-img" alt="Foto de ${persona.nombre}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x500.png?text=Foto+No+Disponible';">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold">${persona.nombre}</h5>
                  <p class="card-text text-brand fw-semibold mb-3">${persona.cargo}</p>
                  <div class="mt-auto">
                    <a href="mailto:${persona.email}" class="btn btn-outline-brand btn-sm rounded-pill">
                      <i class="bi bi-envelope me-1"></i> Contactar
                    </a>
                  </div>
                </div>
              </div>
            `;
            container.appendChild(col);
        });
    }

    function configurarFiltro() {
        if (!searchInput) return;

        searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            const cards = document.querySelectorAll('.directorio-card-col');
            
            cards.forEach(cardCol => {
                const nameElement = cardCol.querySelector('.card-title');
                const positionElement = cardCol.querySelector('.card-text');
                const name = nameElement ? nameElement.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : "";
                const position = positionElement ? positionElement.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : "";

                if (name.includes(filter) || position.includes(filter)) {
                    cardCol.style.display = '';
                } else {
                    cardCol.style.display = 'none';
                }
            });
        });
    }

    // Generar tarjetas y luego configurar el filtro
    generarTarjetas(directorioData);
    configurarFiltro();
});