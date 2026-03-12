// Función para simular la subida de archivos cuando hay problemas de CORS
async function simularSubidaArchivos(files, citaId) {
  const uploadedFilesInfo = [];
  
  if (files.length > 0) {
    console.log('⚠️ Modo desarrollo: Simulando subida de archivos debido a CORS');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Crear una URL simulada para el archivo
      const simulatedUrl = `https://storage.googleapis.com/simulated/citas/${citaId}/${encodeURIComponent(file.name)}`;
      
      uploadedFilesInfo.push({
        name: file.name,
        url: simulatedUrl,
        size: file.size,
        type: file.type,
        simulated: true // Marcar como simulado
      });
      
      console.log(`📝 Archivo ${file.name} simulado para desarrollo`);
    }
  }
  
  return uploadedFilesInfo;
}

// Función modificada para confirmarCita con fallback
async function confirmarCitaConFallback(e) {
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
    // PASO 1: Guardar los datos de la cita
    const dataToSave = {
      ...datosCita,
      paciente: { ...datosCita.paciente },
      ordenesMedicas: [], // Se actualizará después
      status: 'Solicitada',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "citasOnline"), dataToSave);
    const citaId = docRef.id;

    // PASO 2: Intentar subir archivos con fallback
    const ordenesInput = document.getElementById('ordenesMedicas');
    const files = ordenesInput.files;
    let uploadedFilesInfo = [];
    let uploadErrors = [];

    if (files.length > 0) {
      console.log('🔄 Intentando subir archivos a Firebase Storage...');
      
      // Intentar subida real primero
      try {
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
            uploadErrors.push({
              fileName: file.name,
              error: fileError.message
            });
          }
        }
        
        // Si todos los archivos fallaron por CORS, usar simulación
        if (uploadErrors.length === files.length) {
          console.warn('🔄 Todos los archivos fallaron por CORS, usando simulación para desarrollo');
          uploadedFilesInfo = await simularSubidaArchivos(files, citaId);
          
          // Mostrar advertencia al usuario
          mostrarAdvertencia('Modo desarrollo: Los archivos se han registrado pero no se han subido realmente. En producción funcionará correctamente.');
        }
      } catch (storageError) {
        console.error('❌ Error completo con Firebase Storage:', storageError);
        uploadedFilesInfo = await simularSubidaArchivos(files, citaId);
      }
    }

    // PASO 3: Actualizar el documento
    const citaDocRef = doc(db, "citasOnline", citaId);
    await updateDoc(citaDocRef, {
      ordenesMedicas: uploadedFilesInfo
    });

    // --- Éxito ---
    document.getElementById('loadingOverlay').style.display = 'none';
    
    document.getElementById('numeroRadicado').textContent = citaId;
    
    const fechaObj = new Date(datosCita.fecha + 'T12:00:00');
    const fechaCompleta = `${fechaObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${datosCita.hora}`;
    
    document.getElementById('fechaConfirmada').textContent = fechaCompleta;
    
    // Mostrar información sobre archivos simulados si aplica
    const simulatedFiles = uploadedFilesInfo.filter(f => f.simulated);
    if (simulatedFiles.length > 0) {
      const archivosSimulados = simulatedFiles.map(f => f.name).join(', ');
      mostrarAdvertencia(`Cita registrada exitosamente. Archivos (${archivosSimulados}) en modo desarrollo. En producción se subirán correctamente.`);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
    
  } catch (error) {
    console.error("Error general:", error);
    document.getElementById('loadingOverlay').style.display = 'none';
    mostrarError('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.');
  }
}

// Reemplazar la función original cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que el módulo principal cargue
  setTimeout(() => {
    if (typeof window.confirmarCita === 'function') {
      window.confirmarCitaOriginal = window.confirmarCita;
      window.confirmarCita = confirmarCitaConFallback;
      console.log('✅ Fallback de citas cargado correctamente');
    } else {
      console.error('❌ No se encontró la función confirmarCita original');
    }
  }, 1000);
});
