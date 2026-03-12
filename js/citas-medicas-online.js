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
  
  // Inicialización
  document.addEventListener('DOMContentLoaded', function() {
    cargarEspecialidades();
    generarCalendario(fechaMostrada.getFullYear(), fechaMostrada.getMonth());
    
    // Configurar listeners
    const ordenesInput = document.getElementById('ordenesMedicas');
    if (ordenesInput) {
        ordenesInput.addEventListener('change', manejarCargaArchivos);
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
    const archivos = e.target.files;
    const listaArchivos = document.getElementById('listaArchivos');
    const contenedorArchivos = document.getElementById('archivosCargados');
    
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
    const input = document.getElementById('ordenesMedicas');
    const archivos = Array.from(input.files);
    
    archivos.splice(index, 1);
    
    const dt = new DataTransfer();
    archivos.forEach(archivo => dt.items.add(archivo));
    input.files = dt.files;
    
    const evento = new Event('change', { bubbles: true });
    input.dispatchEvent(evento);
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
        formContent.style.height = `${targetStepElement.offsetHeight}px`;
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
  };

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
      // PASO 1: Guardar los datos de la cita (sin los archivos) para obtener un ID.
      // Esto nos da un ID único para usar como carpeta para los archivos.
      const dataToSave = {
        ...datosCita,
        paciente: { ...datosCita.paciente }, // Crear una copia para evitar problemas de referencia
        ordenesMedicas: [], // Dejar vacío por ahora, se actualizará después de subir los archivos.
        status: 'Solicitada', // Estado inicial de la solicitud
        createdAt: serverTimestamp() // Fecha y hora de creación en el servidor
      };

      // Guardar el documento en la colección 'citasOnline' de Firestore
      const docRef = await addDoc(collection(db, "citasOnline"), dataToSave);
      const citaId = docRef.id;

      // PASO 2: Subir los archivos a Firebase Storage con manejo robusto de errores CORS
      const ordenesInput = document.getElementById('ordenesMedicas');
      const files = ordenesInput.files;
      const uploadedFilesInfo = [];
      let uploadErrors = [];
      let hasCorsError = false;

      if (files.length > 0) {
        console.log('Iniciando subida de archivos...');
        
        // Intentar subir archivos uno por uno con manejo CORS
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            console.log(`Subiendo archivo ${i + 1}/${files.length}: ${file.name}`);
            const storageRef = ref(storage, `citas/${citaId}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            uploadedFilesInfo.push({
              name: file.name,
              url: downloadURL,
              size: file.size,
              type: file.type
            });
            
            console.log(`✅ Archivo ${file.name} subido exitosamente`);
          } catch (fileError) {
            console.error(`❌ Error subiendo ${file.name}:`, fileError);
            
            // Detectar específicamente errores CORS
            if (fileError.message && fileError.message.includes('CORS') || 
                fileError.message && fileError.message.includes('blocked by CORS policy') ||
                fileError.code === 'storage/unauthorized') {
              hasCorsError = true;
              console.warn('🚫 Error CORS detectado - archivo no subido');
            }
            
            uploadErrors.push({
              fileName: file.name,
              error: fileError.message,
              isCorsError: hasCorsError
            });
          }
        }

        // Si hay errores CORS específicos, mostrar advertencia clara
        if (hasCorsError) {
          console.warn('⚠️ Problema CORS detectado - archivos no subidos');
          
          // Mostrar advertencia al usuario pero continuar con el proceso
          mostrarAdvertencia('Los archivos adjuntos no pudieron subirse debido a restricciones de seguridad. Su cita se ha registrado correctamente. Puede enviar los archivos por otros medios.');
        } else if (uploadErrors.length > 0) {
          console.warn('⚠️ Algunos archivos no se pudieron subir:', uploadErrors);
          mostrarError('Algunos archivos no se pudieron subir. Su cita se ha registrado correctamente.');
        }
      }

      // PASO 3: Actualizar el documento de la cita con las URLs de los archivos.
      const citaDocRef = doc(db, "citasOnline", citaId);
      await updateDoc(citaDocRef, {
        ordenesMedicas: uploadedFilesInfo
      });

      // --- Éxito con posible advertencia de archivos ---
      document.getElementById('loadingOverlay').style.display = 'none';
      
      document.getElementById('numeroRadicado').textContent = citaId; // Usar el ID de Firestore como radicado
      
      const fechaObj = new Date(datosCita.fecha + 'T12:00:00');
      const fechaCompleta = `${fechaObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${datosCita.hora}`;
      
      document.getElementById('fechaConfirmada').textContent = fechaCompleta;
      
      // Mostrar advertencia si algunos archivos fallaron
      if (uploadErrors.length > 0) {
        const archivosFallidos = uploadErrors.map(err => err.fileName).join(', ');
        mostrarAdvertencia(`Tu cita fue registrada exitosamente, pero los siguientes archivos no se pudieron adjuntar: ${archivosFallidos}. Por favor, contáctanos para enviarlos por otro medio.`);
      }
      
      const modal = new bootstrap.Modal(document.getElementById('modalExito'));
      modal.show();
    } catch (error) {
      // --- Manejo de Errores ---
      console.error("Error al guardar la cita y subir archivos: ", error);
      document.getElementById('loadingOverlay').style.display = 'none';
      mostrarError('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.');
    }
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