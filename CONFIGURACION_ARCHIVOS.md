# 🚀 Configuración CORS para Archivos Adjuntos - Firebase Storage

## 📋 Pasos para Configurar CORS y Permitir Subida de Archivos

### **🔧 Paso 1: Iniciar Sesión en Firebase**
```bash
firebase login
```
- Abre el navegador
- Inicia sesión con tu cuenta de Google
- Autoriza Firebase CLI

### **🔧 Paso 2: Aplicar Configuración CORS**
```bash
gsutil cors set cors.json gs://portal-institucional-185ec.firebasestorage.app
```

### **🔧 Paso 3: Verificar Configuración**
```bash
gsutil cors get gs://portal-institucional-185ec.firebasestorage.app
```

### **🔧 Paso 4: Probar Subida de Archivos**
1. **Inicia el servidor local**:
   ```bash
   npm start
   ```

2. **Abre el formulario**:
   ```
   https://localhost:3000/citas-medicas-online.html
   ```

3. **Llena el formulario completo** y **adjunta archivos** (PDF, imágenes)

4. **Envía la cita** - los archivos deberían subirse correctamente

### **🎯 Resultado Esperado**

#### **✅ En Firebase Console:**
```
Storage → portal-institucional-185ec.firebasestorage.app/
└── citas/
    └── [ID_CITA]/
        ├── orden-medica.pdf
        ├── autorizacion.jpg
        └── otros-archivos.png
```

#### **✅ En el Portal Administrativo:**
| Radicado | Paciente | Archivos Adjuntos | Estado |
|----------|----------|-------------------|---------|
| ABC123   | Juan Pérez | 📄 orden.pdf 📄 autorizacion.jpg | Solicitada |

#### **✅ Al hacer clic en los archivos:**
- **Se descargan** automáticamente
- **Se abren** en el visor correspondiente

### **🚨 Si Sigue Sin Funcionar:**

#### **Opción A: Verificar Permisos**
1. Ve a **Firebase Console**
2. **Storage → Reglas**
3. Asegúrate que las reglas permitan la subida:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /citas/{citaId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### **Opción B: Usar gsutil con autenticación**
```bash
# Si gsutil no está autenticado
gcloud auth login
gcloud config set project portal-institucional-185ec

# Luego aplicar CORS
gsutil cors set cors.json gs://portal-institucional-185ec.firebasestorage.app
```

### **📊 Flujo Completo de Archivos:**

```
1. Paciente sube archivos → 2. Firebase Storage → 3. URLs guardadas en Firestore → 4. Portal muestra archivos → 5. Admin descarga archivos
```

### **🔍 Verificación en Firestore:**
Las citas deberían tener:
```javascript
{
  id: "ABC123",
  paciente: { ... },
  ordenesMedicas: [
    {
      name: "orden-medica.pdf",
      url: "https://firebasestorage.googleapis.com/...",
      size: 1024000,
      type: "application/pdf"
    }
  ],
  status: "Solicitada"
}
```

### **🎯 Listo para Probar:**
1. **Ejecuta los comandos** de configuración CORS
2. **Reinicia el servidor local**
3. **Prueba subir archivos**
4. **Verifica en el portal**

**¿Quieres que te ayude a ejecutar estos comandos paso a paso?**
