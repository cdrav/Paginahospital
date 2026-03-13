# 🔧 Configuración CORS - Guía Rápida para Firebase Console

## 📋 Pasos Manuales (Recomendado)

### **Paso 1: Ir a Firebase Console**
1. Abre tu navegador
2. Ve a: **https://console.firebase.google.com**
3. Inicia sesión con: **sistemashdsa@gmail.com**

### **Paso 2: Seleccionar el Proyecto**
1. Busca y selecciona: **portal-institucional-185ec**

### **Paso 3: Ir a Storage**
1. En el menú izquierdo, haz clic en **Storage**
2. Verás el bucket: **portal-institucional-185ec.firebasestorage.app**

### **Paso 4: Configurar CORS**
1. Haz clic en la pestaña **Reglas** (Rules)
2. Reemplaza el contenido actual con:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir acceso a archivos de citas
    match /citas/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir acceso público para desarrollo (temporal)
    match /citas/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Haz clic en **Publicar** (Publish)

### **Paso 5: Configurar CORS Avanzado**
Si las reglas no son suficientes, usa Google Cloud Console:

1. Ve a: **https://console.cloud.google.com**
2. Selecciona el proyecto: **portal-institucional-185ec**
3. Busca **Cloud Storage** → **Navegador**
4. Selecciona el bucket: **portal-institucional-185ec.firebasestorage.app**
5. Haz clic en **Configurar CORS**
6. Pega esta configuración:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://hdsa.gov.co",
      "https://www.hdsa.gov.co"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "X-Requested-With"],
    "maxAgeSeconds": 3600
  }
]
```

7. Haz clic en **Guardar**

### **Paso 6: Probar**
1. **Reinicia el servidor local**: `npm start`
2. **Abre el formulario**: `https://localhost:3000/citas-medicas-online.html`
3. **Adjunta archivos** y envía la cita
4. **Verifica en el portal** que los archivos aparezcan

### **🚀 Si Funciona:**
- ✅ Los archivos se suben a Firebase Storage
- ✅ El portal muestra los archivos adjuntos
- ✅ Los administradores pueden descargar los archivos

### **🔍 Verificación:**
En Firebase Console → Storage, deberías ver:
```
citas/
└── [ID_DE_LA_CITA]/
    ├── orden-medica.pdf
    ├── autorizacion.jpg
    └── otros-archivos.png
```

### **📞 Si tienes problemas:**
1. **Verifica las reglas** de Storage
2. **Limpia el cache** del navegador
3. **Reinicia el servidor** local
4. **Revisa la consola** del navegador para errores

**¿Quieres que te espere mientras configuras esto en Firebase Console?**
