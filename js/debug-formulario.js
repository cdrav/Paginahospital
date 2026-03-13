// Script de depuración para el formulario de citas
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Script de depuración cargado');
    
    // Verificar que todos los elementos existan
    setTimeout(() => {
        const campos = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'genero', 'telefono', 'correo', 'eps'];
        
        console.log('📋 Verificando campos del formulario:');
        
        let todosExisten = true;
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                console.log(`✅ ${campo}: encontrado (value: "${elemento.value}")`);
            } else {
                console.error(`❌ ${campo}: NO ENCONTRADO`);
                todosExisten = false;
            }
        });
        
        // Verificar botón siguiente
        const botonSiguiente = document.querySelector('button[data-action="next"][data-step="1"]');
        if (botonSiguiente) {
            console.log('✅ Botón siguiente paso 1 encontrado');
        } else {
            console.error('❌ Botón siguiente paso 1 NO ENCONTRADO');
        }
        
        // Agregar event listener manual para depuración
        if (botonSiguiente) {
            botonSiguiente.addEventListener('click', function(e) {
                console.log('🖱️ Botón siguiente clickeado');
                console.log('📊 Estado de los campos:');
                
                campos.forEach(campo => {
                    const elemento = document.getElementById(campo);
                    if (elemento) {
                        console.log(`  ${campo}: "${elemento.value}" (válido: ${!!elemento.value})`);
                    }
                });
                
                // Ejecutar validación manual
                let valido = true;
                campos.forEach(campo => {
                    const elemento = document.getElementById(campo);
                    if (!elemento || !elemento.value) {
                        console.error(`❌ Campo inválido: ${campo}`);
                        valido = false;
                    }
                });
                
                console.log(`🎯 Validación resultado: ${valido ? 'VÁLIDO' : 'INVÁLIDO'}`);
                
                if (valido) {
                    console.log('✅ Debería avanzar al paso 2');
                } else {
                    console.log('❌ No debería avanzar - mostrar errores');
                }
            });
        }
        
        // Verificar función siguientePaso
        if (typeof siguientePaso === 'function') {
            console.log('✅ Función siguientePaso disponible');
        } else {
            console.error('❌ Función siguientePaso NO DISPONIBLE');
        }
        
    }, 2000);
});
