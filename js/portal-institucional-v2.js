import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, storage } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, orderBy, getDocs, where, limit, arrayUnion, Timestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Protección de ruta: Firebase verifica si hay usuario activo
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Si no hay usuario, mandar al login
        window.location.href = 'login-institucional.html';
    } else {
        console.log("Usuario autenticado:", user.email);
        
        // Mostrar mensaje de bienvenida
        const welcomeElement = document.getElementById('user-welcome');
        if (welcomeElement) welcomeElement.textContent = `Hola, ${user.email}`;

        // --- Lógica de Administrador ---
        // Lista de correos autorizados para ver los paneles de administración.
        const ADMIN_EMAILS = [
            'coord.sistemas@hdsa.gov.co',
            'citas@hdsa.gov.co', // Nuevo correo institucional para citas
        ];

        // Comprueba si el usuario actual está en la lista de administradores.
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            const adminCard = document.getElementById('admin-card');
            const firebaseCard = document.getElementById('firebase-card');
            const hojaVidaPcCard = document.getElementById('hoja-vida-pc-card');
            const citasAdminCard = document.getElementById('citas-admin-card');
            const intranetCard = document.getElementById('intranet-card');
            
            if (adminCard) adminCard.classList.remove('d-none');
            if (firebaseCard) firebaseCard.classList.remove('d-none');
            if (hojaVidaPcCard) hojaVidaPcCard.classList.remove('d-none');
            if (citasAdminCard) citasAdminCard.classList.remove('d-none');
            if (intranetCard) intranetCard.classList.remove('d-none');

            // Inicializar el panel de administración de citas
            initCitasAdmin();
            
            // Inicializar el módulo de Intranet (Planeación y Calidad)
            initIntranetPlaneacion();
        }
    }
});

// Lógica de la página
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login-institucional.html';
            });
        });
    }

    const mainCardsContainer = document.getElementById('main-cards-container');

    // --- Lógica para mostrar/ocultar paneles ---

    // Panel de Gestión de Citas
    const citasAdminPanel = document.getElementById('citas-admin-panel');
    const btnShowCitas = document.getElementById('btn-show-citas-panel');
    const btnHideCitas = document.getElementById('btn-hide-citas-panel');

    if (btnShowCitas && mainCardsContainer && citasAdminPanel) {
        btnShowCitas.addEventListener('click', () => {
            mainCardsContainer.classList.add('d-none');
            citasAdminPanel.classList.remove('d-none');
        });
    }
    if (btnHideCitas && mainCardsContainer && citasAdminPanel) {
        btnHideCitas.addEventListener('click', () => {
            citasAdminPanel.classList.add('d-none');
            mainCardsContainer.classList.remove('d-none');
        });
    }

    // Panel de Intranet (Mapa de Procesos)
    const intranetPanel = document.getElementById('intranet-panel');
    const btnShowIntranet = document.getElementById('btn-show-intranet-panel');
    const btnHideIntranet = document.getElementById('btn-hide-intranet-panel');

    if (btnShowIntranet && mainCardsContainer && intranetPanel) {
        btnShowIntranet.addEventListener('click', () => {
            mainCardsContainer.classList.add('d-none');
            intranetPanel.classList.remove('d-none');
        });
    }
    if (btnHideIntranet && mainCardsContainer && intranetPanel) {
        btnHideIntranet.addEventListener('click', () => {
            intranetPanel.classList.add('d-none');
            mainCardsContainer.classList.remove('d-none');
        });
    }
    
    // Event listeners para los botones de ver detalles y cambiar estado
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.view-details-btn')) {
            const btn = e.target.closest('.view-details-btn');    
            const docId = btn.dataset.docId;
            await showCitaDetails(docId);
        }

        if (e.target.closest('.responder-email-btn')) {
            const btn = e.target.closest('.responder-email-btn');
            const docId = btn.dataset.docId;
            const radicado = btn.dataset.radicado;
            const pacienteEmail = btn.dataset.email;            
            openEmailModal(docId, pacienteEmail, radicado);
        }

        if (e.target.closest('.descargar-archivo-btn')) {
            const btn = e.target.closest('.descargar-archivo-btn');
            const fileUrl = btn.dataset.url;
            const fileName = btn.dataset.name;
            await downloadFile(fileUrl, fileName);
        }
    });

    // Event listener para tarjetas de estadísticas clickables
    const statsDashboard = document.getElementById('stats-dashboard');
    if (statsDashboard) {
        statsDashboard.addEventListener('click', (e) => {
            const card = e.target.closest('.stat-card-clickable');
            if (!card || !card.dataset.statusFilter) return;

            const filterValue = card.dataset.statusFilter;
            const statusFilterEl = document.getElementById('filter-status');
            const searchInputEl = document.getElementById('filter-search');
            
            if (statusFilterEl) {
                statusFilterEl.value = filterValue;
            }
            // Limpiar búsqueda de texto al filtrar por tarjeta para evitar conflictos
            if (searchInputEl) {
                searchInputEl.value = '';
            }

            // Recargar la tabla con el nuevo filtro
            initCitasAdmin();

            // Scroll suave hacia la tabla para ver los resultados
            const table = document.querySelector('#citas-admin-panel .card.shadow-sm');
            if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Event listener separado para el cambio de estado (usar change en lugar de click)
    document.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-select')) {
            const select = e.target;
            const docId = select.dataset.docId;
            const newStatus = select.value;
            
            // Confirmar antes de cambiar
            if (confirm(`¿Cambiar estado a "${newStatus}"?`)) {
                const prevStatus = select.getAttribute('data-original-status');
                await updateCitaStatus(docId, newStatus, prevStatus);
            } else {
                // Restaurar el valor original si se cancela
                const originalStatus = select.getAttribute('data-original-status');
                if (originalStatus) {
                    select.value = originalStatus;
                }
            }
        }
    });

    // Filtros
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            initCitasAdmin(); // Recargar con los nuevos filtros
        });
    }

    // Exportar a Excel (.xlsx)
    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', exportCitasToExcel);
    }

    // Exportar a PDF
    const btnExportPDF = document.getElementById('btn-export-pdf');
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', exportCitasToPDF);
    }
    
    // Búsqueda en tiempo real (debounce para no saturar)
    const searchInput = document.getElementById('filter-search');
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                initCitasAdmin();
            }, 500);
        });
    }
});

/**
 * Inicializa el panel de administración de citas.
 * Ahora soporta filtros para optimizar lecturas.
 */
let currentCitasData = []; // Variable global para almacenar los datos actuales y poder exportarlos
let citasQueryLimit = 20; // Límite inicial de citas a cargar (Paginación)
let unsubscribeCitas = null; // Variable para almacenar la suscripción y poder cancelarla

function initCitasAdmin() {
    let q = collection(db, "citasOnline");
    
    const statusFilter = document.getElementById('filter-status')?.value || 'active';
    const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;

    // Optimización: Filtrar por estado en Firebase si no es búsqueda de texto
    // Nota: Firebase tiene limitaciones con múltiples filtros where + orderBy sin índices compuestos.
    // Para simplificar y mantener flexibilidad sin crear muchos índices manuales, 
    // descargaremos un lote razonable y filtraremos en cliente lo complejo.
    
    // Construcción de Query
    let constraints = [];
    
    if (statusFilter === 'active') {
        constraints.push(where("status", "in", ["Solicitada", "En Proceso"]));
    } else if (statusFilter !== 'all') {
        constraints.push(where("status", "==", statusFilter));
    }

    // Filtro por rango de fechas sobre el campo 'createdAt'
    if (dateFrom) {
        constraints.push(where("createdAt", ">=", Timestamp.fromDate(new Date(dateFrom + 'T00:00:00'))));
    }
    if (dateTo) {
        constraints.push(where("createdAt", "<=", Timestamp.fromDate(new Date(dateTo + 'T23:59:59'))));
    }

    // Siempre ordenar por fecha descendente
    constraints.push(orderBy("createdAt", "desc"));
    
    // Limitar resultados para eficiencia (paginación implícita)
    // Usamos la variable global citasQueryLimit que aumenta al dar clic en "Cargar más"
    if (!searchTerm) {
        constraints.push(limit(citasQueryLimit));
    } else {
        // Si hay búsqueda, aumentamos el límite para buscar en un set más amplio
        constraints.push(limit(100));
    }

    q = query(q, ...constraints);
    
    // Mostrar spinner de carga
    const loadingSpinner = document.getElementById('citas-loading');
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    // Detener el listener anterior si existe para evitar duplicados y fugas de memoria
    if (unsubscribeCitas) {
        unsubscribeCitas();
    }

    // Usamos onSnapshot para tiempo real, pero cuidado con los costos si hay muchas escrituras.
    unsubscribeCitas = onSnapshot(q, (querySnapshot) => {
        const citas = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filtrar registros incompletos para evitar errores en reportes y tabla
            if (!data.paciente || !data.especialidad) {
                return;
            }

            // Filtrado en cliente para búsqueda de texto (nombre o documento)
            if (searchTerm) {
                const nombreCompleto = `${data.paciente.nombres} ${data.paciente.apellidos}`.toLowerCase();
                const documento = data.paciente.numeroDocumento || '';
                if (nombreCompleto.includes(searchTerm) || documento.includes(searchTerm)) {
                    citas.push({ id: doc.id, ...data });
                }
            } else {
                citas.push({ id: doc.id, ...data });
            }
        });
        
        currentCitasData = citas; // Guardar referencia para exportación
        updateStatistics(citas); // Calcular estadísticas con los datos cargados
        renderCitasTable(citas, querySnapshot.size);
    }, (error) => {
        console.error("Error al cargar citas:", error);
        document.getElementById('citas-table-body').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar las solicitudes.</td></tr>`;
        document.getElementById('citas-loading').classList.add('d-none');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ... (código existente) ...
    
    // Event listener para el botón "Cargar más"
    const btnLoadMore = document.getElementById('btn-load-more-citas');
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', () => {
            citasQueryLimit += 20; // Aumentar límite en 20
            const btnHtml = btnLoadMore.innerHTML;
            btnLoadMore.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';
            btnLoadMore.disabled = true;
            
            // Recargar con nuevo límite
            // Nota: initCitasAdmin es rápida pero onSnapshot tardará un poco en traer los nuevos datos
            initCitasAdmin(); 
            
            // Restaurar botón (la UI se actualizará cuando llegue el snapshot)
            setTimeout(() => {
                btnLoadMore.innerHTML = btnHtml;
                btnLoadMore.disabled = false;
            }, 1000);
        });
    }
    
    // Resetear límite al aplicar filtros nuevos para no cargar de más innecesariamente
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            citasQueryLimit = 20; // Resetear
            // initCitasAdmin(); // Ya se llama en el código original
        });
    }
});

/**
 * Calcula y actualiza las estadísticas del dashboard
 */
function updateStatistics(citas) {
    const stats = {
        solicitada: 0,
        proceso: 0,
        confirmada: 0,
        atendida: 0,
        cancelada: 0,
        total: citas.length
    };

    citas.forEach(cita => {
        const status = cita.status || 'Solicitada';
        if (status === 'Solicitada') stats.solicitada++;
        else if (status === 'En Proceso') stats.proceso++;
        else if (status === 'Confirmada') stats.confirmada++;
        else if (status === 'Atendida') stats.atendida++;
        else if (status === 'Cancelada') stats.cancelada++;
    });

    // Actualizar DOM con animación simple
    animateValue("stat-solicitada", stats.solicitada);
    animateValue("stat-proceso", stats.proceso);
    animateValue("stat-confirmada", stats.confirmada);
    animateValue("stat-atendida", stats.atendida);
    animateValue("stat-cancelada", stats.cancelada);
    animateValue("stat-total", stats.total);
}

function animateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/**
 * Renderiza las filas de la tabla de citas con mejoras.
 * @param {Array} citas - Datos de las citas
 * @param {number} totalLoaded - Cantidad total cargada actualmente (para lógica de botón)
 */
function renderCitasTable(citas, totalLoaded) {
    const tableBody = document.getElementById('citas-table-body');
    const loadingSpinner = document.getElementById('citas-loading');
    const noResults = document.getElementById('citas-no-results');
    const btnLoadMore = document.getElementById('btn-load-more-citas');
    const infoText = document.getElementById('citas-showing-info');

    if (!tableBody || !loadingSpinner || !noResults) return;

    loadingSpinner.classList.add('d-none');
    tableBody.innerHTML = '';

    if (citas.length === 0) {
        noResults.classList.remove('d-none');
        if (btnLoadMore) btnLoadMore.classList.add('d-none');
        if (infoText) infoText.textContent = '';
        return;
    }

    noResults.classList.add('d-none');
    
    // Lógica del botón "Cargar más"
    if (btnLoadMore && infoText) {
        const searchTerm = document.getElementById('filter-search')?.value;
        
        if (searchTerm) {
            // En búsqueda no usamos paginación simple (el límite se maneja en la query de búsqueda)
            btnLoadMore.classList.add('d-none');
            infoText.textContent = `Resultados de búsqueda: ${citas.length}`;
        } else {
            infoText.textContent = `Mostrando ${citas.length} solicitudes más recientes`;
            
            // Si cargamos menos de lo que pedimos (ej. pedimos 20 y llegaron 15), es el final
            if (totalLoaded !== undefined && totalLoaded < citasQueryLimit) {
                btnLoadMore.classList.add('d-none');
                infoText.textContent += ' (Fin de los registros)';
            } else {
                btnLoadMore.classList.remove('d-none');
            }
        }
    }

    // Agrupar citas por estado para mejor organización
    const citasPorEstado = {
        'Solicitada': [],
        'En Proceso': [],
        'Confirmada': [],
        'Atendida': [],
        'Cancelada': []
    };

    citas.forEach(cita => {
        // Validación mejorada con más detalles
        if (!cita.paciente) {
            console.warn('⚠️ Cita sin datos de paciente:', cita.id, cita);
            return;
        }
        
        if (!cita.especialidad) {
            console.warn('⚠️ Cita sin especialidad:', cita.id, cita);
            return;
        }

        const status = cita.status || 'Solicitada';
        if (citasPorEstado[status]) {
            citasPorEstado[status].push(cita);
        } else {
            console.warn('⚠️ Estado desconocido:', status, 'para cita:', cita.id);
            // Agregar a Solicitadas por defecto
            citasPorEstado['Solicitada'].push(cita);
        }
    });

    // Renderizar citas agrupadas por estado
    let htmlContent = '';
    Object.keys(citasPorEstado).forEach(status => {
        if (citasPorEstado[status].length > 0) {
            htmlContent += `
                <tr class="table-group-header">
                    <td colspan="6" class="bg-light text-center fw-bold text-primary py-2">
                        <i class="bi bi-folder-fill me-2"></i>${status} (${citasPorEstado[status].length})
                    </td>
                </tr>
            `;
            
            citasPorEstado[status].forEach(cita => {
                const fechaSolicitud = cita.createdAt?.toDate().toLocaleDateString('es-CO') || 'N/A';
                const statusBadge = getStatusBadge(status);
                const radicadoToShow = cita.radicado || cita.id;

                htmlContent += `
                    <tr class="cita-row" data-status="${status}">
                        <td data-label="Radicado"><small class="text-muted fw-bold">${radicadoToShow}</small></td>
                        <td data-label="Paciente">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-person-circle text-primary fs-5"></i>
                                </div>
                                <div>
                                    <strong>${cita.paciente.nombres || 'N/A'} ${cita.paciente.apellidos || 'N/A'}</strong>
                                    <small class="d-block text-muted">${cita.paciente.numeroDocumento || 'N/A'}</small>
                                </div>
                            </div>
                        </td>
                        <td data-label="Especialidad">
                            <span class="badge bg-info text-white">
                                <i class="bi bi-hospital me-1"></i>${cita.especialidad.nombre || 'N/A'}
                            </span>
                        </td>
                        <td data-label="Fecha Solicitud">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-calendar-event text-muted me-2"></i>
                                <span>${fechaSolicitud}</span>
                            </div>
                        </td>
                        <td data-label="Estado">${statusBadge}</td>
                        <td data-label="Acciones">
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary view-details-btn" data-doc-id="${cita.id}">
                                    <i class="bi bi-eye-fill"></i> Ver
                                </button>
                                <button class="btn btn-sm btn-outline-info responder-email-btn" data-doc-id="${cita.id}" data-radicado="${radicadoToShow}" data-email="${cita.paciente.correo || ''}">
                                    <i class="bi bi-envelope-fill"></i> Responder
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    });

    tableBody.innerHTML = htmlContent;
}

/**
 * Abre y configura el modal para enviar una respuesta por email al paciente.
 * Esta función ahora es la única encargada de manejar el modal de email.
 * @param {string} citaId - El ID del documento de la cita.
 * @param {string} pacienteEmail - El correo del paciente a quien se responderá.
 * @param {string} radicado - El número de radicado visible para el usuario.
 */
function openEmailModal(citaId, pacienteEmail, radicado) {
    const emailModalEl = document.getElementById('emailModal');
    if (!emailModalEl) {
        console.error('❌ Modal de email no encontrado');
        alert('Error: Modal de email no disponible. Por favor recargue la página.');
        return;
    }

    // Obtener elementos del formulario
    const emailToInput = document.getElementById('emailTo');
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    const emailUpdateStatus = document.getElementById('emailUpdateStatus');
    const sendEmailBtn = document.getElementById('sendEmailBtn');

    if (!emailToInput || !emailSubject || !emailMessage || !emailUpdateStatus || !sendEmailBtn) {
        console.error('❌ Elementos del formulario de email no encontrados');
        alert('Error: Formulario de email incompleto. Por favor recargue la página.');
        return;
    }

    // Poblar el formulario con los datos de la cita
    emailToInput.value = pacienteEmail || '';
    emailSubject.value = `Respuesta a su solicitud de cita (Radicado: ${radicado || citaId.substring(0, 8) + '...'})`;
    emailMessage.value = generarPlantillaEmail();
    emailUpdateStatus.checked = true; // Marcar por defecto

    // Configurar el botón de envío para esta cita específica.
    // Usar .onclick para sobrescribir listeners anteriores y evitar envíos múltiples.
    sendEmailBtn.onclick = async () => {
        await handleManualEmailResponse(citaId, emailToInput.value, emailSubject.value, emailMessage.value, emailUpdateStatus.checked);
    };

    // Mostrar modal
    try {
        const modal = bootstrap.Modal.getInstance(emailModalEl) || new bootstrap.Modal(emailModalEl);
        modal.show();
        console.log('✅ Modal de email abierto para cita:', citaId);
    } catch (error) {
        console.error('❌ Error al abrir modal:', error);
        alert('Error al abrir el modal de email. Por favor recargue la página.');
    }
}

/**
 * Maneja la respuesta manual de correo (mailto) para evitar usar cuota de API.
 * 1. Actualiza el estado en Firebase.
 * 2. Abre el cliente de correo del usuario.
 */
async function handleManualEmailResponse(citaId, emailTo, subject, message, updateStatus) {
    if (!emailTo) {
        alert('El correo es obligatorio.');
        return;
    }

    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const originalText = sendEmailBtn.innerHTML;
    sendEmailBtn.disabled = true;
    sendEmailBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

    try {
        // 1. Actualizar estado en Firebase si se solicitó
        if (updateStatus) {
            await updateCitaStatus(citaId, 'En Proceso', 'Solicitada (Auto)');
            
            // Registrar en historial que se generó respuesta
            const docRef = doc(db, "citasOnline", citaId);
            await updateDoc(docRef, {
                historial: arrayUnion({
                    action: `Respuesta generada (Cliente Local)`,
                    user: auth.currentUser.email,
                    timestamp: new Date(),
                    details: `Asunto: ${subject}`
                })
            });
        }

        // 2. Abrir cliente de correo (Gmail/Outlook/App por defecto)
        // Codificar componentes para URL
        // Se agrega BCC a citas@hdsa.gov.co para asegurar que quede copia en el correo centralizador
        const mailtoLink = `mailto:${emailTo}?bcc=citas@hdsa.gov.co&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        
        // Abrir en nueva pestaña/ventana
        window.open(mailtoLink, '_blank');

        // 3. Cerrar modal y limpiar
        const modal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
        modal.hide();
        
        // Notificar al admin
        alert('✅ Estado actualizado. Se ha abierto su gestor de correo para enviar el mensaje final.');

    } catch (error) {
        console.error('Error al procesar respuesta manual:', error);
        alert('Error al actualizar la base de datos, pero puede enviar el correo manualmente.');
    } finally {
        sendEmailBtn.disabled = false;
        sendEmailBtn.innerHTML = originalText;
    }
}

/**
 * Exporta los datos actuales de la tabla a un archivo Excel (.xlsx) profesional.
 * Incluye filtros automáticos y ajuste de columnas.
 */
function exportCitasToExcel() {
    if (!currentCitasData || currentCitasData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    
    if (typeof XLSX === 'undefined') {
        alert("La librería de Excel no se cargó correctamente. Por favor recargue la página.");
        return;
    }

    // Definir encabezados
    const headers = ["ID/Radicado", "Fecha Solicitud", "Documento", "Paciente", "Teléfono", "Email", "Especialidad", "Fecha Cita", "Hora Cita", "Estado", "Motivo"];
    
    // Preparar datos para Excel (Matriz de datos)
    const data = currentCitasData.map(cita => {
        return [
            cita.radicado || cita.id,
            cita.createdAt?.toDate().toLocaleDateString('es-CO') || '',
            `${cita.paciente?.tipoDocumento || ''} ${cita.paciente?.numeroDocumento || ''}`,
            `${cita.paciente?.nombres || ''} ${cita.paciente?.apellidos || ''}`,
            cita.paciente?.telefono || '',
            cita.paciente?.correo || '',
            cita.especialidad?.nombre || 'Sin Especialidad',
            cita.fecha || '',
            cita.hora || '',
            cita.status || '',
            cita.motivoConsulta || ''
        ];
    });

    // Crear libro y hoja de cálculo
    const wb = XLSX.utils.book_new();
    // Combinar encabezados y datos
    const ws_data = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // --- MEJORAS VISUALES ---
    // 1. Agregar AutoFiltro a la primera fila (Encabezados)
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}1` };

    // 2. Ajustar anchos de columna (aproximados)
    const wscols = [
        {wch: 20}, // Radicado
        {wch: 15}, // Fecha Sol
        {wch: 15}, // Documento
        {wch: 30}, // Paciente
        {wch: 15}, // Teléfono
        {wch: 25}, // Email
        {wch: 20}, // Especialidad
        {wch: 12}, // Fecha Cita
        {wch: 10}, // Hora
        {wch: 12}, // Estado
        {wch: 40}  // Motivo
    ];
    ws['!cols'] = wscols;

    // Guardar archivo
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Citas");
    XLSX.writeFile(wb, `Reporte_Citas_HDSA_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Exporta los datos actuales de la tabla a un archivo PDF profesional.
 */
async function exportCitasToPDF() {
    const { jsPDF } = window.jspdf;
    if (typeof jsPDF === 'undefined') {
        alert("La librería para generar PDF no está disponible. Por favor, recargue la página.");
        return;
    }
    if (!currentCitasData || currentCitasData.length === 0) {
        alert("No hay datos para exportar a PDF.");
        return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    const tableData = currentCitasData.map(cita => [
        cita.radicado || cita.id.substring(0, 8),
        `${cita.paciente?.nombres || ''} ${cita.paciente?.apellidos || ''}`,
        cita.paciente?.numeroDocumento || '',
        cita.especialidad?.nombre || 'Sin Especialidad',
        cita.createdAt?.toDate().toLocaleDateString('es-CO') || 'N/A',
        cita.status
    ]);

    // --- Cargar y añadir logo ---
    try {
        const logoUrl = '/imagenes/Logo-hospital.png'; // Ruta al logo
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise(resolve => reader.onload = resolve);
        const logoDataUrl = reader.result;
        doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - 60, 10, 45, 18);
    } catch (error) {
        console.error("No se pudo cargar el logo para el PDF:", error);
    }

    // --- Encabezado del documento ---
    doc.setFontSize(18);
    doc.setTextColor(22, 68, 67); // Color primario
    doc.text("Reporte de Solicitudes de Citas", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-CO')}`, 14, 30);

    // --- Tabla de datos ---
    doc.autoTable({
        head: [['Radicado', 'Paciente', 'Documento', 'Especialidad', 'Fecha Solicitud', 'Estado']],
        body: tableData,
        startY: 38,
        theme: 'grid',
        headStyles: { fillColor: [22, 68, 67] }, // Color primario
        didDrawPage: function (data) {
            // --- Pie de página con numeración ---
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`reporte_citas_${new Date().toISOString().slice(0,10)}.pdf`);
}

/**
 * Obtiene el badge de estado con estilos apropiados.
 */
function getStatusBadge(status) {
    const badges = {
        'Solicitada': '<span class="badge bg-warning text-dark">Solicitada</span>',
        'Confirmada': '<span class="badge bg-info">Confirmada</span>',
        'Cancelada': '<span class="badge bg-danger">Cancelada</span>',
        'Atendida': '<span class="badge bg-success">Atendida</span>',
        'En Proceso': '<span class="badge bg-primary">En Proceso</span>'
    };
    return badges[status] || badges['Solicitada'];
}

// Hacer funciones clave globalmente accesibles para onclicks (aunque se recomienda delegación)
window.showCitaDetails = showCitaDetails;
window.openEmailModal = openEmailModal;


/**
 * Muestra los detalles completos de una cita incluyendo archivos.
 */
async function showCitaDetails(docId) {
    const modalElement = document.getElementById('modalDetallesCita');
    const modalBody = document.getElementById('modal-body-content');

    if (!modalElement || !modalBody) {
        console.error('Elementos del modal no encontrados.');
        return;
    }

    // Mostrar spinner y abrir el modal inmediatamente
    modalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    try {
        const docRef = doc(db, "citasOnline", docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            modalBody.innerHTML = '<div class="alert alert-warning">No se encontraron los detalles para esta cita.</div>';
            return;
        }

        const cita = docSnap.data();        
        
        // Validación de datos antes de mostrar
        if (!cita.paciente || !cita.especialidad) {
             modalBody.innerHTML = '<div class="alert alert-warning">La información de esta cita está incompleta o corrupta y no se puede visualizar.</div>';
             return;
        }
        
        // Renderizar Historial
        renderHistory(cita.historial);

        // Obtener URLs de descarga para los archivos
        let archivosHtml = '';
        if (cita.ordenesMedicas && cita.ordenesMedicas.length > 0) {
            archivosHtml = `
                <div class="mt-3">
                    <h6><i class="bi bi-file-earmark-text me-2"></i>Archivos Adjuntos:</h6>
                    <div class="list-group">
            `;
            
            for (const archivo of cita.ordenesMedicas) {
                // Determinar tipo de archivo para visualización
                const isImage = archivo.type.includes('image');
                const isPdf = archivo.type.includes('pdf');
                let previewHtml = '';

                if (isImage) {
                    previewHtml = `<div class="mt-2 text-center bg-light p-2 rounded">
                        <img src="${archivo.url}" alt="Vista previa" style="max-height: 150px; max-width: 100%; border-radius: 4px; cursor: pointer;" onclick="window.open('${archivo.url}', '_blank')">
                    </div>`;
                } else if (isPdf) {
                    previewHtml = `<div class="mt-2 text-center bg-light p-2 rounded">
                        <i class="bi bi-file-earmark-pdf text-danger" style="font-size: 3rem;"></i>
                        <small class="d-block text-muted mt-1">Vista previa no disponible. <a href="${archivo.url}" target="_blank" rel="noopener">Abrir PDF</a></small>
                    </div>`;
                }

                archivosHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="bi ${isImage ? 'bi-file-image' : (isPdf ? 'bi-file-pdf' : 'bi-file-earmark')} me-2"></i>
                                <strong>${archivo.name}</strong>
                                <small class="text-muted d-block">
                                    ${formatFileSize(archivo.size)} • ${archivo.type}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-success descargar-archivo-btn" 
                                    data-url="${archivo.url}" 
                                    data-name="${archivo.name}">
                                <i class="bi bi-download"></i> Descargar
                            </button>
                        </div>
                        ${previewHtml}
                    </div>
                `;
            }
            
            archivosHtml += '</div></div>';
        } else {
            archivosHtml = `
                <div class="mt-3">
                    <h6><i class="bi bi-file-earmark-text me-2"></i>Archivos Adjuntos:</h6>
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No hay archivos adjuntos ${cita.corsIssue ? '(Error de CORS al subir. Revisa la configuración de Firebase Storage)' : ''}
                    </div>
                </div>
            `;
        }

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-person-fill me-2"></i>Información del Paciente</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Documento:</strong></td><td>${cita.paciente.tipoDocumento} ${cita.paciente.numeroDocumento}</td></tr>
                        <tr><td><strong>Nombre:</strong></td><td>${cita.paciente.nombres} ${cita.paciente.apellidos}</td></tr>
                        <tr><td><strong>Teléfono:</strong></td><td>${cita.paciente.telefono}</td></tr>
                        <tr><td><strong>Correo:</strong></td><td>${cita.paciente.correo}</td></tr>
                        <tr><td><strong>EPS:</strong></td><td>${cita.paciente.eps}</td></tr>
                        <tr><td><strong>WhatsApp:</strong></td><td>${cita.tieneWhatsapp}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-calendar-fill me-2"></i>Detalles de la Cita</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Especialidad:</strong></td><td>${cita.especialidad.nombre}</td></tr>
                        <tr><td><strong>Fecha:</strong></td><td>${cita.fecha}</td></tr>
                        <tr><td><strong>Hora:</strong></td><td>${cita.hora}</td></tr>
                        <tr><td><strong>Estado:</strong></td><td>${getStatusBadge(cita.status)}</td></tr>
                        <tr><td><strong>Solicitada:</strong></td><td>${cita.createdAt?.toDate().toLocaleString('es-CO')}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="mt-3">
                <h6><i class="bi bi-chat-text me-2"></i>Motivo de Consulta</h6>
                <div class="alert alert-light">
                    ${cita.motivoConsulta}
                </div>
            </div>
            
            ${archivosHtml}
            
            <div class="mt-3">
                <div class="d-flex gap-2">
                    <button class="btn btn-primary responder-email-btn" data-doc-id="${docId}" data-email="${cita.paciente.correo}">
                        <i class="bi bi-envelope-fill me-2"></i>Responder por Email
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error al cargar detalles:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los detalles de la cita.
            </div>
        `;
    }
}

/**
 * Renderiza el historial de acciones en el modal
 */
function renderHistory(historial) {
    const container = document.getElementById('modal-history-section');
    const timeline = document.getElementById('history-timeline-content');
    
    if (!container || !timeline) {
        console.warn('Elementos del historial no encontrados en el modal.');
        return;
    }

    if (!historial || historial.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    timeline.innerHTML = '';

    // Ordenar historial (más reciente primero)
    const sortedHistorial = [...historial].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    sortedHistorial.forEach(item => {
        const date = item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('es-CO') : 'Fecha desconocida';
        const div = document.createElement('div');
        div.className = 'history-item border-start border-3 border-secondary ps-3 mb-3';
        div.innerHTML = `
            <p class="mb-0 small text-muted">${date} - <strong>${item.user || 'Sistema'}</strong></p>
            <p class="mb-0">${item.action}</p>
        `;
        timeline.appendChild(div);
    });
}


/**
 * Genera una plantilla de email predeterminada.
 */
function generarPlantillaEmail() {
    // Esta plantilla es solo el CUERPO del mensaje.
    // El saludo ("Estimado/a [Nombre]") y la firma (datos del hospital)
    // se gestionan directamente en la plantilla de EmailJS para consistencia.
    return `Le escribimos en relación con su solicitud de cita médica realizada a través de nuestro portal web.

A continuación, la respuesta a su solicitud:


Fecha de respuesta: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

/**
 * Descarga un archivo desde Firebase Storage.
 */
async function downloadFile(url, fileName) {
    const btn = document.querySelector(`.descargar-archivo-btn[data-url="${url}"]`);
    const originalHtml = btn ? btn.innerHTML : '';
    try {
        if (btn) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            btn.disabled = true;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');
        
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error en la descarga directa, abriendo en nueva pestaña:', error);
        window.open(url, '_blank');
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
}

/**
 * Actualiza el estado de una cita.
 */
async function updateCitaStatus(docId, newStatus, prevStatus) {
    try {
        await updateDoc(doc(db, "citasOnline", docId), {
            status: newStatus,
            statusUpdatedAt: new Date(),
            // Registro de auditoría (Historial)
            historial: arrayUnion({
                action: `Cambio de estado: ${prevStatus} ➔ ${newStatus}`,
                user: auth.currentUser.email,
                timestamp: new Date(),
                type: 'status_change'
            })
        });
        
        // Actualizar el atributo data-original-status en el DOM
        const selectElement = document.querySelector(`select.status-select[data-doc-id="${docId}"]`);
        if (selectElement) {
            selectElement.setAttribute('data-original-status', newStatus);
        }
        
        console.log(`✅ Estado actualizado a: ${newStatus}`);
        
        // Mostrar confirmación breve
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">Estado Actualizado</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Cita ${docId} cambiada a: <strong>${newStatus}</strong>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Remover toast después de 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        alert('❌ Error al actualizar el estado. Intente nuevamente.');
    }
}

/**
 * Formatea el tamaño de archivo en formato legible.
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- FUNCIÓN DE LIMPIEZA (USO ÚNICO) ---
/**
 * ⚠️ BORRA TODAS LAS CITAS DE LA BASE DE DATOS.
 * Para usarla, abre la consola del navegador y ejecuta: `deleteAllCitas()`
 */
async function deleteAllCitas() {
    if (!confirm("⚠️ ¡ADVERTENCIA! ¿Estás seguro de que quieres borrar TODAS las solicitudes de citas? Esta acción es irreversible y limpiará el historial para empezar con los nuevos radicados.")) {
        console.log("Borrado cancelado por el usuario.");
        return;
    }

    console.log("Iniciando borrado de todas las citas...");
    const loadingSpinner = document.getElementById('citas-loading');
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    try {
        const q = query(collection(db, "citasOnline"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("No hay documentos para borrar.");
            alert("La base de datos de citas ya está vacía.");
            if (loadingSpinner) loadingSpinner.classList.add('d-none');
            return;
        }

        const deletePromises = [];
        querySnapshot.forEach((docSnapshot) => {
            console.log(`Marcando para borrar: ${docSnapshot.id}`);
            deletePromises.push(deleteDoc(doc(db, "citasOnline", docSnapshot.id)));
        });

        await Promise.all(deletePromises);

        console.log(`✅ Borrado completado. Se eliminaron ${querySnapshot.size} documentos.`);
        alert(`✅ Borrado completado. Se eliminaron ${querySnapshot.size} documentos.`);
        
        // Recargar la vista para que se vea la tabla vacía
        initCitasAdmin();

    } catch (error) {
        console.error("Error durante el borrado masivo:", error);
        alert("Ocurrió un error durante el borrado. Revisa la consola para más detalles.");
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    }
}
// Exponer la función a la ventana para poder llamarla desde la consola.
window.deleteAllCitas = deleteAllCitas;

// =========================================================================
// 🏥 MÓDULO INTRANET: PLANEACIÓN Y CALIDAD (MAPA DE PROCESOS)
// Migración del Excel a Entorno Web Integrado
// =========================================================================

// Datos del nuevo Mapa de Procesos, organizados por macroprocesos.
const DATA_PLANEACION = {
    estrategicos: [
        { nombre: "Planeación Estratégica", icon: "bi-compass", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/1G_ESTRATEGICA/1P_ESTRATÉGICA" },
        { nombre: "Gestión de la Legalidad", icon: "bi-bank", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/1G_ESTRATEGICA/2G_LEGALIDAD" }
    ],
    misionales: [
        { nombre: "Gestión de la Salud Pública", icon: "bi-heart-pulse-fill", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/2G_MISIONAL/1G_SALUD_PUBLICA" },
        { nombre: "Gestión de la Intervención", icon: "bi-scissors", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/2G_MISIONAL/2G_INTERVENCIÓN" },
        { nombre: "Apoyo Diagnóstico", icon: "bi-eyedropper", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/2G_MISIONAL/3G_APOYO DX" },
        { nombre: "Apoyo Terapéutico", icon: "bi-bandaid-fill", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/2G_MISIONAL/4G_APOYO_TERAP" }
    ],
    administrativos: [
        { nombre: "Gestión Financiera", icon: "bi-cash-coin", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/3G_ADMINISTRATIVA/1G_FINANCIERA" },
        { nombre: "Gestión del Talento Humano", icon: "bi-people-fill", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/3G_ADMINISTRATIVA/2G_T_HUMANO" },
        { nombre: "Gestión de Recursos Físicos", icon: "bi-building-gear", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/3G_ADMINISTRATIVA/3G_REC_FÍSICOS" },
        { nombre: "Gestión de la Información", icon: "bi-server", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/3G_ADMINISTRATIVA/4G_INFORMACIÓN" }
    ],
    control: [
        { nombre: "Control Integral de Calidad", icon: "bi-check-circle-fill", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/4G_CONTROL/1C_SGC" },
        { nombre: "Control de la Evaluación", icon: "bi-clipboard-data-fill", url: "file://10.10.1.6/planeacion/HDSA/COMPENDIO_CALIDAD_HDSA/MANUAL DE OPERACIONES HDSA/4G_CONTROL/2C_EVALUACION" }
    ]
};

/**
 * Inicializa el renderizado del módulo de planeación si el contenedor existe.
 */
function initIntranetPlaneacion() {
    const container = document.getElementById('planeacion-intranet-container');
    if (!container) return;
    
    // --- Función para renderizar una tarjeta individual para cada documento ---
    const renderItemCard = (item, colorClass) => `
        <div class="col">
        <div class="card h-100 modern-dashboard-card border-start-0 border-end-0 border-bottom-0 border-5 border-${colorClass}">
            <div class="card-body d-flex flex-column align-items-center text-center pb-2">
                <div class="icon-wrapper mb-3 text-${colorClass}">
                    <i class="bi ${item.icon} fs-1"></i>
                </div>
                <h6 class="card-title fw-bold flex-grow-1">${item.nombre}</h6>
            </div>
            <div class="card-footer bg-transparent border-0 text-center pt-0 pb-3">
                <button class="btn btn-sm btn-outline-secondary copy-path-btn" data-path="${item.url}">
                    <i class="bi bi-clipboard me-1"></i> Copiar Ruta de Acceso
                </button>
            </div>
        </div>
    </div>`;

    // --- Función para renderizar una categoría completa con sus tarjetas ---
    const renderCategory = (title, items, colorClass, icon) => `
        <div class="mb-5">
            <h3 class="mb-4 pb-2 border-bottom"><i class="bi ${icon} me-2 text-${colorClass}"></i>${title}</h3>
            <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                ${items.map(item => renderItemCard(item, colorClass)).join('')}
            </div>
        </div>
    `;
    
    // Generar el HTML completo del dashboard
    container.innerHTML = [
        renderCategory("Procesos Estratégicos", DATA_PLANEACION.estrategicos, "primary", "bi-diagram-3-fill"),
        renderCategory("Procesos Misionales", DATA_PLANEACION.misionales, "success", "bi-hospital-fill"),
        renderCategory("Procesos de Apoyo Administrativo", DATA_PLANEACION.administrativos, "info", "bi-gear-fill"),
        renderCategory("Procesos de Evaluación y Control", DATA_PLANEACION.control, "warning", "bi-shield-fill-check")
    ].join('');
    
    // Agregar estilos CSS dinámicamente para el nuevo dashboard
    const style = document.createElement('style');
    style.textContent = `
        .modern-dashboard-card {
            border-radius: 0.75rem;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .modern-dashboard-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .modern-dashboard-card .icon-wrapper {
            transition: transform 0.25s ease;
        }
        .modern-dashboard-card:hover .icon-wrapper {
            transform: scale(1.15);
        }
        .small-badge {
            font-size: 0.7rem;
            padding: .3em .6em;
        }
    `;
    document.head.appendChild(style);
}
