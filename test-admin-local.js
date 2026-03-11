const admin = require('firebase-admin');

// --- CONFIGURACIÓN LOCAL ---
// Intenta cargar el archivo de credenciales que descargaste
try {
    const serviceAccount = require('./clave-citas-online.json');

    // Inicializar la app con la credencial del archivo
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin inicializado correctamente.');

    // --- TU LÓGICA DE PRUEBA AQUÍ ---
    async function probarAdminSDK() {
        try {
            console.log('🔍 Consultando lista de usuarios...');
            
            // Ejemplo: Listar los primeros 10 usuarios
            const listUsersResult = await admin.auth().listUsers(10);
            
            if (listUsersResult.users.length === 0) {
                console.log('⚠️ No se encontraron usuarios en la base de datos.');
            } else {
                console.log(`🎉 Se encontraron ${listUsersResult.users.length} usuarios:`);
                listUsersResult.users.forEach((userRecord) => {
                    console.log(`   - Email: ${userRecord.email} | UID: ${userRecord.uid} | Admin: ${userRecord.customClaims?.admin ? 'Sí' : 'No'}`);
                });
            }

        } catch (error) {
            console.error('❌ Error al ejecutar la operación:', error);
        }
    }

    probarAdminSDK();

} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('❌ ERROR: No se encontró el archivo "clave-citas-online.json".');
        console.error('   -> Ve a Firebase Console > Cuentas de servicio > Generar nueva clave privada.');
        console.error('   -> Guarda el archivo en esta carpeta con el nombre "clave-citas-online.json".');
    } else {
        console.error('❌ Error inesperado:', error);
    }
}