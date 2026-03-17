/**
 * Lógica para el sistema de Citas Médicas Online - VERSIÓN DESARROLLO
 * Maneja el wizard de pasos, validaciones, calendario y simulación de envío.
 */

import { db, storage } from './firebase-config-dev.js';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

    // Delegación de eventos para elementos dinámicos
    const listaArchivosContainer = document.getElementById('listaArchivos');
    if (listaArchivosContainer) {
        listaArchivosContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.btn-remove-file');
            if (removeBtn) {
                const index = parseInt(removeBtn.dataset.index, 10);
                eliminarArchivo(index);
            }
        });
    }

    const especialidadesContainer = document.getElementById('especialidadesContainer');
    if (especialidadesContainer) {
        especialidadesContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.specialty-card');
            if (card) {
                seleccionarEspecialidad(card.dataset.id, card.dataset.nombre, card);
            }
        });
    }
    
    console.log('Formulario inicializado completamente');
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
          <button type="button" class="btn btn-sm btn-outline-danger btn-remove-file" data-index="${i}">
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
  
  function eliminarArchivo(index) {
    const input = document.getElementById('ordenesMedicas');
    const archivos = Array.from(input.files);
    
    archivos.splice(index, 1);
    
    const dt = new DataTransfer();
    archivos.forEach(archivo => dt.items.add(archivo));
    input.files = dt.files;
    
    const evento = new Event('change', { bubbles: true });
    input.dispatchEvent(evento);
  }
  
  // --- Lógica del Wizard y Pasos ---
  
  async function cargarEspecialidades() {
 const container = document.getElementById('especialidadesContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    // Datos de ejemplo mientras se resuelve Firebase
    const especialidadesEjemplo = [
        { id: '1', nombre: 'Medicina General', icono: 'bi-hospital', descripcion: 'Atención médica general para adultos y niños' },
        { id: '2', nombre: 'Pediatría', icono: 'bi-emoji-smile', descripcion: 'Cuidado médico especializado para niños' },
        { id: '3', nombre: 'Ginecología', icono: 'bi-heart', descripcion: 'Salud integral de la mujer' },
        { id: '4', nombre: 'Ortopedia', icono: 'bi-activity', descripcion: 'Tratamiento de huesos y articulaciones' }
    ];
    try {
        // Intentar cargar desde Firebase primero
        const q = collection(db, "especialidades");
        const querySnapshot = await getDocs(q);
        const especialidades = [];
        querySnapshot.forEach((doc) => {
            especialidades.push({ id: doc.id, ...doc.data() });
        });
        console.log('Especialidades cargadas desde Firebase:', especialidades);
        
        // Si no hay datos en Firebase, usar datos de ejemplo
        const especialidadesAMostrar = especialidades.length > 0 ? especialidades : especialidadesEjemplo;
        
        container.innerHTML = '';
        especialidadesAMostrar.forEach(esp => {
            const card = document.createElement('div');
            card.className = 'specialty-card'; 
            card.dataset.id = esp.id;
            card.dataset.nombre = esp.nombre;
            card.innerHTML = `
                <div class="specialty-icon"><i class="bi ${esp.icono || 'bi-hospital'}"></i></div>
                <h5>${esp.nombre}</h5>
                <p class="text-muted">${esp.descripcion || 'Atención especializada.'}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando especialidades desde Firestore: ", error);
        console.log("Usando datos de ejemplo como fallback...");
        
        // Usar datos de ejemplo si hay error con Firebase
        container.innerHTML = '';
        especialidadesEjemplo.forEach(esp => {
            const card = document.createElement('div');
            card.className = 'specialty-card'; 
            card.dataset.id = esp.id;
            card.dataset.nombre = esp.nombre;
            card.innerHTML = `
                <div class="specialty-icon"><i class="bi ${esp.icono || 'bi-hospital'}"></i></div>
                <h5>${esp.nombre}</h5>
                <p class="text-muted">${esp.descripcion || 'Atención especializada.'}</p>
            `;
            container.appendChild(card);
        });
    }
  }
  
/**
 * Selects a specialty card, highlights it, and stores the specialty data.
 */
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
    
    horarios.forEach(hora => {
      const slot = document.createElement('div');
      slot.className = 'time-slot';
      slot.innerHTML = hora;
      slot.onclick = (e) => seleccionarHora(hora, e.currentTarget);
      container.appendChild(slot);
    });
  }
  
  function seleccionarHora(hora, elemento) {
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.classList.remove('selected');
    });
    
    elemento.classList.add('selected');
    datosCita.hora = hora;
    document.getElementById('btnPaso3').disabled = false;
  }
  
  // --- Navegación y Validación ---
  
  function setStepView(paso) {
    const slider = document.querySelector('.form-slider');
    const formContent = document.querySelector('.form-content');
    const targetStepElement = document.getElementById(`paso${paso}`);

    console.log(`setStepView llamado: paso=${paso}, slider=${!!slider}, target=${!!targetStepElement}`);

    if (slider && formContent && targetStepElement) {
      const percentage = (paso - 1) * -25;
      slider.style.transform = `translateX(${percentage}%)`;
      
      const targetHeight = targetStepElement.offsetHeight;
      formContent.style.height = `${Math.max(targetHeight, 400)}px`;
      
      slider.style.display = 'none';
      slider.offsetHeight;
      slider.style.display = '';
      
      targetStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      console.log(`Vista ajustada: paso=${paso}, altura=${targetHeight}px`);
    } else {
      console.error('No se encontraron los elementos para ajustar la vista');
    }
  }

  function jumpToStep(targetStep) {
    if (targetStep >= pasoActual) return;

    // Ocultar paso actual
    const currentStepElement = document.getElementById(`paso${pasoActual}`);
    if (currentStepElement) {
      currentStepElement.classList.remove('active');
    }

    // Marcar pasos intermedios como no completados
    for (let i = pasoActual - 1; i >= targetStep; i--) {
      const stepIndicator = document.getElementById(`step${i + 1}`);
      if (stepIndicator) {
        stepIndicator.classList.remove('completed');
        stepIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = i + 1;
      }
    }

    // Actualizar paso actual
    pasoActual = targetStep;

    // Mostrar nuevo paso
    const targetStepElement = document.getElementById(`paso${pasoActual}`);
    if (targetStepElement) {
      targetStepElement.classList.add('active');
    }

    // Actualizar indicadores
    const targetIndicator = document.getElementById(`step${pasoActual}`);
    if (targetIndicator) {
      targetIndicator.classList.add('active');
    }

    actualizarBarraDeProgreso();
    setStepView(pasoActual);
  }
  
  function validarPaso(paso) {
    let valido = true;
    let mensajeError = '';
    
    console.log(`=== INICIANDO VALIDACIÓN PASO ${paso} ===`);
    
    if (paso === 1) {
      const campos = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 
                     'genero', 'telefono', 'correo', 'eps'];
      
      for (let campo of campos) {
        const elemento = document.getElementById(campo);
        console.log(`Validando campo: ${campo}, elemento:`, elemento);
        if (!elemento || !elemento.value) {
          if (elemento) elemento.classList.add('is-invalid');
          valido = false;
          console.log(`❌ Campo vacío o no encontrado: ${campo}`);
        } else {
          elemento.classList.remove('is-invalid');
          console.log(`✅ Campo válido: ${campo}, valor: ${elemento.value}`);
        }
      }
      
      console.log(`Resultado validación: valido=${valido}`);
      
      if (!valido) mensajeError = 'Por favor completa todos los campos obligatorios.';
      
      if (valido) {
        console.log('Guardando datos del paciente...');
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
        console.log('Datos del paciente guardados:', datosCita.paciente);
      }
    } else if (paso === 2) {
      if (!datosCita.especialidad) {
        mensajeError = 'Por favor selecciona una especialidad.';
        valido = false;
        console.log('❌ No se seleccionó especialidad');
      } else {
        console.log('✅ Especialidad seleccionada:', datosCita.especialidad);
      }
    } else if (paso === 3) {
      if (!datosCita.fecha || !datosCita.hora) {
        mensajeError = 'Por favor selecciona fecha y hora para tu cita.';
        valido = false;
        console.log('❌ No se seleccionó fecha u hora');
      } else {
        console.log('✅ Fecha y hora seleccionadas:', datosCita.fecha, datosCita.hora);
      }
    }
    
    console.log(`=== FIN VALIDACIÓN PASO ${paso}: valido=${valido} ===`);
    
    if (!valido) mostrarError(mensajeError);
    else ocultarError();
    
    return valido;
  }
  
  function siguientePaso(paso) {
    console.log('Intentando avanzar desde paso:', paso, 'Paso actual:', pasoActual);
    
    if (!validarPaso(paso)) {
      console.log('Validación falló en paso:', paso);
      return;
    }
    
    console.log('Validación exitosa, avanzando al paso:', paso + 1);
    
    // Actualizar indicador de paso actual
    const stepIndicator = document.getElementById(`step${paso}`);
    if (stepIndicator) {
      stepIndicator.classList.remove('active');
      stepIndicator.classList.add('completed');
      stepIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = '<i class="bi bi-check-lg"></i>';
    }
    
    // Avanzar al siguiente paso
    pasoActual = paso + 1;
    const nextStepIndicator = document.getElementById(`step${pasoActual}`);
    if (nextStepIndicator) {
      nextStepIndicator.classList.add('active');
    }
    
    actualizarBarraDeProgreso();
    
    // Si llegamos al paso 4, cargar el resumen
    if (pasoActual === 4) {
      cargarResumen();
    }
    
    setStepView(pasoActual);
  }
  
  function anteriorPaso(paso) {
    const stepIndicator = document.getElementById(`step${paso}`);
    stepIndicator.classList.remove('active');
    
    pasoActual = paso - 1;
    
    const prevStepIndicator = document.getElementById(`step${pasoActual}`);
    prevStepIndicator.classList.remove('completed');
    prevStepIndicator.classList.add('active');
    prevStepIndicator.querySelector('.step-content-wrapper .step-number').innerHTML = pasoActual;
    
    actualizarBarraDeProgreso();
    setStepView(pasoActual);
  }
  
  function actualizarBarraDeProgreso() {
    const progressBar = document.getElementById('progressBar');
    const totalPasos = 4;
    progressBar.style.width = `${((pasoActual - 1) / (totalPasos - 1)) * 100}%`;
  }
  
  function cargarResumen() {
    document.getElementById('confirmNombre').textContent = `${datosCita.paciente.nombres} ${datosCita.paciente.apellidos}`;
    document.getElementById('confirmDocumento').textContent = `${datosCita.paciente.tipoDocumento} ${datosCita.paciente.numeroDocumento}`;
    document.getElementById('confirmTelefono').textContent = datosCita.paciente.telefono;
    document.getElementById('confirmCorreo').textContent = datosCita.paciente.correo;
    document.getElementById('confirmEps').textContent = datosCita.paciente.eps;
    document.getElementById('confirmEspecialidad').textContent = datosCita.especialidad.nombre;
    
    const fechaObj = new Date(datosCita.fecha + 'T12:00:00');
    const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('confirmFecha').textContent = fechaFormateada;
    document.getElementById('confirmHora').textContent = datosCita.hora;
    document.getElementById('confirmMotivo').textContent = datosCita.motivoConsulta || 'No especificado';
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
      // Verificar si estamos en modo desarrollo
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost') ||
                         window.location.port === '8000' ||
                         window.location.protocol === 'file:';

      console.log('🔍 Verificación de entorno en confirmarCita:', {
          hostname: window.location.hostname,
          port: window.location.port,
          isLocalhost: isLocalhost
      });

      // PASO 1: Guardar los datos de la cita (simulado si es localhost)
      const dataToSave = {
        ...datosCita,
        paciente: { ...datosCita.paciente }, // Crear una copia para evitar problemas de referencia
        ordenesMedicas: [], // Dejar vacío por ahora, se actualizará después de subir los archivos.
        status: 'Solicitada', // Estado inicial fijo para todas las citas
        createdAt: serverTimestamp() // Fecha y hora de creación en el servidor
      };

      let citaId;
      
      if (isLocalhost) {
        console.log('🔧 Modo desarrollo local - Simulando guardado en Firestore...');
        // Simular ID de documento
        citaId = 'mock_cita_' + Date.now();
        console.log('✅ Cita simulada con ID:', citaId);
        console.log('📝 Datos simulados:', dataToSave);
      } else {
        console.log('🌐 Modo producción - Guardando en Firestore real...');
        // Guardar el documento en la colección 'citasOnline' de Firestore
        const docRef = await addDoc(collection(db, "citasOnline"), dataToSave);
        citaId = docRef.id;
        console.log('✅ Cita guardada en Firestore con ID:', citaId);
      }

      // PASO 2: Subir los archivos (solo si no estamos en localhost)
      const ordenesInput = document.getElementById('ordenesMedicas');
      const files = ordenesInput.files;
      const uploadedFilesInfo = [];
      let uploadErrors = [];

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
            
            return {
              success: false,
              error: {
              fileName: file.name,
              error: fileError.message,
              isCorsError: fileError.message && fileError.message.includes('CORS')
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
              console.warn('🚫 Error CORS detectado - archivo no subido');
            }
            uploadErrors.push(result.error);
          }
        });

        // Si hay errores CORS específicos, mostrar advertencia clara
        if (uploadErrors.some(err => err.isCorsError)) {
          console.warn('⚠️ Problema CORS detectado - archivos no subidos');
          
          // Mostrar advertencia al usuario pero continuar con el proceso
          mostrarAdvertencia('Hay problemas para subir los archivos debido a restricciones de seguridad del navegador. Tu cita será registrada, pero los archivos no se adjuntaron. Por favor, contáctanos para enviar los archivos por otros medios.');
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

      // PASO 3: Actualizar el documento con la información de los archivos (si se subieron/simularon)
      if (uploadedFilesInfo.length > 0) {
        console.log('Actualizando cita con archivos:', uploadedFilesInfo);
        
        if (isLocalhost) {
          console.log('🔧 Modo desarrollo local - Simulando actualización en Firestore...');
          console.log('✅ Actualización simulada con archivos:', uploadedFilesInfo);
        } else {
          console.log('🌐 Modo producción - Actualizando Firestore real...');
          await updateDoc(doc(db, "citasOnline", citaId), {
            ordenesMedicas: uploadedFilesInfo
          });
          console.log('✅ Firestore actualizado con archivos');
        }
      }

      // PASO 4: Mostrar éxito y limpiar formulario
      console.log('✅ Cita confirmada exitosamente');
      const successMessage = isLocalhost 
        ? '¡Cita solicitada exitosamente en modo desarrollo! Los archivos fueron simulados.'
        : '¡Cita solicitada exitosamente! Te contactaremos pronto para confirmar los detalles.';
      
      console.log('📝 Mensaje de éxito a mostrar:', successMessage);
      mostrarExito(successMessage);
      
      // Limpiar formulario
      console.log('🔄 Iniciando limpieza de formulario...');
      setTimeout(() => {
        console.log('🧹 Ejecutando limpieza del formulario');
        const form = document.getElementById('citaForm');
        if (form) {
          form.reset();
          console.log('✅ Formulario reseteado');
        }
        
        jumpToStep(1);
        console.log('✅ Saltando al paso 1');
        
        datosCita = {
          paciente: {},
          especialidad: null,
          fecha: null,
          hora: null,
          motivoConsulta: '',
          tieneWhatsapp: '',
          ordenesMedicas: null
        };
        pasoActual = 1;
        actualizarBarraDeProgreso();
        console.log('✅ Variables limpiadas y paso reseteado');
      }, 2000); // Reducir el timeout para mejor experiencia

    } catch (error) {
      console.error('❌ Error general al confirmar cita:', error);
      mostrarError('Ocurrió un error al procesar tu cita. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      // Ocultar indicador de carga
      console.log('🔄 Ocultando indicador de carga...');
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        console.log('✅ Indicador de carga oculto');
      } else {
        console.warn('⚠️ No se encontró el indicador de carga');
      }
    }
  }
  
  // --- Utilidades de Compresión y UI ---
  
  async function comprimirImagen(file) {
    // Si no es imagen, devolver el archivo original
    if (!file.type.startsWith('image/')) {
      return file;
    }
    
    // Si el archivo ya es pequeño, no comprimir
    if (file.size <= 500 * 1024) { // 500KB
      return file;
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones (máximo 1200px de ancho)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob con calidad reducida
        canvas.toBlob(resolve, 'image/jpeg', 0.7);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  function mostrarError(mensaje) {
    const box = document.getElementById('errorMessage');
    const text = document.getElementById('errorText');
    if(box && text) {
        text.textContent = mensaje;
        box.style.display = 'flex';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 5000);
    }
  }
  
  function ocultarError() {
    const box = document.getElementById('errorMessage');
    if(box) {
        box.style.display = 'none';
    }
  }
  
  function mostrarAdvertencia(mensaje) {
    const box = document.getElementById('errorMessage');
    const text = document.getElementById('errorText');
    if(box && text) {
        text.textContent = mensaje;
        box.className = 'alert-overlay';
        box.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>${mensaje}</div>
            </div>
        `;
        box.style.display = 'flex';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 8000);
    }
  }
  
  function mostrarExito(mensaje) {
    const box = document.getElementById('errorMessage');
    const text = document.getElementById('errorText');
    if(box && text) {
        text.textContent = mensaje;
        box.className = 'alert-overlay';
        box.innerHTML = `
            <div class="alert alert-success d-flex align-items-center" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>
                <div>${mensaje}</div>
            </div>
        `;
        box.style.display = 'flex';
        setTimeout(() => { 
            box.style.display = 'none'; 
        }, 4000);
    }
  }
  
  // Sistema de inicialización robusto para resolver el problema de timing
let initializationAttempts = 0;
const MAX_ATTEMPTS = 10;

function initializeWhenReady() {
    initializationAttempts++;
    console.log(`🔄 Intento de inicialización ${initializationAttempts}/${MAX_ATTEMPTS}`);
    
    const requiredElements = [
        '.form-slider',
        '.form-content', 
        '#paso1',
        'button[data-action]',
        '.step-wizard'
    ];
    
    const allReady = requiredElements.every(selector => {
        const elements = document.querySelectorAll(selector);
        return elements.length > 0;
    });
    
    if (allReady) {
        console.log('✅ Todos los elementos requeridos están en el DOM');
        setupNavigation();
    } else if (initializationAttempts < MAX_ATTEMPTS) {
        setTimeout(initializeWhenReady, 200);
    } else {
        console.error('❌ No se pudieron encontrar todos los elementos después de múltiples intentos');
        setupNavigation(); // Forzar inicialización de todos modos
    }
}

function setupNavigation() {
    console.log('🧭 Configurando navegación robusta...');
    
    const buttons = document.querySelectorAll('button[data-action]');
    console.log(`📋 Encontrados ${buttons.length} botones de navegación`);
    
    buttons.forEach((button, index) => {
        const action = button.dataset.action;
        const step = parseInt(button.dataset.step, 10);
        
        console.log(`🔘 Configurando botón ${index + 1}: ${action} (paso ${step})`);
        
        // Eliminar eventos anteriores
        button.removeEventListener('click', button._clickHandler);
        
        // Crear nuevo handler robusto
        button._clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🎯 Click detectado: ${action} en paso ${step}`);
            
            if (action === 'next') {
                siguientePaso(step);
            } else if (action === 'prev') {
                anteriorPaso(step);
            }
        };
        
        // Agregar evento con múltiples opciones para máxima compatibilidad
        button.addEventListener('click', button._clickHandler, { capture: true });
        button.onclick = button._clickHandler;
    });
    
    console.log('✅ Navegación configurada correctamente');
}

// Inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
    initializeWhenReady();
}

// Fallback adicional
window.addEventListener('load', () => {
    setTimeout(initializeWhenReady, 500);
});

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
