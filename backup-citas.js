const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const SERVICE_ACCOUNT_FILE = './clave-citas-online.json';
const COLLECTION_NAME = 'citasOnline';

try {
    // 1. Inicializar Firebase Admin
    const serviceAccount = require(SERVICE_ACCOUNT_FILE);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    const db = admin.firestore();
    console.log('✅ Conectado a Firestore correctamente.');

    // 2. Función de respaldo
    async function backupCollection() {
        try {
            console.log(`📦 Iniciando respaldo de la colección: ${COLLECTION_NAME}...`);
            
            const snapshot = await db.collection(COLLECTION_NAME).get();
            
            if (snapshot.empty) {
                console.log('⚠️ La colección está vacía. No hay nada que respaldar.');
                return;
            }

            const data = [];
            snapshot.forEach(doc => {
                // Guardamos el ID del documento y todos sus datos
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // 3. Guardar en archivo JSON con fecha y hora
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${COLLECTION_NAME}-${timestamp}.json`;
            const filePath = path.join(__dirname, filename);

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            console.log(`🎉 Respaldo completado con éxito.`);
            console.log(`📄 Total de documentos: ${data.length}`);
            console.log(`💾 Archivo guardado en: ${filePath}`);

        } catch (error) {
            console.error('❌ Error durante el respaldo:', error);
        }
    }

    backupCollection();

} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error(`❌ ERROR: No se encontró el archivo "${SERVICE_ACCOUNT_FILE}".`);
    } else {
        console.error('❌ Error inesperado:', error);
    }
}
