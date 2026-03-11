// Importar el SDK de Firebase Admin
const admin = require('firebase-admin');

// Inicializar la app de Firebase Admin usando las variables de entorno
// Firebase detecta automáticamente estas variables si tienen los nombres estándar.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}


exports.handler = async function(event, context) {
  // Solo permitir peticiones GET para este ejemplo
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Ejemplo: Obtener una lista de los primeros 5 usuarios registrados
    const listUsersResult = await admin.auth().listUsers(5);
    
    const users = listUsersResult.users.map(userRecord => {
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Lista de los primeros 5 usuarios obtenida con éxito.',
        users: users
      }),
    };

  } catch (error) {
    console.error('Error al listar usuarios con Firebase Admin:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor al procesar la solicitud.' 
      }),
    };
  }
};
