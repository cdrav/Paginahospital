import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, storage } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
            
            if (adminCard) adminCard.classList.remove('d-none');
            if (firebaseCard) firebaseCard.classList.remove('d-none');
            if (hojaVidaPcCard) hojaVidaPcCard.classList.remove('d-none');
            if (citasAdminCard) citasAdminCard.classList.remove('d-none');

            // Inicializar el panel de administración de citas
            initCitasAdmin();
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
                await updateCitaStatus(docId, newStatus);
            } else {
                // Restaurar el valor original si se cancela
                const originalStatus = select.getAttribute('data-original-status');
                if (originalStatus) {
                    select.value = originalStatus;
                }
            }
        }
    });
});

/**
 * Inicializa el panel de administración de citas.
 */
function initCitasAdmin() {
    const q = query(collection(db, "citasOnline"), orderBy("createdAt", "desc"));
    
    // Mostrar spinner de carga
    const loadingSpinner = document.getElementById('citas-loading');
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    onSnapshot(q, (querySnapshot) => {
        const citas = [];
        querySnapshot.forEach((doc) => {
            citas.push({ id: doc.id, ...doc.data() });
        });
        renderCitasTable(citas);
    }, (error) => {
        console.error("Error al cargar citas:", error);
        document.getElementById('citas-table-body').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar las solicitudes.</td></tr>`;
        document.getElementById('citas-loading').classList.add('d-none');
    });
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

    citas.forEach(cita => {
        const fechaSolicitud = cita.createdAt?.toDate().toLocaleDateString('es-CO') || 'N/A';
        const status = cita.status || 'Solicitada';
        const tieneArchivos = cita.ordenesMedicas && cita.ordenesMedicas.length > 0;
        const statusBadge = getStatusBadge(status);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><small class="text-muted">${cita.id}</small></td>
            <td>${cita.paciente.nombres} ${cita.paciente.apellidos}</td>
            <td>${cita.especialidad.nombre}</td>
            <td>${fechaSolicitud}</td>
            <td>
                <select class="form-select form-select-sm status-select" data-doc-id="${cita.id}" data-original-status="${status}" aria-label="Cambiar estado">
                    <option value="Solicitada" ${status === 'Solicitada' ? 'selected' : ''}>Solicitada</option>
                    <option value="En Proceso" ${status === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="Confirmada" ${status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                    <option value="Atendida" ${status === 'Atendida' ? 'selected' : ''}>Atendida</option>
                    <option value="Cancelada" ${status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary view-details-btn" data-doc-id="${cita.id}" data-bs-toggle="modal" data-bs-target="#modalDetallesCita">
                        <i class="bi bi-eye-fill"></i> Ver
                    </button>
                    ${tieneArchivos ? `
                        <button class="btn btn-outline-success view-details-btn" data-doc-id="${cita.id}" data-bs-toggle="modal" data-bs-target="#modalDetallesCita">
                            <i class="bi bi-file-earmark-text"></i> Archivos
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-info responder-email-btn" data-doc-id="${cita.id}" data-email="${cita.paciente.correo}">
                        <i class="bi bi-envelope-fill"></i> Responder
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
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
        
        // Obtener URLs de descarga para los archivos
        let archivosHtml = '';
        if (cita.ordenesMedicas && cita.ordenesMedicas.length > 0) {
            archivosHtml = `
                <div class="mt-3">
                    <h6><i class="bi bi-file-earmark-text me-2"></i>Archivos Adjuntos:</h6>
                    <div class="list-group">
            `;
            
            for (const archivo of cita.ordenesMedicas) {
                archivosHtml += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-file-earmark me-2"></i>
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
                `;
            }
            
            archivosHtml += '</div></div>';
        } else {
            archivosHtml = `
                <div class="mt-3">
                    <h6><i class="bi bi-file-earmark-text me-2"></i>Archivos Adjuntos:</h6>
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No hay archivos adjuntos ${cita.corsIssue ? '(problemas técnicos con la subida)' : ''}
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
 * Simula el envío de email (requiere configuración backend real).
 */
async function sendEmailResponse(docId, pacienteEmail) {
    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;
    const updateStatus = document.getElementById('emailUpdateStatus').checked;

    try {
        // Mostrar loading
        const sendBtn = document.getElementById('sendEmailBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        sendBtn.disabled = true;

        // Simular envío de email (requiere backend real)
        console.log('Enviando email:', { to: pacienteEmail, subject, message });
        
        // Aquí debería ir la llamada real a tu servicio de email
        // Por ahora, solo mostramos una confirmación
        
        // Actualizar estado si se solicitó
        if (updateStatus) {
            await updateDoc(doc(db, "citasOnline", docId), {
                status: 'En Proceso',
                emailSent: true,
                emailSentAt: new Date(),
                emailSubject: subject
            });
        }

        // Éxito
        alert('✅ Email enviado exitosamente a: ' + pacienteEmail);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEmailResponse'));
        modal.hide();

    } catch (error) {
        console.error('Error al enviar email:', error);
        alert('❌ Error al enviar el email. Por favor intente nuevamente.');
    } finally {
        // Restaurar botón
        const sendBtn = document.getElementById('sendEmailBtn');
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

/**
 * Descarga un archivo desde Firebase Storage.
 */
async function downloadFile(url, fileName) {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al descargar archivo:', error);
        alert('Error al descargar el archivo. Intente nuevamente.');
    }
}

/**
 * Actualiza el estado de una cita.
 */
async function updateCitaStatus(docId, newStatus) {
    try {
        await updateDoc(doc(db, "citasOnline", docId), {
            status: newStatus,
            statusUpdatedAt: new Date()
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
