// js/portal-gestion-web.js — Solicitud de actualización de la página web (Portal Institucional).
// Los archivos viajan en base64 al Apps Script, que verifica la sesión, los guarda en Drive
// y avisa a Sistemas (ver apps-script/gestion-web.gs).

import { exigirSesion, esc } from './portal-sesion.js';

const URL_GESTION_WEB = 'https://script.google.com/macros/s/AKfycbwo3MBeMhsghEryzA1HFvavIwlhe1vFaqgzl_euQYxsgA1BNsLTgSur2GGvEq5JADSk/exec';
const EXTENSIONES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_ARCHIVOS = 10;
const MAX_BYTES_TOTAL = 20 * 1024 * 1024; // debe coincidir con apps-script/gestion-web.gs
const $ = (sel) => document.querySelector(sel);

let archivos = [];

function avisar(tipo, html) {
    const caja = $('#resultado');
    caja.className = `alert alert-${tipo} mt-3`;
    caja.innerHTML = html;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function tamano(bytes) {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function icono(nombre) {
    const ext = nombre.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'bi-file-earmark-pdf';
    if (ext.startsWith('doc')) return 'bi-file-earmark-word';
    if (ext.startsWith('xls')) return 'bi-file-earmark-excel';
    return 'bi-file-earmark-image';
}

/** Devuelve el error de la lista actual de archivos, o '' si es válida. */
function errorArchivos() {
    if (!archivos.length) return 'Adjunte al menos un archivo.';
    if (archivos.length > MAX_ARCHIVOS) return `Puede adjuntar máximo ${MAX_ARCHIVOS} archivos.`;
    const total = archivos.reduce((s, a) => s + a.size, 0);
    if (total > MAX_BYTES_TOTAL) return `Los archivos suman ${tamano(total)}; el máximo es 20 MB en total.`;
    return '';
}

function pintarArchivos(mostrarError) {
    $('#lista-archivos').innerHTML = archivos.map((a, i) => `
        <li><i class="bi ${icono(a.name)}"></i><span class="nombre">${esc(a.name)}</span><small>${tamano(a.size)}</small>
            <button type="button" class="btn btn-sm btn-link text-danger p-0" data-quitar="${i}" aria-label="Quitar ${esc(a.name)}"><i class="bi bi-x-circle"></i></button></li>`).join('');
    const error = errorArchivos();
    const caja = $('#error-archivos');
    caja.textContent = error;
    caja.classList.toggle('d-none', !(mostrarError && error));
    $('#zona-archivos').classList.toggle('invalida', !!(mostrarError && error));
}

function agregar(lista) {
    const rechazados = [];
    [...lista].forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (!EXTENSIONES.includes(ext) || !f.size) { rechazados.push(f.name); return; }
        if (!archivos.some(a => a.name === f.name && a.size === f.size)) archivos.push(f);
    });
    pintarArchivos(true);
    if (rechazados.length) {
        const caja = $('#error-archivos');
        caja.textContent = `No se agregaron (tipo no permitido o vacíos): ${rechazados.join(', ')}`;
        caja.classList.remove('d-none');
    }
}

function base64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result).split(',')[1] || '');
        lector.onerror = () => reject(new Error(`No se pudo leer el archivo ${archivo.name}.`));
        lector.readAsDataURL(archivo);
    });
}

(async () => {
    const sesion = await exigirSesion();
    document.documentElement.classList.remove('portal-verificando');
    const compartida = !!sesion.perfil.compartida;
    $('#correo-sesion').textContent = sesion.email;
    $('#aviso-compartida').classList.toggle('d-none', !compartida);

    // En una cuenta compartida cada persona escribe sus datos; en una personal se proponen los de la sesión
    const nombreInicial = compartida ? '' : (sesion.perfil.nombre || '');
    const correoInicial = compartida ? '' : sesion.email;
    const form = $('#form-web');
    const reiniciar = () => {
        form.reset();
        form.classList.remove('was-validated');
        $('#nombre').value = nombreInicial;
        $('#correo').value = correoInicial;
        archivos = [];
        pintarArchivos(false);
    };
    reiniciar();

    const entrada = $('#archivo');
    const zona = $('#zona-archivos');
    entrada.addEventListener('change', () => { agregar(entrada.files); entrada.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('arrastrando'); }));
    ['dragleave', 'drop'].forEach(ev => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.remove('arrastrando'); }));
    zona.addEventListener('drop', (e) => agregar(e.dataTransfer.files));
    $('#lista-archivos').addEventListener('click', (e) => {
        const b = e.target.closest('[data-quitar]');
        if (!b) return;
        archivos.splice(Number(b.dataset.quitar), 1);
        pintarArchivos(true);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const error = errorArchivos();
        pintarArchivos(true);
        if (!form.checkValidity() || error) {
            form.classList.add('was-validated');
            (form.querySelector(':invalid') || zona).scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const boton = $('#btn-enviar');
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subiendo archivos…';
        try {
            const datos = new URLSearchParams();
            ['nombre', 'cargo', 'dependencia', 'correo', 'observaciones'].forEach(c => datos.append(c, $('#' + c).value.trim()));
            datos.append('archivos', String(archivos.length));
            for (let i = 0; i < archivos.length; i++) {
                datos.append('nombre_' + i, archivos[i].name);
                datos.append('archivo_' + i, await base64(archivos[i]));
            }
            datos.append('idToken', await sesion.user.getIdToken());
            const correo = $('#correo').value.trim();
            const resp = await fetch(URL_GESTION_WEB, { method: 'POST', body: datos });
            const resultado = await resp.json();
            if (resultado.result !== 'success') throw new Error(resultado.error || 'No se pudo enviar la solicitud.');
            const n = resultado.data && resultado.data.radicado;
            avisar('success', `<i class="bi bi-check-circle-fill me-2"></i><strong>Solicitud${n ? ' N.º ' + esc(n) : ''} enviada.</strong> Sistemas fue notificado y recibirá la confirmación en ${esc(correo)}.`);
            reiniciar();
        } catch (err) {
            avisar('danger', `<i class="bi bi-exclamation-triangle-fill me-2"></i>${esc(err.message)}`);
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    });
})();
