/**
 * Lógica para el sistema de Citas Médicas Online
 * Maneja el wizard de pasos, validaciones, calendario y simulación de envío.
 */

import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Datos de ejemplo para especialidades (Simulación de API)
const especialidades = [
    { id: 1, nombre: 'Medicina General', icono: 'bi-stethoscope', descripcion: 'Consulta general para adultos y niños' },
    { id: 2, nombre: 'Pediatría', icono: 'bi-heart-pulse', descripcion: 'Atención especializada para niños' },
    { id: 3, nombre: 'Ginecología', icono: 'bi-gender-female', descripcion: 'Salud de la mujer' },
    { id: 4, nombre: 'Medicina Interna', icono: 'bi-hospital', descripcion: 'Enfermedades de adultos' },
    { id: 5, nombre: 'Cirugía General', icono: 'bi-scissors', descripcion: 'Procedimientos quirúrgicos' }
  ];
  
  // Variables globales de estado
  let pasoActual = 1;
  let datosCita = {
    paciente: {},
    especialidad: null,
    fecha: null,
    hora: null,
    motivoConsulta: '',
    tieneWhatsapp: '',
    ordenesMedicas: null
  };
  let fechaMostrada = new Date(); // Estado para el mes/año que muestra el calendario
  let fileAccumulator = new DataTransfer(); // Acumulador para mantener múltiples archivos seleccionados
  
  // Inicialización
  document.addEventListener('DOMContentLoaded', function() {
    cargarEspecialidades();
    generarCalendario(fechaMostrada.getFullYear(), fechaMostrada.getMonth());
    
    // Configurar listeners
    const ordenesInput = document.getElementById('ordenesMedicas');
    if (ordenesInput) {
        ordenesInput.addEventListener('change', manejarCargaArchivos);
        // Reiniciar acumulador al recargar
        fileAccumulator = new DataTransfer();
    }
  
    const citaForm = document.getElementById('citaForm');
    if (citaForm) {
        citaForm.addEventListener('submit', confirmarCita);
    }
  
    const confirmTerms = document.getElementById('confirmTerms');
    if (confirmTerms) {
        confirmTerms.addEventListener('change', function() {
            document.getElementById('btnConfirmar').disabled = !this.checked;
        });
    }

    // Ajustar la vista del carrusel al inicio y en cambios de tamaño
    setTimeout(() => setStepView(pasoActual), 100); // Delay para asegurar renderizado
    window.addEventListener('resize', () => setStepView(pasoActual));

    // Permitir navegación hacia atrás haciendo clic en los indicadores de paso
    // y manejar la navegación del calendario con delegación de eventos.
    document.querySelectorAll('.step-item').forEach(stepIndicator => {
      stepIndicator.addEventListener('click', () => {
        const targetStep = parseInt(stepIndicator.id.replace('step', ''), 10);
        // Solo permitir saltar a pasos ya completados
        if (targetStep < pasoActual && stepIndicator.classList.contains('completed')) {
          jumpToStep(targetStep);
        }
      });
    });

    // Delegación de eventos para los botones del calendario
    const calendarHeader = document.querySelector('.calendar-header');
    if (calendarHeader) {
      calendarHeader.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        if (button.id === 'prevMonthBtn') mesAnterior();
        if (button.id === 'nextMonthBtn') siguienteMes();
      });
    }

  });

  // --- Gestión de Archivos ---
  
  function manejarCargaArchivos(e) {
    const nuevosArchivos = Array.from(e.target.files);
    const input = e.target;
    
    // Procesar cada archivo nuevo seleccionado
    nuevosArchivos.forEach(archivo => {
        // VALIDACIÓN INTELIGENTE DE TAMAÑO
        const esImagen = archivo.type.startsWith('image/');
        const limiteSize = esImagen ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB imágenes, 2MB PDF

        if (archivo.size > limiteSize) {
            mostrarModalPesoExcedido(archivo.name, archivo.size, limiteSize, esImagen);
            // No agregamos este archivo al acumulador
        } else {
            // Verificar duplicados simples por nombre y tamaño para no agregar el mismo archivo dos veces
            let existe = false;
            for (let i = 0; i < fileAccumulator.items.length; i++) {
                const f = fileAccumulator.files[i];
                if (f.name === archivo.name && f.size === archivo.size) {
                    existe = true;
                    break;
                }
            }
            if (!existe) {
                fileAccumulator.items.add(archivo);
            }
        }
    });

    // Actualizar el input con la lista completa acumulada
    input.files = fileAccumulator.files;
    
    // Renderizar la lista visual
    renderizarListaArchivos();
  }

  function renderizarListaArchivos() {
    const listaArchivos = document.getElementById('listaArchivos');
    const contenedorArchivos = document.getElementById('archivosCargados');
    const archivos = fileAccumulator.files;

    if (archivos.length > 0) {
      contenedorArchivos.style.display = 'block';
      listaArchivos.innerHTML = '';
      
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const itemArchivo = document.createElement('div');
        itemArchivo.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const icono = archivo.type.includes('pdf') ? 'bi-file-pdf' : 'bi-file-image';
        
        itemArchivo.innerHTML = `
          <div>
            <i class="bi ${icono} me-2"></i>
            <span>${archivo.name}</span>
            <small class="text-muted ms-2">(${(archivo.size / 1024).toFixed(1)} KB)</small>
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarArchivo(${i})">
            <i class="bi bi-trash"></i>
          </button>
        `;
        
        listaArchivos.appendChild(itemArchivo);
      }
    } else {
      contenedorArchivos.style.display = 'none';
    }

    // Recalcular la altura del contenedor para que el botón "Siguiente" no quede oculto
    setStepView(pasoActual);
  }
  
  // Función global para ser llamada desde el HTML generado dinámicamente
  window.eliminarArchivo = function(index) {
    // Crear un nuevo DataTransfer sin el archivo eliminado
    const nuevoDt = new DataTransfer();
    const archivosActuales = Array.from(fileAccumulator.files);
    
    archivosActuales.forEach((archivo, i) => {
        if (i !== index) nuevoDt.items.add(archivo);
    });
    
    // Actualizar acumulador y el input
    fileAccumulator = nuevoDt;
    const input = document.getElementById('ordenesMedicas');
    input.files = fileAccumulator.files;
    
    // Re-renderizar
    renderizarListaArchivos();
  };
  
  // --- Lógica del Wizard y Pasos ---
  
  function cargarEspecialidades() {
    const container = document.getElementById('especialidadesContainer');
    if (!container) return;
    container.innerHTML = '';
    
    especialidades.forEach(esp => {
      const card = document.createElement('div');
      card.className = 'specialty-card';
      card.onclick = (e) => seleccionarEspecialidad(esp.id, esp.nombre, e.currentTarget);
      card.innerHTML = `
        <div class="specialty-icon">
          <i class="bi ${esp.icono}"></i>
        </div>
        <h5>${esp.nombre}</h5>
        <p class="text-muted">${esp.descripcion}</p>
      `;
      container.appendChild(card);
    });
  }
  
  function seleccionarEspecialidad(id, nombre, elemento) {
    document.querySelectorAll('.specialty-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    elemento.classList.add('selected');
    datosCita.especialidad = { id, nombre };
    document.getElementById('btnPaso2').disabled = false;
  }
  
  // --- Calendario y Horarios ---
  
  function siguienteMes() {
    fechaMostrada.setMonth(fechaMostrada.getMonth() + 1);
    generarCalendario(fechaMostrada.getFullYear(), fechaMostrada.getMonth());
  }
  
  function mesAnterior() {
    fechaMostrada.setMonth(fechaMostrada.getMonth() - 1);
    generarCalendario(fechaMostrada.getFullYear(), fechaMostrada.getMonth());
  }
  function generarCalendario(year, month) {
    const container = document.getElementById('calendarGrid');
    if (!container) return;
    container.innerHTML = '';
    
    const hoy = new Date();
    const primerDiaDelMes = new Date(year, month, 1);
  
    const mesActualStr = primerDiaDelMes.toLocaleDateString('es-CO', { month: 'long' });
    const anioActualStr = primerDiaDelMes.getFullYear();
  
    const elCurrentMonth = document.getElementById('currentMonth');
    const elCurrentYear = document.getElementById('currentYear');
    if(elCurrentMonth) elCurrentMonth.textContent = mesActualStr.charAt(0).toUpperCase() + mesActualStr.slice(1);
    if(elCurrentYear) elCurrentYear.textContent = anioActualStr;
  
    // Deshabilitar botón "anterior" si estamos en el mes actual
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    if (prevMonthBtn) {
        prevMonthBtn.disabled = (hoy.getFullYear() === year && hoy.getMonth() === month);
    }
    
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
      const diaHeader = document.createElement('div');
      diaHeader.className = 'text-center fw-bold small text-muted';
      diaHeader.textContent = dia;
      container.appendChild(diaHeader);
    });
    
    const ultimoDia = new Date(year, month + 1, 0);
    const diaInicio = primerDiaDelMes.getDay();
    
    for (let i = 0; i < diaInicio; i++) {
      container.appendChild(document.createElement('div'));
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const esDomingo = fecha.getDay() === 0;
      const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const esPasado = fecha < hoySinHora;
      
      const dayElement = document.createElement('div');
      const esHoy = hoy.getFullYear() === year && hoy.getMonth() === month && dia === hoy.getDate();
      dayElement.className = `calendar-day ${esDomingo || esPasado ? 'disabled' : ''} ${esHoy ? 'today' : ''}`;
      dayElement.textContent = dia;
      
      if (!esDomingo && !esPasado) {
        const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        dayElement.onclick = (e) => seleccionarFecha(fechaStr, e.currentTarget);
      }
      
      container.appendChild(dayElement);
    }

    // NUEVO: Recalcular altura del contenedor si estamos en el paso del calendario (Paso 3)
    // Esto previene que el botón "Siguiente" quede oculto si el mes tiene 6 semanas
    if (pasoActual === 3) setTimeout(() => setStepView(3), 50);
  }
  
  function seleccionarFecha(fecha, elemento) {
    document.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
      day.classList.remove('selected');
    });
    
    elemento.classList.add('selected');
    datosCita.fecha = fecha;

    // Resetear la hora y deshabilitar el botón "Siguiente" al cambiar de fecha
    datosCita.hora = null;
    document.getElementById('btnPaso3').disabled = true;

    cargarHorarios();
  }
  
  function cargarHorarios() {
    const container = document.getElementById('horariosContainer');
    container.innerHTML = '';
    
    const horarios = [
      '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
      '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
      '4:00 PM', '4:30 PM', '5:00 PM'
    ];
    
    const horariosNoDisponibles = [];
    
    horarios.forEach(hora => {
      const slot = document.createElement('div');
      slot.className = `time-slot ${horariosNoDisponibles.includes(hora) ? 'disabled' : ''}`;
      slot.innerHTML = hora;
      
      if (!horariosNoDisponibles.includes(hora)) {
        slot.onclick = (e) => seleccionarHora(hora, e.currentTarget);
      }
      
      container.appendChild(slot);
    });

    // Después de cargar los horarios, recalcular la altura para que el botón sea visible
    setStepView(pasoActual);
  }
  
  function seleccionarHora(hora, elemento) {
    document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
      slot.classList.remove('selected');
    });
    
    elemento.classList.add('selected');
    datosCita.hora = hora;
    document.getElementById('btnPaso3').disabled = false;
  }
  
  // --- Navegación y Validación ---
  
  /**
   * Ajusta la vista del carrusel al paso actual.
   * Mueve el formulario y ajusta la altura del contenedor.
   * @param {number} paso - El número del paso a mostrar (1-4).
   */
  function setStepView(paso) {
    const slider = document.querySelector('.form-slider');
    const formContent = document.querySelector('.form-content');
    const targetStepElement = document.getElementById(`paso${paso}`);

    if (slider && formContent && targetStepElement) {
        // Mover el "track" del formulario
        const percentage = (paso - 1) * -25; // Cada paso es 25% del ancho total (400%)
        slider.style.transform = `translateX(${percentage}%)`;

        // Ajustar la altura del contenedor a la del paso actual
        // Usar scrollHeight + margen para asegurar que se vea todo el contenido y el botón
        formContent.style.height = `${targetStepElement.scrollHeight + 30}px`;
    }
  }

  /**
   * Salta directamente a un paso anterior que ya ha sido completado.
   * @param {number} targetStep - El número del paso al que se desea saltar.
   */
  function jumpToStep(targetStep) {
    if (targetStep >= pasoActual) return; // Solo para retroceder

    // Ocultar el paso actual
    document.getElementById(`paso${pasoActual}`).classList.remove('active');
    document.getElementById(`step${pasoActual}`).classList.remove('active');

    // Marcar los pasos intermedios como no completados
    for (let i = pasoActual - 1; i >= targetStep; i--) {
      const stepIndicator = document.getElementById(`step${i + 1}`);
      if (stepIndicator) {
        stepIndicator.classList.remove('active');
      }
      const targetIndicator = document.getElementById(`step${i}`);
      if (targetIndicator) {
        targetIndicator.classList.remove('completed');
        targetIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = i;
      }
    }

    pasoActual = targetStep;

    // Mostrar el paso de destino
    document.getElementById(`paso${pasoActual}`).classList.add('active');
    document.getElementById(`step${pasoActual}`).classList.add('active');

    // Actualizar la barra de progreso y la vista
    actualizarBarraDeProgreso();
    setStepView(pasoActual);
  }

  function siguientePaso(paso) {
    if (!validarPaso(paso)) return;
    
    document.getElementById(`paso${paso}`).classList.remove('active');
    
    const stepIndicator = document.getElementById(`step${paso}`);
    stepIndicator.classList.remove('active');
    stepIndicator.classList.add('completed');
    // Añadir ícono de check al completar
    stepIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = '<i class="bi bi-check-lg"></i>';
    
    pasoActual = paso + 1;
    document.getElementById(`paso${pasoActual}`).classList.add('active');
    document.getElementById(`step${pasoActual}`).classList.add('active');
    
    // Lógica de progreso mejorada (0%, 33%, 66%, 100%)
    actualizarBarraDeProgreso();
    if (pasoActual === 4) cargarResumen();

    setStepView(pasoActual);
    scrollToTopWizard();
  };
  
  function anteriorPaso(paso) {
    document.getElementById(`paso${paso}`).classList.remove('active');
    
    const stepIndicator = document.getElementById(`step${paso}`);
    stepIndicator.classList.remove('active');
    
    pasoActual = paso - 1;
    document.getElementById(`paso${pasoActual}`).classList.add('active');
    
    const prevStepIndicator = document.getElementById(`step${pasoActual}`);
    prevStepIndicator.classList.remove('completed');
    prevStepIndicator.classList.add('active');
    // Restaurar el número del paso
    prevStepIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = pasoActual;
    
    // Lógica de progreso mejorada (0%, 33%, 66%, 100%)
    actualizarBarraDeProgreso();

    setStepView(pasoActual);
    scrollToTopWizard();
  };

  /**
   * Realiza un scroll suave hacia arriba del formulario al cambiar de paso.
   * Mejora la experiencia en móviles evitando que el usuario quede al final de la página.
   */
  function scrollToTopWizard() {
    const slider = document.querySelector('.form-slider');
    const headerOffset = 180; // AUMENTADO: Compensar el nuevo padding superior del hero en móviles
    if (slider) {
        const elementPosition = slider.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }

  // Delegación de eventos para los botones de navegación del wizard
  const formSlider = document.querySelector('.form-slider');
  if (formSlider) {
    formSlider.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const paso = parseInt(button.dataset.step, 10);

      if (action === 'next') siguientePaso(paso);
      if (action === 'prev') anteriorPaso(paso);
    });
  }

  function actualizarBarraDeProgreso() {
    const progressBar = document.getElementById('progressBar');
    const totalPasos = 4;
    progressBar.style.width = `${((pasoActual - 1) / (totalPasos - 1)) * 100}%`;
  }
  
  function validarPaso(paso) {
    let valido = true;
    let mensajeError = '';
    
    if (paso === 1) {
      const campos = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 
                     'genero', 'telefono', 'correo', 'eps'];
      
      for (let campo of campos) {
        const elemento = document.getElementById(campo);
        if (!elemento.value) {
          elemento.classList.add('is-invalid');
          valido = false;
        } else {
          elemento.classList.remove('is-invalid');
        }
      }
      
      if (!valido) mensajeError = 'Por favor completa todos los campos obligatorios.';
      
      if (valido) {
        datosCita.paciente = {
          tipoDocumento: document.getElementById('tipoDocumento').value,
          numeroDocumento: document.getElementById('numeroDocumento').value,
          nombres: document.getElementById('nombres').value,
          apellidos: document.getElementById('apellidos').value,
          genero: document.getElementById('genero').value,
          telefono: document.getElementById('telefono').value,
          correo: document.getElementById('correo').value,
          eps: document.getElementById('eps').value
        };
      }
    } else if (paso === 2) {
      if (!datosCita.especialidad) {
        mensajeError = 'Por favor selecciona una especialidad.';
        valido = false;
      }
    } else if (paso === 3) {
      if (!datosCita.fecha || !datosCita.hora) {
        mensajeError = 'Por favor selecciona fecha y hora para tu cita.';
        valido = false;
      }
    }
    
    if (!valido) mostrarError(mensajeError);
    else ocultarError();
    
    return valido;
  }
  
  function cargarResumen() {
    document.getElementById('confirmNombre').textContent = `${datosCita.paciente.nombres} ${datosCita.paciente.apellidos}`;
    document.getElementById('confirmDocumento').textContent = `${datosCita.paciente.tipoDocumento} ${datosCita.paciente.numeroDocumento}`;
    document.getElementById('confirmTelefono').textContent = datosCita.paciente.telefono;
    document.getElementById('confirmCorreo').textContent = datosCita.paciente.correo;
    document.getElementById('confirmEps').textContent = datosCita.paciente.eps;
    document.getElementById('confirmEspecialidad').textContent = datosCita.especialidad.nombre;
    
    // Formatear fecha para mostrar (añadiendo T12:00:00 para evitar desfase al parsear)
    const fechaObj = new Date(datosCita.fecha + 'T12:00:00');
    const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('confirmFecha').textContent = fechaFormateada;
    document.getElementById('confirmHora').textContent = datosCita.hora;
  }
  
  // --- Envío y Confirmación ---
  
  async function confirmarCita(e) {
    e.preventDefault();
    
    // Verificar si estamos en modo desarrollo para evitar problemas CORS
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost') ||
                       window.location.port === '8000' ||
                       window.location.protocol === 'file:';

    console.log('🔍 Verificación de entorno:', {
        hostname: window.location.hostname,
        port: window.location.port,
        isLocalhost: isLocalhost
    });
    
    // Validación final del paso 4
    const motivo = document.getElementById('motivoConsulta').value.trim();
    const tieneWhatsapp = document.querySelector('input[name="tieneWhatsapp"]:checked');
    
    if (!motivo) {
      mostrarError('Por favor, describe el motivo de tu consulta');
      return;
    }
    if (!tieneWhatsapp) {
      mostrarError('Por favor, indica si el número celular tiene WhatsApp');
      return;
    }
    
    datosCita.motivoConsulta = motivo;
    datosCita.tieneWhatsapp = tieneWhatsapp.value;
    
    // Mostrar indicador de carga
    document.getElementById('loadingOverlay').style.display = 'flex';

    try {
      // PASO 1: Generar un radicado personalizado y guardar los datos de la cita
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const customRadicado = `HDSA-${year}${month}${day}-${hours}${minutes}${seconds}`;

      const dataToSave = {
        ...datosCita,
        paciente: { ...datosCita.paciente }, // Crear una copia para evitar problemas de referencia
        radicado: customRadicado, // Guardar el radicado personalizado
        ordenesMedicas: [], // Dejar vacío por ahora, se actualizará después de subir los archivos.
        status: 'Solicitada', // Estado inicial fijo para todas las citas
        createdAt: serverTimestamp() // Fecha y hora de creación en el servidor
      };

      let citaId;
      
      if (isLocalhost) {
        console.log('🔧 Modo desarrollo local - Simulando guardado en Firestore...');
        // Simular ID de documento
        citaId = 'mock_cita_' + Date.now();
        console.log('✅ Cita simulada con Radicado:', customRadicado);
        console.log('📝 Datos simulados:', dataToSave);
      } else {
        console.log('🌐 Modo producción - Guardando en Firestore real...');
        // Guardar el documento en la colección 'citasOnline' de Firestore
        const docRef = await addDoc(collection(db, "citasOnline"), dataToSave);
        citaId = docRef.id;
        console.log('✅ Cita guardada en Firestore con ID:', citaId, 'y Radicado:', customRadicado);
      }

      // PASO 2: Subir los archivos a Firebase Storage con manejo robusto de errores CORS
      const ordenesInput = document.getElementById('ordenesMedicas');
      const files = ordenesInput.files;
      const uploadedFilesInfo = [];
      let uploadErrors = [];
      let hasCorsError = false;

      // Envolver la subida de archivos y actualización en un bloque try/catch secundario
      // Esto evita que un fallo de red en este paso oculte el mensaje de éxito de la cita ya creada.
      try {
        if (files.length > 0 && !isLocalhost) {
        console.log('🌐 Iniciando subida de archivos a Firebase Storage...');
        
        // Obtener fecha actual para organizar carpetas por Año/Mes
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // Subir archivos en paralelo para mejor rendimiento
        const uploadPromises = Array.from(files).map(async (file, index) => {
          try {
            console.log(`Iniciando subida ${index + 1}/${files.length}: ${file.name}`);
            
            // Intentar comprimir si es imagen para ahorrar espacio (Plan Gratuito)
            const fileToUpload = await comprimirImagen(file);
            
            // Estructura organizada: citas/2024/03/ID_CITA/archivo.ext
            const storageRef = ref(storage, `citas/${year}/${month}/${citaId}/${fileToUpload.name}`);
            const snapshot = await uploadBytes(storageRef, fileToUpload);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return {
              success: true,
              data: {
              name: fileToUpload.name,
              url: downloadURL,
              size: fileToUpload.size,
              type: fileToUpload.type
              }
            };
          } catch (fileError) {
            console.error(`❌ Error subiendo ${file.name}:`, fileError);
            let isCors = false;
            // Detectar específicamente errores CORS
            if (fileError.message && fileError.message.includes('CORS') || 
                fileError.message && fileError.message.includes('blocked by CORS policy') ||
                fileError.code === 'storage/unauthorized') {
              isCors = true;
            }
            
            return {
              success: false,
              error: {
              fileName: file.name,
              error: fileError.message,
              isCorsError: isCors
              }
            };
          }
        });

        // Esperar a que todas las subidas terminen (éxito o fallo)
        const results = await Promise.all(uploadPromises);

        // Procesar resultados
        results.forEach(result => {
          if (result.success) {
            uploadedFilesInfo.push(result.data);
            console.log(`✅ Archivo ${result.data.name} subido exitosamente`);
          } else {
            if (result.error.isCorsError) {
              hasCorsError = true;
              console.warn('🚫 Error CORS detectado - archivo no subido');
            }
            uploadErrors.push(result.error);
          }
        });

        // Si hay errores CORS específicos, mostrar advertencia clara
        if (hasCorsError) {
          console.warn('⚠️ Problema CORS detectado - archivos no subidos');
          
          // Mostrar advertencia al usuario pero continuar con el proceso
          mostrarAdvertencia('Los archivos adjuntos no pudieron subirse debido a restricciones de seguridad. Su cita se ha registrado correctamente. Puede enviar los archivos por otros medios.');
        } else if (uploadErrors.length > 0) {
          console.warn('⚠️ Algunos archivos no se pudieron subir:', uploadErrors);
          mostrarError('Algunos archivos no se pudieron subir. Su cita se ha registrado correctamente.');
        }
      } else if (files.length > 0 && isLocalhost) {
        console.log('🔧 Modo desarrollo local - Simulando subida de archivos...');
        
        // Simular subida de archivos para desarrollo local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        Array.from(files).forEach((file, index) => {
          console.log(`📤 Simulando subida ${index + 1}/${files.length}: ${file.name}`);
          
          // Crear URL simulada
          const mockUrl = `http://localhost:8000/mock-storage/citas/${year}/${month}/${citaId}/${file.name}`;
          
          uploadedFilesInfo.push({
            name: file.name,
            url: mockUrl,
            size: file.size,
            type: file.type
          });
          
          console.log(`✅ Archivo simulado: ${file.name} -> ${mockUrl}`);
        });
      }

      // PASO 3: Actualizar el documento de la cita con las URLs de los archivos.
      if (uploadedFilesInfo.length > 0) {
        console.log('Actualizando cita con archivos:', uploadedFilesInfo);
        
        if (isLocalhost) {
          console.log('🔧 Modo desarrollo local - Simulando actualización en Firestore...');
          console.log('✅ Actualización simulada con archivos:', uploadedFilesInfo);
        } else {
          console.log('🌐 Modo producción - Actualizando Firestore real...');
          const citaDocRef = doc(db, "citasOnline", citaId);
          await updateDoc(citaDocRef, {
            ordenesMedicas: uploadedFilesInfo
          });
          console.log('✅ Firestore actualizado con archivos');
        }
      }
      } catch (secondaryError) {
          console.warn("⚠️ Advertencia: La cita se creó, pero hubo un error subiendo archivos o actualizando:", secondaryError);
          // Agregamos un error genérico a la lista para notificar al usuario en el modal, sin bloquear el éxito.
          uploadErrors.push({ fileName: 'Adjuntos', error: 'Problema de conexión al finalizar. La cita sí fue agendada.' });
      }

      // --- Éxito con posible advertencia de archivos ---
      const loadingEl = document.getElementById('loadingOverlay');
      if (loadingEl) loadingEl.style.display = 'none';
      
      // Preparar datos para el modal
      const fechaObj = new Date(datosCita.fecha + 'T12:00:00');
      const fechaCompleta = `${fechaObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${datosCita.hora}`;

      // Actualizar elementos existentes si están en el DOM
      const radicadoEl = document.getElementById('numeroRadicado');
      if (radicadoEl) radicadoEl.textContent = customRadicado;
      
      const fechaEl = document.getElementById('fechaConfirmada');
      if (fechaEl) fechaEl.textContent = fechaCompleta;
      
      // Mostrar advertencia si algunos archivos fallaron
      if (uploadErrors.length > 0) {
        const archivosFallidos = uploadErrors.map(err => err.fileName).join(', ');
        mostrarAdvertencia(`Tu cita fue registrada exitosamente, pero los siguientes archivos no se pudieron adjuntar: ${archivosFallidos}. Por favor, contáctanos para enviarlos por otro medio.`);
      }
      
      // Garantizar que el modal de éxito existe, si no, crearlo dinámicamente
      let modalElement = document.getElementById('modalExito');
      if (!modalElement) {
          const modalHtml = `
            <div class="modal fade" id="modalExito" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header border-0 bg-success text-white">
                            <h5 class="modal-title fw-bold"><i class="bi bi-check-circle-fill me-2"></i>¡Solicitud Exitosa!</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="mb-4">
                                <i class="bi bi-calendar-check text-success" style="font-size: 4rem;"></i>
                            </div>
                            <h4 class="fw-bold text-brand mb-3">Tu cita ha sido agendada</h4>
                            <p class="text-muted mb-4">Hemos recibido tu solicitud correctamente.</p>
                            
                            <div class="card bg-light border-0 mb-3">
                                <div class="card-body">
                                    <p class="mb-1 small text-muted">Número de Radicado:</p>
                                    <h3 class="fw-bold text-primary mb-3" id="numeroRadicadoDyn">${customRadicado}</h3>
                                    <p class="mb-1 small text-muted">Fecha y Hora:</p>
                                    <h5 class="fw-bold text-dark">${fechaCompleta}</h5>
                                </div>
                            </div>
                            
                            <div class="alert alert-info border-0 d-flex align-items-center" role="alert">
                                <i class="bi bi-info-circle-fill me-2 fs-4"></i>
                                <div class="small text-start">
                                    Te hemos enviado un correo con los detalles. Nuestro equipo te contactará pronto para confirmar.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer justify-content-center border-0 pb-4">
                            <button type="button" class="btn btn-success px-5 rounded-pill fw-bold shadow-sm" data-bs-dismiss="modal">
                                Aceptar y Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
          document.body.insertAdjacentHTML('beforeend', modalHtml);
          modalElement = document.getElementById('modalExito');
      }

      const modal = new bootstrap.Modal(modalElement);
      
      // Redirigir al inicio cuando se cierre el modal
      modalElement.addEventListener('hidden.bs.modal', () => {
          window.location.href = 'index.html';
      }, { once: true });

      modal.show();
    } catch (error) {
      // --- Manejo de Errores ---
      console.error("Error al guardar la cita y subir archivos: ", error);
      const loadingEl = document.getElementById('loadingOverlay');
      if (loadingEl) loadingEl.style.display = 'none';
      mostrarError('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.');
    }
  }
  
  /**
   * Función auxiliar para comprimir imágenes antes de subir
   * Reduce el tamaño drásticamente para mantener el plan gratuito de Firebase
   */
  function comprimirImagen(file) {
    // Si no es imagen, devolver el archivo original
    if (!file.type.match(/image.*/)) return Promise.resolve(file);

    return new Promise((resolve) => {
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              try {
                  // Configuración de compresión
                  const maxWidth = 1280; 
                  const quality = 0.7;
                  
                  let width = img.width;
                  let height = img.height;

                  if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                  }

                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);

                  canvas.toBlob((blob) => {
                    if (!blob) { resolve(file); return; }
                    // Intento seguro de crear archivo
                    try {
                        const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                        const compressedFile = new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    } catch (e) {
                        // Fallback para navegadores móviles antiguos que no soportan constructor File
                        blob.name = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                        resolve(blob);
                    }
                  }, 'image/jpeg', quality);
              } catch (e) {
                  console.warn("Error en compresión (canvas), usando original", e);
                  resolve(file);
              }
            };
            img.onerror = () => resolve(file);
          };
          reader.onerror = () => resolve(file);
      } catch (error) {
          console.warn("Error inicializando FileReader, usando original", error);
          resolve(file);
      }
    });
  }
  
  // --- Utilidades de UI ---
  
  function mostrarError(mensaje) {
    const el = document.getElementById('errorText');
    if(el) el.textContent = mensaje;
    const box = document.getElementById('errorMessage');
    if(box) {
        box.style.display = 'flex';
        box.className = 'alert alert-danger d-flex align-items-center';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 5000);
    }
  }
  
  function ocultarError() {
    const box = document.getElementById('errorMessage');
    if(box) box.style.display = 'none';
  }
  
  function mostrarAdvertencia(mensaje) {
    const el = document.getElementById('errorText');
    if(el) el.textContent = mensaje;
    const box = document.getElementById('errorMessage');
    if(box) {
        box.style.display = 'flex';
        box.className = 'alert alert-warning d-flex align-items-center';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 8000);
    }
  }
  
  function mostrarExito(mensaje) {
    const el = document.getElementById('errorText');
    if(el) el.textContent = mensaje;
    const box = document.getElementById('errorMessage');
    if(box) {
        box.style.display = 'flex';
        box.className = 'alert alert-success d-flex align-items-center';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 4000);
    }
  }
  
  /**
   * Muestra un modal elegante y amigable cuando el archivo es muy pesado.
   */
  function mostrarModalPesoExcedido(nombreArchivo, pesoActual, pesoMaximo, esImagen) {
    const pesoActualMB = (pesoActual / 1024 / 1024).toFixed(1);
    const pesoMaximoMB = (pesoMaximo / 1024 / 1024).toFixed(0);
    
    // Identificador único para el modal
    const modalId = 'modalPesoArchivo';
    let modalEl = document.getElementById(modalId);

    // Forzar la eliminación del modal anterior si existe para asegurar que se aplique el nuevo diseño
    if (modalEl) {
        modalEl.remove();
    }

    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div class="modal-header border-bottom bg-white p-3">
                        <h5 class="modal-title fw-bold text-danger">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Archivo demasiado pesado
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body p-4 text-center">
                        <div class="mb-3">
                            <span class="display-1 text-danger opacity-25">
                                <i class="bi bi-file-earmark-x"></i>
                            </span>
                        </div>
                        
                        <h5 class="fw-bold text-dark mb-2 text-break" id="${modalId}-filename"></h5>
                        
                        <div class="d-flex justify-content-center gap-3 my-3">
                            <div class="badge bg-danger bg-opacity-10 text-danger p-2 px-3 rounded-pill border border-danger border-opacity-25">
                                Pesa: <span id="${modalId}-size" class="fw-bold"></span> MB
                            </div>
                            <div class="badge bg-success bg-opacity-10 text-success p-2 px-3 rounded-pill border border-success border-opacity-25">
                                Máximo: <span id="${modalId}-limit" class="fw-bold"></span> MB
                            </div>
                        </div>

                        <div class="alert alert-light border-start border-4 border-warning text-start shadow-sm mt-4">
                            <h6 class="fw-bold text-warning-emphasis mb-1">
                                <i class="bi bi-lightbulb-fill me-2"></i>¿Qué puedo hacer?
                            </h6>
                            <p class="mb-0 small text-muted" id="${modalId}-sugerencia"></p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center border-0 pb-4">
                        <button type="button" class="btn btn-primary px-5 rounded-pill fw-bold shadow-sm" data-bs-dismiss="modal">
                            Entendido, intentaré de nuevo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modalEl = document.getElementById(modalId);

    document.getElementById(`${modalId}-filename`).textContent = nombreArchivo;
    document.getElementById(`${modalId}-size`).textContent = pesoActualMB;
    document.getElementById(`${modalId}-limit`).textContent = pesoMaximoMB;
    
    const sugerenciaEl = document.getElementById(`${modalId}-sugerencia`);
    if (esImagen) {
        sugerenciaEl.innerHTML = 'Esta imagen es muy pesada. Intenta tomar una <strong>captura de pantalla</strong> de la foto o envíala por WhatsApp y descárgala de nuevo para reducir su tamaño.';
    } else {
        sugerenciaEl.innerHTML = 'El archivo supera el límite de 2MB. <strong>Debe comprimir el PDF</strong> antes de subirlo.<br><br><strong>💡 Alternativa más fácil:</strong><br>En lugar de subir el PDF, tome una <strong>FOTO NÍTIDA</strong> del documento con su celular y adjúntela. El sistema optimizará la foto automáticamente.';
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

// Hacer funciones globales para que puedan ser accedidas desde otros scripts
  window.siguientePaso = siguientePaso;
  window.anteriorPaso = anteriorPaso;
  window.validarPaso = validarPaso;
  window.actualizarBarraDeProgreso = actualizarBarraDeProgreso;
  window.cargarResumen = cargarResumen;
  window.confirmarCita = confirmarCita;
  window.mostrarError = mostrarError;
  window.ocultarError = ocultarError;
  window.mostrarAdvertencia = mostrarAdvertencia;
  window.mostrarExito = mostrarExito;