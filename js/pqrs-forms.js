// pqrs-forms.js — Formulario PQRSD.
// Envía la solicitud al Apps Script (apps-script/pqrs.gs), que valida todo, la guarda en la hoja/Drive,
// avisa a Ventanilla Única y confirma la recepción. El radicado oficial lo asigna Ventanilla en Altabase. La validación de aquí es solo ayuda.

(function () {
  'use strict';

  // URL de la aplicación web del Apps Script de PQRSD (Implementar > Aplicación web)
  const URL_PQRS = 'https://script.google.com/macros/s/AKfycbwXSVCbiLDQRYK1MgiMQh1x9i2GrSBGPyEaC4xXZQVKsWj729W2wA2l2IYoGmHAdDxmlQ/exec';
  // Clave de SITIO de Cloudflare Turnstile (la secreta va solo en las propiedades del Apps Script)
  const TURNSTILE_SITE_KEY = '0x4AAAAAAF_vfERCnwReP06P';

  const EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png'];
  const MAX_ADJUNTOS = 3;
  const MAX_BYTES_ADJUNTO = 5 * 1024 * 1024;   // deben coincidir con apps-script/pqrs.gs
  const MAX_BYTES_TOTAL = 10 * 1024 * 1024;
  const CORREO_VENTANILLA = 'ventanillaunica@hdsa.gov.co';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const tamano = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

  let inicio = Date.now();
  let widgetId = null;
  let tokenTurnstile = '';

  // ---------------------------------------------------------------- Turnstile
  window.pqrsTurnstileListo = function () {
    if (!TURNSTILE_SITE_KEY || !$('turnstile-pqrs')) return;
    widgetId = window.turnstile.render('#turnstile-pqrs', {
      sitekey: TURNSTILE_SITE_KEY,
      action: 'pqrsd',
      language: 'es',
      callback: (t) => { tokenTurnstile = t; $('turnstile-error').classList.add('d-none'); },
      'expired-callback': () => { tokenTurnstile = ''; },
      'error-callback': () => { tokenTurnstile = ''; }
    });
  };
  function reiniciarTurnstile() {
    tokenTurnstile = '';
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
  }

  // ---------------------------------------------------------------- mensajes
  function mostrarMensaje(tipo, html) {
    const caja = $('form-message');
    caja.className = 'alert alert-' + tipo;
    caja.innerHTML = html;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function ocultarMensaje() { $('form-message').className = 'alert d-none'; }

  // ---------------------------------------------------------------- adjuntos
  function errorAdjuntos(archivos) {
    if (archivos.length > MAX_ADJUNTOS) return 'Puede adjuntar máximo ' + MAX_ADJUNTOS + ' archivos.';
    const malos = archivos.filter(f => !EXTENSIONES.includes(f.name.split('.').pop().toLowerCase()));
    if (malos.length) return 'Tipo de archivo no permitido: ' + malos.map(f => f.name).join(', ') + '. Solo PDF, JPG o PNG.';
    const vacios = archivos.filter(f => !f.size);
    if (vacios.length) return 'Archivo vacío: ' + vacios.map(f => f.name).join(', ') + '.';
    const grandes = archivos.filter(f => f.size > MAX_BYTES_ADJUNTO);
    if (grandes.length) return 'Supera 5 MB: ' + grandes.map(f => f.name).join(', ') + '.';
    const total = archivos.reduce((s, f) => s + f.size, 0);
    if (total > MAX_BYTES_TOTAL) return 'Los adjuntos suman ' + tamano(total) + '; el máximo es 10 MB en total.';
    return '';
  }
  function pintarAdjuntos() {
    const archivos = [...$('adjuntos').files];
    $('adjuntos-lista').innerHTML = archivos.map(f =>
      '<li><i class="bi bi-paperclip me-1"></i>' + esc(f.name) + ' <span class="text-muted">(' + tamano(f.size) + ')</span></li>').join('');
    const error = errorAdjuntos(archivos);
    $('adjuntos-error').textContent = error;
    $('adjuntos-error').classList.toggle('d-none', !error);
    $('adjuntos').classList.toggle('is-invalid', !!error);
    return error;
  }
  function base64(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result).split(',')[1] || '');
      lector.onerror = () => reject(new Error('No se pudo leer el archivo ' + archivo.name + '.'));
      lector.readAsDataURL(archivo);
    });
  }

  // ---------------------------------------------------------------- envío
  async function leerRespuesta(resp) {
    let datos = null;
    try { datos = await resp.json(); } catch (e) { /* no es JSON */ }
    if (!datos) throw new Error('El servicio no respondió correctamente. Intente de nuevo en unos minutos o escriba a ' + CORREO_VENTANILLA + '.');
    return datos;
  }

  function mostrarRecibida(r) {
    $('recibida-tipo').textContent = r.tipo;
    $('recibida-fecha').textContent = r.fecha;
    $('recibida-plazo').textContent = r.plazo + ' días hábiles (Ley 1755 de 2015)';
    $('recibida-acuse').textContent =
      r.acuse === 'enviado' ? 'Enviamos la confirmación de recepción a ' + r.correo + '. Revise también la carpeta de correo no deseado.'
      : r.acuse === 'pendiente' ? 'La confirmación de recepción se enviará a ' + r.correo + ' en las próximas horas.'
      : 'Como su solicitud es anónima, no se envía confirmación por correo. Puede imprimir o guardar esta constancia.';
    $('recibida-aviso-adjuntos').textContent = r.avisoAdjuntos || '';
    $('recibida-aviso-adjuntos').classList.toggle('d-none', !r.avisoAdjuntos);
    $('pqrs-form').classList.add('d-none');
    const tarjeta = $('pqrs-recibida');
    tarjeta.classList.remove('d-none');
    tarjeta.focus();
    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function enviar(e) {
    e.preventDefault();
    const form = e.target;
    ocultarMensaje();
    const errorArch = pintarAdjuntos();
    const sinCaptcha = TURNSTILE_SITE_KEY && !tokenTurnstile;
    $('turnstile-error').classList.toggle('d-none', !sinCaptcha);
    if (!form.checkValidity() || errorArch || sinCaptcha) {
      form.classList.add('was-validated');
      (form.querySelector(':invalid') || $('adjuntos')).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!URL_PQRS || !TURNSTILE_SITE_KEY) {
      mostrarMensaje('warning', 'El formulario está en mantenimiento. Mientras tanto envíe su PQRSD a <a href="mailto:' + CORREO_VENTANILLA + '">' + CORREO_VENTANILLA + '</a>.');
      return;
    }

    const boton = $('submit-btn');
    const original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando…';
    try {
      const anonimo = $('anonimo-check').checked;
      const datos = new URLSearchParams();
      const campo = (nombre, id) => datos.append(nombre, ($(id).value || '').trim());
      datos.append('tipo', $('tipoSolicitud').value);
      datos.append('anonimo', anonimo ? 'si' : 'no');
      if (!anonimo) {
        campo('razon_social', 'razonSocial'); campo('nombres', 'nombres'); campo('apellidos', 'apellidos');
        campo('tipo_documento', 'tipoDocumento'); campo('numero_documento', 'numeroDocumento');
        campo('telefono', 'telefono'); campo('correo', 'email'); campo('direccion', 'direccion');
        campo('municipio', 'municipio'); campo('departamento', 'departamento');
      }
      campo('asunto', 'asunto'); campo('descripcion', 'descripcion');
      datos.append('acepta_politica', $('aceptoTerminos').checked ? 'si' : 'no');
      datos.append('sitio_web', $('sitio_web').value);
      datos.append('tiempo', String(Date.now() - inicio));
      datos.append('turnstile', tokenTurnstile);
      const archivos = [...$('adjuntos').files];
      datos.append('adjuntos', String(archivos.length));
      for (let i = 0; i < archivos.length; i++) {
        datos.append('nombre_' + i, archivos[i].name);
        datos.append('archivo_' + i, await base64(archivos[i]));
      }

      let resp;
      try {
        resp = await fetch(URL_PQRS, { method: 'POST', body: datos });
      } catch (err) {
        throw new Error('No hay conexión con el servicio. Revise su internet e intente de nuevo.');
      }
      const resultado = await leerRespuesta(resp);
      if (resultado.result !== 'success') throw new Error(resultado.error || 'No se pudo enviar la PQRSD.');
      mostrarRecibida(resultado.data);
    } catch (err) {
      mostrarMensaje('danger', '<i class="bi bi-exclamation-triangle-fill me-2"></i>' + esc(err.message));
    } finally {
      boton.disabled = false;
      boton.innerHTML = original;
      reiniciarTurnstile();   // cada token sirve una sola vez
    }
  }

  // ---------------------------------------------------------------- inicio
  document.addEventListener('DOMContentLoaded', function () {
    const form = $('pqrs-form');
    if (!form) return;
    inicio = Date.now();
    form.addEventListener('submit', enviar);
    form.addEventListener('reset', () => setTimeout(() => {
      form.classList.remove('was-validated');
      pintarAdjuntos();
      toggleCamposPersonales();
    }));
    $('adjuntos').addEventListener('change', pintarAdjuntos);

    $('btn-imprimir').addEventListener('click', () => {
      document.body.classList.add('imprimir-constancia');
      window.print();
    });
    window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-constancia'));
    $('btn-nueva').addEventListener('click', () => {
      $('pqrs-recibida').classList.add('d-none');
      form.reset();
      form.classList.remove('d-none');
      inicio = Date.now();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Solicitud anónima: oculta y vacía los datos personales
    const anonimoCheck = $('anonimo-check');
    const contenedor = $('datos-personales-container');
    const campos = contenedor.querySelectorAll('input, select');
    function toggleCamposPersonales() {
      const esAnonimo = anonimoCheck.checked;
      contenedor.style.display = esAnonimo ? 'none' : 'block';
      campos.forEach(c => {
        if (c.id === 'razonSocial') return;
        if (esAnonimo) { c.removeAttribute('required'); c.value = ''; }
        else {
          const label = document.querySelector('label[for="' + c.id + '"]');
          if (label && label.classList.contains('required-field')) c.setAttribute('required', 'required');
        }
      });
    }
    anonimoCheck.addEventListener('change', toggleCamposPersonales);
    toggleCamposPersonales();
  });
})();
