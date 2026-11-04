// js/portal-contrasena.js — Solicitud de gestión de contraseñas (Portal Institucional).
// El Apps Script verifica la sesión y registra el correo de quien solicita
// (ver apps-script/restablecer-contrasena.gs).

import { exigirSesion, esc } from './portal-sesion.js';

const URL_CONTRASENAS = 'https://script.google.com/macros/s/AKfycbzYQKIythruQYZe1WMEShZ29Mk-1qUfrdwCXarl1uZ85ZC8s0P8dgrVsxo0HzXf3uYaiQ/exec';
const $ = (sel) => document.querySelector(sel);

function avisar(tipo, html) {
    const caja = $('#resultado');
    caja.className = `alert alert-${tipo} mt-3`;
    caja.innerHTML = html;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

(async () => {
    const sesion = await exigirSesion();
    document.documentElement.classList.remove('portal-verificando');
    $('#correo-sesion').textContent = sesion.email;

    const form = $('#form-contrasena');
    $('#checkEmail').addEventListener('change', (e) => $('#aviso-correo').classList.toggle('d-none', !e.target.checked));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sistemas = [...form.querySelectorAll('input[name="sistema"]:checked')].map(c => c.value);
        $('#error-sistema').classList.toggle('d-none', sistemas.length > 0);
        if (!form.checkValidity() || !sistemas.length) {
            form.classList.add('was-validated');
            form.querySelector(':invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const boton = $('#btn-enviar');
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando…';
        try {
            const datos = new FormData(form);
            datos.delete('sistema');
            datos.append('sistemas', sistemas.join(', '));
            datos.append('idToken', await sesion.user.getIdToken());
            const resp = await fetch(URL_CONTRASENAS, { method: 'POST', body: new URLSearchParams(datos) });
            const resultado = await resp.json();
            if (resultado.result !== 'success') throw new Error(resultado.error || 'No se pudo radicar la solicitud.');
            avisar('success', '<i class="bi bi-check-circle-fill me-2"></i><strong>Solicitud radicada.</strong> El área de Sistemas le notificará al correo indicado. Por seguridad, Sistemas puede comunicarse con usted para confirmar su identidad antes de entregar la nueva contraseña.');
            form.reset();
            form.classList.remove('was-validated');
            $('#aviso-correo').classList.add('d-none');
        } catch (err) {
            avisar('danger', `<i class="bi bi-exclamation-triangle-fill me-2"></i>${esc(err.message)}`);
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    });
})();
