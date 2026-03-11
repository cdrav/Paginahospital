import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

            // Inicializar el panel de administración de citas (los datos se cargan en segundo plano)
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

    // Lógica para mostrar/ocultar el panel de gestión de citas
    const mainCardsContainer = document.getElementById('main-cards-container');
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

    // Delegación de eventos para la tabla de citas
    const citasTableBody = document.getElementById('citas-table-body');
    if (citasTableBody) {
        citasTableBody.addEventListener('click', handleTableClick);
        citasTableBody.addEventListener('change', handleStatusChange);
    }
});

/**
 * Inicializa la carga y visualización de las solicitudes de citas para administradores.
 */
function initCitasAdmin() {
    const panel = document.getElementById('citas-admin-panel');
    if (!panel) return;

    // El panel ya no se muestra aquí, solo se cargan los datos.
    // La visibilidad se controla con el botón de la tarjeta.

    const q = query(collection(db, "citasOnline"), orderBy("createdAt", "desc"));

    onSnapshot(q, (querySnapshot) => {
        const citas = [];
        querySnapshot.forEach((doc) => {
            citas.push({ id: doc.id, ...doc.data() });
        });
        renderCitasTable(citas);
    }, (error) => {
        console.error("Error al obtener citas: ", error);
        document.getElementById('citas-table-body').innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar las solicitudes.</td></tr>`;
        document.getElementById('citas-loading').classList.add('d-none');
    });
}

/**
 * Renderiza las filas de la tabla de citas.
 * @param {Array} citas - Un array de objetos de cita.
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

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><small class="text-muted">${cita.id}</small></td>
            <td>${cita.paciente.nombres} ${cita.paciente.apellidos}</td>
            <td>${cita.especialidad.nombre}</td>
            <td>${fechaSolicitud}</td>
            <td>
                <select class="form-select form-select-sm status-select" data-doc-id="${cita.id}" aria-label="Cambiar estado">
                    <option value="Solicitada" ${status === 'Solicitada' ? 'selected' : ''}>Solicitada</option>
                    <option value="Confirmada" ${status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                    <option value="Cancelada" ${status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    <option value="Atendida" ${status === 'Atendida' ? 'selected' : ''}>Atendida</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-doc-id="${cita.id}" data-bs-toggle="modal" data-bs-target="#modalDetallesCita">
                    <i class="bi bi-eye-fill"></i> Ver Detalles
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Maneja los clics en los botones de la tabla de citas.
 * @param {Event} e - El evento de clic.
 */
async function handleTableClick(e) {
    const button = e.target.closest('.view-details-btn');
    if (!button) return;

    const docId = button.dataset.docId;
    const modalBody = document.getElementById('modal-body-content');
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const docRef = doc(db, "citasOnline", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const fechaCitaObj = new Date(data.fecha + 'T12:00:00');
            const fechaCitaFormateada = fechaCitaObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // Generar enlaces para los archivos adjuntos
            let filesHtml = 'Ninguna';
            if (data.ordenesMedicas && data.ordenesMedicas.length > 0) {
                filesHtml = '<ul class="list-unstyled mb-0">' + data.ordenesMedicas.map(file => 
                    `<li>
                        <a href="${file.url}" target="_blank" rel="noopener noreferrer">
                            <i class="bi bi-file-earmark-arrow-down-fill"></i> ${file.name}
                        </a>
                        <small class="text-muted">(${(file.size / 1024).toFixed(1)} KB)</small>
                    </li>`
                ).join('') + '</ul>';
            }

            modalBody.innerHTML = `
                <h5>Datos del Paciente</h5>
                <p><strong>Nombre:</strong> ${data.paciente.nombres} ${data.paciente.apellidos}</p>
                <p><strong>Documento:</strong> ${data.paciente.tipoDocumento} ${data.paciente.numeroDocumento}</p>
                <p><strong>Contacto:</strong> ${data.paciente.telefono} / ${data.paciente.correo}</p>
                <p><strong>EPS:</strong> ${data.paciente.eps}</p>
                <hr>
                <h5>Datos de la Cita</h5>
                <p><strong>Especialidad:</strong> ${data.especialidad.nombre}</p>
                <p><strong>Fecha y Hora:</strong> ${fechaCitaFormateada} a las ${data.hora}</p>
                <p><strong>Motivo de Consulta:</strong> ${data.motivoConsulta}</p>
                <p><strong>¿Tiene WhatsApp?:</strong> ${data.tieneWhatsapp}</p>
                <div><strong>Órdenes Médicas Adjuntas:</strong> ${filesHtml}</div>
                <hr>
                <p><strong>Fecha de Solicitud:</strong> ${data.createdAt?.toDate().toLocaleString('es-CO') || 'N/A'}</p>
            `;
        } else {
            modalBody.innerHTML = '<div class="alert alert-danger">No se encontraron los detalles de la solicitud.</div>';
        }
    } catch (error) {
        console.error("Error al obtener detalles de la cita:", error);
        modalBody.innerHTML = '<div class="alert alert-danger">Error al cargar los detalles.</div>';
    }
}

/**
 * Maneja el cambio de estado en el selector de la tabla.
 * @param {Event} e - El evento de cambio.
 */
async function handleStatusChange(e) {
    const select = e.target.closest('.status-select');
    if (!select) return;

    const docId = select.dataset.docId;
    const newStatus = select.value;

    select.disabled = true; // Deshabilitar mientras se guarda

    try {
        const docRef = doc(db, "citasOnline", docId);
        await updateDoc(docRef, { status: newStatus });
        // Opcional: mostrar una notificación de éxito
    } catch (error) {
        console.error("Error al actualizar el estado:", error);
        // Opcional: mostrar notificación de error y revertir el select
        select.value = select.querySelector('option[selected]').value; // Revertir al valor original
    } finally {
        select.disabled = false; // Rehabilitar el select
    }
}