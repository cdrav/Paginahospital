// js/portal-sihos.js — Solicitud de creación de usuario SIHOS (Portal Institucional).
// El Apps Script verifica la sesión y registra el correo de quien solicita
// (ver apps-script/creacion-usuario-sihos.gs).

import { exigirSesion, esc } from './portal-sesion.js';

const URL_SIHOS = 'https://script.google.com/macros/s/AKfycbxqkGo3GSnK4hpF0-dKnqwOlMPmJdgrLaanmxK9L5Jv_sEwj_t2rR68xB9CzsFHP3dg/exec';
const $ = (sel) => document.querySelector(sel);

function avisar(tipo, html) {
    const caja = $('#resultado');
    caja.className = `alert alert-${tipo} mt-3`;
    caja.innerHTML = html;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function actualizarCondicionales() {
    const contrato = document.querySelector('input[name="tipo_contrato"]:checked')?.value;
    const otro = contrato === 'Otro';
    $('#grupo-otro-contrato').classList.toggle('d-none', !otro);
    $('#otro_contrato_detalle').required = otro;

    const asistencial = document.querySelector('input[name="categoria"]:checked')?.value === 'Asistencial';
    $('#aviso-rethus').classList.toggle('d-none', !asistencial);
    $('#grupo-registro').classList.toggle('d-none', !asistencial);
    $('#registro_profesional').required = asistencial;
}

(async () => {
    const sesion = await exigirSesion();
    document.documentElement.classList.remove('portal-verificando');

    const form = $('#form-sihos');
    const solicitante = $('#solicitado_por');
    solicitante.value = sesion.perfil.nombre || '';
    form.querySelectorAll('input[name="tipo_contrato"], input[name="categoria"]').forEach(r => r.addEventListener('change', actualizarCondicionales));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            form.querySelector(':invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const boton = $('#btn-enviar');
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando…';

        const datos = {};
        new FormData(form).forEach((valor, clave) => { datos[clave] = String(valor).trim(); });
        if (datos.categoria !== 'Asistencial') datos.registro_profesional = 'N/A';
        datos.idToken = await sesion.user.getIdToken();

        try {
            const resp = await fetch(URL_SIHOS, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(datos)
            });
            const resultado = await resp.json();
            if (resultado.result !== 'success') throw new Error(resultado.error || 'No se pudo enviar la solicitud.');
            avisar('success', `<i class="bi bi-check-circle-fill me-2"></i><strong>Solicitud enviada.</strong> El área de Sistemas creará el usuario SIHOS de ${esc(datos.nombres)} ${esc(datos.apellidos)}.`);
            form.reset();
            form.classList.remove('was-validated');
            solicitante.value = sesion.perfil.nombre || '';
            actualizarCondicionales();
        } catch (err) {
            avisar('danger', `<i class="bi bi-exclamation-triangle-fill me-2"></i>${esc(err.message)}`);
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    });
})();
