import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, storage } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, orderBy, getDocs, where, limit, arrayUnion, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
            const pacienteEmail = btn.dataset.email;            
            await showEmailResponseModal(docId, pacienteEmail);
        }

        if (e.target.closest('.descargar-archivo-btn')) {
            const btn = e.target.closest('.descargar-archivo-btn');
            const fileUrl = btn.dataset.url;
            const fileName = btn.dataset.name;
            await downloadFile(fileUrl, fileName);
        }
    });

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
function initCitasAdmin() {
    let q = collection(db, "citasOnline");
    
    const statusFilter = document.getElementById('filter-status')?.value || 'active';
    const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';

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

    // Siempre ordenar por fecha descendente
    constraints.push(orderBy("createdAt", "desc"));
    
    // Limitar resultados para eficiencia (paginación implícita)
    if (!searchTerm) {
        constraints.push(limit(50));
    } else {
        // Si hay búsqueda, aumentamos el límite para buscar en un set más amplio
        // En una app real masiva, usaríamos un motor de búsqueda externo como Algolia.
        constraints.push(limit(100));
    }

    q = query(q, ...constraints);
    
    // Mostrar spinner de carga
    const loadingSpinner = document.getElementById('citas-loading');
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    // Usamos onSnapshot para tiempo real, pero cuidado con los costos si hay muchas escrituras.
    onSnapshot(q, (querySnapshot) => {
        const citas = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
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
        
        updateStatistics(citas); // Calcular estadísticas con los datos cargados
        renderCitasTable(citas);
    }, (error) => {
        console.error("Error al cargar citas:", error);
        document.getElementById('citas-table-body').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar las solicitudes.</td></tr>`;
        document.getElementById('citas-loading').classList.add('d-none');
    });
}

/**
 * Calcula y actualiza las estadísticas del dashboard
 */
function updateStatistics(citas) {
    const stats = {
        solicitada: 0,
        proceso: 0,
        atendida: 0,
        total: citas.length
    };

    citas.forEach(cita => {
        const status = cita.status || 'Solicitada';
        if (status === 'Solicitada') stats.solicitada++;
        if (status === 'En Proceso') stats.proceso++;
        if (status === 'Atendida') stats.atendida++;
    });

    // Actualizar DOM con animación simple
    animateValue("stat-solicitada", stats.solicitada);
    animateValue("stat-proceso", stats.proceso);
    animateValue("stat-atendida", stats.atendida);
    animateValue("stat-total", stats.total);
}

function animateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/**
 * Renderiza las filas de la tabla de citas con mejoras.
 */
function renderCitasTable(citas) {
    const tableBody = document.getElementById('citas-table-body');
    const loadingSpinner = document.getElementById('citas-loading');
    const noResults = document.getElementById('citas-no-results');

    if (!tableBody || !loadingSpinner || !noResults) return;

    loadingSpinner.classList.add('d-none');
    tableBody.innerHTML = '';

    if (citas.length === 0) {
        noResults.classList.remove('d-none');
        return;
    }

    noResults.classList.add('d-none');

    // Agrupar citas por estado para mejor organización
    const citasPorEstado = {
        'Solicitada': [],
        'En Proceso': [],
        'Confirmada': [],
        'Atendida': [],
        'Cancelada': []
    };

    citas.forEach(cita => {
        // Validar que los datos existan
        if (!cita.paciente || !cita.especialidad) {
            console.warn('⚠️ Cita con datos incompletos:', cita.id);
            return; // Saltar esta cita
        }

        const status = cita.status || 'Solicitada';
        if (citasPorEstado[status]) {
            citasPorEstado[status].push(cita);
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
                const tieneArchivos = cita.ordenesMedicas && cita.ordenesMedicas.length > 0;
                const statusBadge = getStatusBadge(status);

                htmlContent += `
                    <tr class="cita-row" data-status="${status}">
                        <td><small class="text-muted">${cita.id}</small></td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-person-circle text-primary"></i>
                                </div>
                                <div>
                                    <strong>${cita.paciente.nombres || 'N/A'} ${cita.paciente.apellidos || 'N/A'}</strong>
                                    <small class="d-block text-muted">${cita.paciente.numeroDocumento || 'N/A'}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-info text-white">
                                <i class="bi bi-hospital me-1"></i>${cita.especialidad.nombre || 'N/A'}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-calendar-event text-muted me-2"></i>
                                <span>${fechaSolicitud}</span>
                            </div>
                        </td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="showCitaDetails('${cita.id}')">
                                    <i class="bi bi-eye-fill"></i> Ver
                                </button>
                                ${tieneArchivos ? `
                                    <button class="btn btn-sm btn-outline-success" onclick="showCitaDetails('${cita.id}')">
                                        <i class="bi bi-file-earmark-fill"></i> Archivos
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-info" onclick="openEmailModal('${cita.id}', '${cita.paciente.email || ''}')">
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

// Función para abrir modal de email
function openEmailModal(citaId, pacienteEmail) {
    // Limpiar formulario
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailMessage').value = '';
    document.getElementById('emailUpdateStatus').checked = false;
    
    // Establecer datos de la cita
    document.getElementById('emailModal').dataset.citaId = citaId;
    document.getElementById('emailModal').dataset.pacienteEmail = pacienteEmail;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('emailModal'));
    modal.show();
}

// Hacer funciones globalmente accesibles
window.showCitaDetails = showCitaDetails;
window.openEmailModal = openEmailModal;
window.sendEmailResponse = sendEmailResponse;

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

/**
 * Muestra los detalles completos de una cita incluyendo archivos.
 */
async function showCitaDetails(docId) {
    try {
        const docRef = doc(db, "citasOnline", docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            console.error('No se encontró la cita');
            return;
        }

        const cita = docSnap.data();
        const modalBody = document.getElementById('modal-body-content');
        
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
        document.getElementById('modal-body-content').innerHTML = `
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
    
    if (!historial || historial.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    timeline.innerHTML = '';

    // Ordenar historial (más reciente primero)
    const sortedHistorial = [...historial].sort((a, b) => b.timestamp - a.timestamp);

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
 * Muestra el modal para responder por email.
 */
async function showEmailResponseModal(docId, pacienteEmail) {
    // Crear modal dinámicamente si no existe
    let modalEmail = document.getElementById('modalEmailResponse');
    if (!modalEmail) {
        const modalHtml = `
            <div class="modal fade" id="modalEmailResponse" tabindex="-1" aria-labelledby="modalEmailResponseLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalEmailResponseLabel">
                                <i class="bi bi-envelope-fill me-2"></i>Respuesta por Email
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <form id="emailResponseForm">
                                <div class="mb-3">
                                    <label for="emailTo" class="form-label">Para:</label>
                                    <input type="email" class="form-control" id="emailTo" readonly>
                                </div>
                                <div class="mb-3">
                                    <label for="emailSubject" class="form-label">Asunto:</label>
                                    <input type="text" class="form-control" id="emailSubject" value="Respuesta a su solicitud de cita médica">
                                </div>
                                <div class="mb-3">
                                    <label for="emailMessage" class="form-label">Mensaje:</label>
                                    <textarea class="form-control" id="emailMessage" rows="8" required></textarea>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="emailUpdateStatus">
                                        <label class="form-check-label" for="emailUpdateStatus">
                                            Actualizar estado de la cita a "En Proceso"
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="sendEmailBtn">
                                <i class="bi bi-send-fill me-2"></i>Enviar Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Llenar el formulario
    document.getElementById('emailTo').value = pacienteEmail;
    document.getElementById('emailMessage').value = generarPlantillaEmail();

    // Event listener para enviar email
    const sendBtn = document.getElementById('sendEmailBtn');
    sendBtn.onclick = async () => await sendEmailResponse(docId, pacienteEmail);

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalEmailResponse'));
    modal.show();
}

/**
 * Genera una plantilla de email predeterminada.
 */
function generarPlantillaEmail() {
    return `Estimado/a paciente,

Le escribimos en relación con su solicitud de cita médica realizada a través de nuestro portal web.

${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Atentamente,
Hospital Departamental San Antonio de Roldanillo
Teléfono: (2) 2295000
Email: citas@hdsa.gov.co`;
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
