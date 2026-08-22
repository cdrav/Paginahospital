// equipos-hogar-form.js - Registro de equipos que un funcionario se lleva a casa
// Envía los datos a una hoja de Google Sheets a través de un Web App de Google Apps Script.

const EQUIPOS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU7wQBlIzGtBhH4ih-WHRWlrymKuFqjjqN8YzLpegxsFAUeQ6qaxgdcNiPKABGko0a/exec';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('equipos-form');
  if (!form) return;

  const tbody = document.getElementById('equipos-tbody');
  const rowTemplate = document.getElementById('equipo-row-template');
  const btnAddEquipo = document.getElementById('btn-add-equipo');
  const motivoSelect = document.getElementById('motivo');
  const motivoOtroContainer = document.getElementById('motivoOtroContainer');
  const motivoOtroInput = document.getElementById('motivoOtro');

  function actualizarMotivoOtro() {
    const esOtro = motivoSelect.value === 'Otro';
    motivoOtroContainer.classList.toggle('d-none', !esOtro);
    if (esOtro) {
      motivoOtroInput.setAttribute('required', 'required');
    } else {
      motivoOtroInput.removeAttribute('required');
      motivoOtroInput.value = '';
    }
  }

  motivoSelect.addEventListener('change', actualizarMotivoOtro);

  form.addEventListener('reset', function () {
    setTimeout(function () {
      actualizarMotivoOtro();
      tbody.querySelectorAll('tr.equipo-row').forEach((fila) => {
        fila.querySelector('[name="marcaOtra"]').classList.add('d-none');
        fila.querySelector('[name="marcaOtra"]').removeAttribute('required');
      });
    }, 0);
  });

  function actualizarBotonesEliminar() {
    const filas = tbody.querySelectorAll('tr.equipo-row');
    filas.forEach((fila) => {
      const btnEliminar = fila.querySelector('.btn-remove-equipo');
      btnEliminar.disabled = filas.length === 1;
    });
  }

  function agregarFilaEquipo() {
    const fragment = rowTemplate.content.cloneNode(true);
    const fila = fragment.querySelector('tr');
    fila.querySelector('.btn-remove-equipo').addEventListener('click', () => {
      fila.remove();
      actualizarBotonesEliminar();
    });

    const marcaSelect = fila.querySelector('[name="marca"]');
    const marcaOtraInput = fila.querySelector('[name="marcaOtra"]');
    marcaSelect.addEventListener('change', () => {
      const esOtra = marcaSelect.value === 'Otra';
      marcaOtraInput.classList.toggle('d-none', !esOtra);
      if (esOtra) {
        marcaOtraInput.setAttribute('required', 'required');
      } else {
        marcaOtraInput.removeAttribute('required');
        marcaOtraInput.value = '';
      }
    });

    tbody.appendChild(fila);
    actualizarBotonesEliminar();
  }

  btnAddEquipo.addEventListener('click', agregarFilaEquipo);

  // Primera fila de equipo visible desde el inicio
  agregarFilaEquipo();

  function recolectarEquipos() {
    const equipos = [];
    tbody.querySelectorAll('tr.equipo-row').forEach((fila) => {
      const marcaSelect = fila.querySelector('[name="marca"]');
      const marcaOtraInput = fila.querySelector('[name="marcaOtra"]');
      const marca = marcaSelect.value === 'Otra' ? marcaOtraInput.value.trim() : marcaSelect.value.trim();
      equipos.push({
        tipo: fila.querySelector('[name="tipo"]').value.trim(),
        marca: marca,
        placa: fila.querySelector('[name="placa"]').value.trim(),
        estado: fila.querySelector('[name="estado"]').value.trim(),
        accesorios: fila.querySelector('[name="accesorios"]').value.trim()
      });
    });
    return equipos;
  }

  function mostrarMensaje(tipo, texto) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.className = 'alert alert-' + tipo + ' text-center';
    messageDiv.innerHTML = texto;
    messageDiv.classList.remove('d-none');
    messageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      const primerInvalido = form.querySelector(':invalid');
      if (primerInvalido) primerInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (EQUIPOS_SCRIPT_URL.includes('REEMPLAZAR_CON_TU_ID_DE_DESPLIEGUE')) {
      mostrarMensaje('danger', '<i class="bi bi-exclamation-triangle-fill me-2"></i>El formulario aún no está conectado a la hoja de cálculo. Contacte a Sistemas para completar la configuración.');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const spinner = submitBtn.querySelector('.spinner-border');
    const btnText = submitBtn.querySelector('.btn-text');
    spinner.classList.remove('d-none');
    submitBtn.disabled = true;

    const payload = {
      nombres: document.getElementById('nombres').value.trim(),
      cedula: document.getElementById('cedula').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      cargo: document.getElementById('cargo').value.trim(),
      area: document.getElementById('area').value.trim(),
      correo: document.getElementById('correo').value.trim(),
      fechaSalida: document.getElementById('fechaSalida').value,
      motivo: motivoSelect.value === 'Otro' ? motivoOtroInput.value.trim() : motivoSelect.value,
      jefeInmediato: document.getElementById('jefeInmediato').value.trim(),
      observaciones: document.getElementById('observaciones').value.trim(),
      equipos: recolectarEquipos(),
      origen: window.location.hostname
    };

    // Los Web Apps de Apps Script no siempre exponen cabeceras CORS legibles,
    // por eso se usa 'no-cors': la solicitud se entrega y procesa igualmente,
    // aunque no se pueda leer la respuesta desde el navegador.
    fetch(EQUIPOS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function () {
        form.reset();
        form.classList.remove('was-validated');
        actualizarMotivoOtro();
        tbody.innerHTML = '';
        agregarFilaEquipo();

        const modalEl = document.getElementById('modalRegistroExitoso');
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      })
      .catch(function (error) {
        mostrarMensaje('danger', '<i class="bi bi-exclamation-triangle-fill me-2"></i>Error al enviar el formulario. Por favor, inténtelo de nuevo más tarde.');
        console.error('Error al enviar el registro de equipos:', error);
      })
      .finally(function () {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
      });
  });
});
