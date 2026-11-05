// js/portal-soporte.js — Soporte Técnico dentro del Portal Institucional.
// Cada petición al Apps Script lleva el token de sesión del portal; el Apps Script lo
// verifica con Google y decide qué puede hacer cada usuario (ver apps-script/soporte-tecnico.gs).

import { exigirSesion, esc } from './portal-sesion.js';

const URL_SOPORTE = 'https://script.google.com/macros/s/AKfycbyaDdRzHEXI26YoIwCR0aJG1cKlw9jk1LdZ0QcMctO7A8fOXKzWE0hcW7tG7Y3N7K7D/exec';
const TECNICOS = ['Robert Giraldo', 'Oscar Rodriguez', 'Cristian Ruiz'];

let sesion = null;
let todas = [];        // solicitudes del panel técnico
let filaEnEdicion = null;

const $ = (sel) => document.querySelector(sel);

// ---------------------------------------------------------------- comunicación

async function llamar(accion, datos = {}) {
    const idToken = await sesion.user.getIdToken();
    const cuerpo = new URLSearchParams({ accion, idToken, ...datos });
    const resp = await fetch(URL_SOPORTE, { method: 'POST', body: cuerpo });
    const json = await resp.json();
    if (json.result !== 'success') throw new Error(json.error || 'No fue posible completar la operación.');
    return json.data;
}

function aviso(tipo, mensaje) {
    if (window.notify) window.notify(mensaje, { type: tipo, timeout: 6000 });
    else alert(mensaje);
}

function ocupado(boton, si, textoCarga = 'Procesando…') {
    if (!boton) return;
    if (si) {
        boton.dataset.original = boton.innerHTML;
        boton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${textoCarga}`;
        boton.disabled = true;
    } else {
        boton.innerHTML = boton.dataset.original || boton.innerHTML;
        boton.disabled = false;
    }
}

// ---------------------------------------------------------------- utilidades de vista

function estadoDe(fila) {
    const accion = fila['Acción'] || '';
    if (!accion || accion === 'Pendiente') return { texto: 'Pendiente', clase: 'bg-warning text-dark', revisado: false };
    if (accion === 'Escalado') return { texto: `Escalado${fila['Escalado'] && fila['Escalado'] !== 'N/A' ? ' · ' + fila['Escalado'] : ''}`, clase: 'bg-info text-dark', revisado: true };
    if (accion === 'Equipo Retirado') return { texto: 'Equipo en taller', clase: 'bg-secondary', revisado: true };
    return { texto: 'Solucionado', clase: 'bg-success', revisado: true };
}

function prioridadBadge(p) {
    const clases = { Alta: 'bg-danger', Media: 'bg-warning text-dark', Baja: 'bg-light text-dark border' };
    return `<span class="badge ${clases[p] || 'bg-light text-dark border'}">${esc(p || '—')}</span>`;
}

function tarjetaSolicitud(fila, conGestion) {
    const est = estadoDe(fila);
    const lugar = [fila['Servicio'], fila['Puesto Rural']].filter(Boolean).join(' · ');
    return `
      <article class="card soporte-item border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div>
              <div class="fw-bold">${esc(fila['Categoría'] || 'Sin categoría')}</div>
              <small class="text-muted">${esc(fila['Fecha'])} · ${esc(lugar)}</small>
              ${fila['Nombre'] ? `<small class="d-block soporte-quien"><i class="bi bi-person me-1"></i>${esc(fila['Nombre'])}${fila['Cargo'] ? ' · ' + esc(fila['Cargo']) : ''}${fila['Teléfono / Ext.'] ? ` · <i class="bi bi-telephone ms-1 me-1"></i>${esc(fila['Teléfono / Ext.'])}` : ''}</small>` : ''}
            </div>
            <div class="d-flex gap-2 flex-wrap">${prioridadBadge(fila['Prioridad'])}<span class="badge ${est.clase}">${esc(est.texto)}</span></div>
          </div>
          <p class="mb-2 soporte-descripcion">${esc(fila['Descripción'])}</p>
          ${fila['Placa'] ? `<small class="text-muted d-block mb-2"><i class="bi bi-upc me-1"></i>Placa: ${esc(fila['Placa'])}</small>` : ''}
          ${fila['Técnico'] || fila['Notas'] ? `
          <div class="soporte-gestion small">
            ${fila['Técnico'] ? `<div><strong>Técnico:</strong> ${esc(fila['Técnico'])}</div>` : ''}
            ${fila['Notas'] ? `<div class="soporte-descripcion"><strong>Notas:</strong> ${esc(fila['Notas'])}</div>` : ''}
            ${fila['Fecha Actualización'] ? `<div class="text-muted">Actualizado: ${esc(fila['Fecha Actualización'])}</div>` : ''}
          </div>` : ''}
          ${conGestion ? `
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button type="button" class="btn btn-sm btn-primary rounded-pill px-3" data-atender="${esc(fila.row_index)}"><i class="bi bi-tools me-1"></i>Atender</button>
            ${/^https:\/\//.test(fila['PDF URL'] || '') ? `<a class="btn btn-sm btn-outline-secondary rounded-pill px-3" href="${esc(fila['PDF URL'])}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</a>` : ''}
          </div>` : ''}
        </div>
      </article>`;
}

// ---------------------------------------------------------------- nueva solicitud

function iniciarFormulario() {
    const form = $('#form-soporte');
    const servicio = $('#servicio');
    const grupoRural = $('#grupo-rural');
    const nombre = $('#nombre');
    const compartida = !!sesion.perfil.compartida;
    // En una cuenta compartida el nombre lo escribe cada persona; en una personal se llena solo
    const nombreInicial = compartida ? '' : (sesion.perfil.nombre || '');
    nombre.value = nombreInicial;
    // El correo de contacto es obligatorio; en una cuenta personal se propone el de la sesión
    const correoContacto = $('#correo_contacto');
    const correoInicial = compartida ? '' : sesion.email;
    correoContacto.value = correoInicial;
    $('#correo-sesion').textContent = sesion.email;
    $('#aviso-compartida').classList.toggle('d-none', !compartida);

    const descripcion = $('#descripcion');
    const contador = $('#contador-descripcion');
    const contar = () => { contador.textContent = `${descripcion.value.length} / 1500`; };
    descripcion.addEventListener('input', contar);

    servicio.addEventListener('change', () => {
        const rural = servicio.value === 'Rurales (Otro)';
        grupoRural.classList.toggle('d-none', !rural);
        $('#nombre_rural').required = rural;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categorias = [...form.querySelectorAll('input[name="categoria"]:checked')].map(c => c.value);
        $('#error-categoria').classList.toggle('d-none', categorias.length > 0);
        if (!form.checkValidity() || !categorias.length) { form.classList.add('was-validated'); return; }

        const boton = $('#btn-enviar');
        ocupado(boton, true, 'Enviando…');
        try {
            const creada = await llamar('crear', {
                nombre: nombre.value.trim(),
                cargo: $('#cargo').value.trim(),
                contacto: $('#contacto').value.trim(),
                correo_contacto: correoContacto.value.trim(),
                servicio: servicio.value,
                nombre_rural: $('#nombre_rural').value.trim(),
                categoria: categorias.join(', '),
                descripcion: $('#descripcion').value.trim(),
                placa_inventario: $('#placa_inventario').value.trim(),
                prioridad: form.querySelector('input[name="prioridad"]:checked')?.value || 'Media'
            });
            const correoAviso = correoContacto.value.trim();
            form.reset();
            nombre.value = nombreInicial;
            correoContacto.value = correoInicial;
            form.classList.remove('was-validated');
            grupoRural.classList.add('d-none');
            contar();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            aviso('success', compartida
                ? `¡Solicitud N.º ${creada && creada.fila ? creada.fila - 1 : ''} enviada! El área de Sistemas fue notificada. Recibirá la confirmación y la respuesta en ${correoAviso}.`
                : '¡Solicitud enviada! El área de Sistemas fue notificada. Puede seguirla en "Mis solicitudes".');
            if (!compartida) cargarMias();
        } catch (err) {
            aviso('danger', err.message);
        } finally {
            ocupado(boton, false);
        }
    });
}

// ---------------------------------------------------------------- mis solicitudes

async function cargarMias() {
    const caja = $('#lista-mias');
    caja.innerHTML = '<div class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Cargando…</div>';
    try {
        const filas = await llamar('mias');
        $('#contador-mias').textContent = filas.length;
        caja.innerHTML = filas.length
            ? filas.map(f => tarjetaSolicitud(f, false)).join('')
            : '<div class="soporte-vacio"><i class="bi bi-inbox fs-2 d-block mb-2"></i>Aún no ha enviado solicitudes desde el portal.</div>';
    } catch (err) {
        caja.innerHTML = `<div class="alert alert-warning">${esc(err.message)}</div>`;
    }
}

// ---------------------------------------------------------------- panel técnico

async function cargarPanel() {
    const caja = $('#lista-panel');
    caja.innerHTML = '<div class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Cargando…</div>';
    try {
        todas = await llamar('listar');
        pintarPanel();
    } catch (err) {
        caja.innerHTML = `<div class="alert alert-warning">${esc(err.message)}</div>`;
    }
}

function pintarPanel() {
    const filtro = $('#filtro-estado').value;
    const texto = $('#filtro-texto').value.trim().toLowerCase();
    const pendientes = todas.filter(f => !estadoDe(f).revisado).length;
    $('#contador-pendientes').textContent = pendientes;

    const lista = todas.filter(f => {
        const revisado = estadoDe(f).revisado;
        if (filtro === 'pendiente' && revisado) return false;
        if (filtro === 'revisado' && !revisado) return false;
        if (!texto) return true;
        return ['Nombre', 'Servicio', 'Puesto Rural', 'Categoría', 'Descripción', 'Placa', 'Técnico']
            .some(k => String(f[k] || '').toLowerCase().includes(texto));
    });
    $('#lista-panel').innerHTML = lista.length
        ? lista.map(f => tarjetaSolicitud(f, true)).join('')
        : '<div class="soporte-vacio">No hay solicitudes con este filtro.</div>';
}

function abrirAtencion(rowIndex) {
    const fila = todas.find(f => String(f.row_index) === String(rowIndex));
    if (!fila) return;
    filaEnEdicion = fila.row_index;
    $('#atender-resumen').innerHTML = `<strong>${esc(fila['Categoría'])}</strong> · ${esc(fila['Servicio'])}<br><span class="soporte-descripcion">${esc(fila['Descripción'])}</span>`;
    $('#tecnico_soporte').value = TECNICOS.includes(fila['Técnico']) ? fila['Técnico'] : '';
    $('#tipo_accion').value = fila['Acción'] || 'Pendiente';
    $('#escalado_a').value = fila['Escalado'] || 'N/A';
    $('#notas_tecnicas').value = fila['Notas'] || '';
    bootstrap.Modal.getOrCreateInstance($('#modal-atender')).show();
}

async function guardarAtencion(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const boton = $('#btn-guardar-atencion');
    ocupado(boton, true, 'Guardando…');
    try {
        await llamar('actualizar', {
            row_index: filaEnEdicion,
            tecnico_soporte: $('#tecnico_soporte').value,
            tipo_accion: $('#tipo_accion').value,
            escalado_a: $('#escalado_a').value,
            notas_tecnicas: $('#notas_tecnicas').value.trim()
        });
        bootstrap.Modal.getOrCreateInstance($('#modal-atender')).hide();
        form.classList.remove('was-validated');
        aviso('success', 'Solicitud actualizada. Se generó el PDF con la gestión técnica.');
        cargarPanel();
    } catch (err) {
        aviso('danger', err.message);
    } finally {
        ocupado(boton, false);
    }
}

function iniciarPanel() {
    $('#tecnico_soporte').innerHTML = '<option value="">Seleccione…</option>' + TECNICOS.map(t => `<option>${esc(t)}</option>`).join('');
    $('#filtro-estado').addEventListener('change', pintarPanel);
    $('#filtro-texto').addEventListener('input', pintarPanel);
    $('#btn-recargar-panel').addEventListener('click', cargarPanel);
    $('#lista-panel').addEventListener('click', (e) => {
        const b = e.target.closest('[data-atender]');
        if (b) abrirAtencion(b.dataset.atender);
    });
    $('#form-atender').addEventListener('submit', guardarAtencion);
    document.querySelector('[data-bs-target="#tab-panel"]').addEventListener('shown.bs.tab', () => { if (!todas.length) cargarPanel(); });
}

// ---------------------------------------------------------------- arranque

(async () => {
    sesion = await exigirSesion();
    document.documentElement.classList.remove('portal-verificando');
    $('#usuario-sesion').textContent = sesion.perfil.nombre || sesion.email;

    iniciarFormulario();
    if (sesion.perfil.compartida) {
        // Cuenta compartida: "Mis solicitudes" mostraría lo de todas las personas que la usan.
        // El seguimiento lo hace Sistemas y la persona recibe las novedades en su correo.
        document.querySelector('[data-bs-target="#tab-mias"]').closest('li').classList.add('d-none');
    } else {
        document.querySelector('[data-bs-target="#tab-mias"]').addEventListener('shown.bs.tab', cargarMias);
        cargarMias();
    }

    if (sesion.tiene('soporte')) {
        document.querySelectorAll('.solo-tecnico').forEach(el => el.classList.remove('d-none'));
        iniciarPanel();
        cargarPanel();
    }
})();
