// js/portal-hoja-vida-pc.js — Ficha técnica de equipos de cómputo (GI-SI-FO-15) en el Portal.
// El Apps Script verifica el token de sesión y genera la fila en la hoja y el PDF en Drive
// (ver apps-script/hoja-de-vida-pc.gs).

import { exigirSesion, esc } from './portal-sesion.js';

const URL_HOJA_VIDA = 'https://script.google.com/macros/s/AKfycbwijT06gpsG4XSr2Bpq6VsVMDPtshahrBVS3tVlZ2v0Kk5CnShuBVhBrYnOMMpvCDTnnQ/exec';

const PERIFERICOS = [
    ['mon', 'Monitor', 'bi-display'], ['tec', 'Teclado', 'bi-keyboard'], ['mou', 'Mouse', 'bi-mouse'],
    ['imp', 'Impresora', 'bi-printer'], ['scan', 'Escáner', 'bi-upc-scan'], ['ups', 'UPS / Regulador', 'bi-battery-charging']
];

const $ = (sel) => document.querySelector(sel);

function pintarPerifericos() {
    $('#perifericos').innerHTML = PERIFERICOS.map(([p, nombre, icono]) => `
        <div class="col-md-6 col-xl-4">
          <fieldset class="periferico h-100">
            <legend class="h6 fw-bold"><i class="bi ${icono} me-2"></i>${esc(nombre)}</legend>
            <div class="row g-2">
              ${['marca', 'modelo', 'serial', 'placa'].map(c => `
              <div class="col-6">
                <label class="form-label small mb-1" for="${p}_${c}">${c === 'serial' ? 'Serial' : c === 'placa' ? 'Placa / activo' : c[0].toUpperCase() + c.slice(1)}</label>
                <input type="text" class="form-control form-control-sm" id="${p}_${c}" name="${p}_${c}" maxlength="80">
              </div>`).join('')}
            </div>
          </fieldset>
        </div>`).join('');
}

function avisar(tipo, html) {
    const caja = $('#resultado');
    caja.className = `alert alert-${tipo} mt-3`;
    caja.innerHTML = html;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

(async () => {
    const sesion = await exigirSesion();
    document.documentElement.classList.remove('portal-verificando');

    if (!sesion.tiene('soporte')) {
        $('#form-hoja-vida').classList.add('d-none');
        $('#sin-permiso').classList.remove('d-none');
        return;
    }

    pintarPerifericos();
    const form = $('#form-hoja-vida');
    const realizado = $('#realizado_por');
    realizado.value = sesion.perfil.nombre || sesion.email;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            form.querySelector(':invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const boton = $('#btn-guardar');
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando y generando PDF…';

        const datos = {};
        new FormData(form).forEach((valor, clave) => { datos[clave] = typeof valor === 'string' ? valor.trim() : valor; });
        datos.idToken = await sesion.user.getIdToken();

        try {
            const resp = await fetch(URL_HOJA_VIDA, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(datos)
            });
            const resultado = await resp.json();
            if (!resultado.success) throw new Error(resultado.message || 'No se pudo guardar la ficha.');
            avisar('success', `<i class="bi bi-check-circle-fill me-2"></i><strong>Ficha guardada.</strong> ${esc(resultado.message)}. Placa: <strong>${esc(datos.placa)}</strong>.`);
            form.reset();
            form.classList.remove('was-validated');
            realizado.value = sesion.perfil.nombre || sesion.email;
        } catch (err) {
            avisar('danger', `<i class="bi bi-exclamation-triangle-fill me-2"></i>${esc(err.message)}`);
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    });
})();
