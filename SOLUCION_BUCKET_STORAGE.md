# 🚀 Solución: Crear Bucket de Cloud Storage para Firebase

## 🚨 Problema Detectado

**"La ubicación de tus datos se estableció en una región que no admite buckets de Storage sin costo"**

Esto significa que el proyecto `portal-institucional-185ec` está en una región que requiere pago para Storage.

## 🛠️ Soluciones Disponibles

### **Opción 1: Crear Bucket de Cloud Storage (Recomendado)**

#### **Paso 1: Ir a Google Cloud Console**
1. Abre: **https://console.cloud.google.com**
2. Inicia sesión con: **sistemashdsa@gmail.com**
3. Selecciona el proyecto: **portal-institucional-185ec**

#### **Paso 2: Crear Bucket**
1. **Menú** → **Cloud Storage** → **Navegador**
2. **Haz clic** en **Crear bucket**
3. **Configura el bucket**:
   - **Nombre**: `portal-institucional-185ec-storage`
   - **Tipo de ubicación**: **Multirregión** 
   - **Ubicación**: **US** (admite Storage gratuito)
   - **Clase de almacenamiento**: **Estándar**
   - **Control de acceso**: **Uniforme**
   - **Protección**: **Desactivar** todas las opciones

#### **Paso 3: Configurar Firebase para usar el nuevo bucket**
1. **Ve a Firebase Console**: https://console.firebase.google.com
2. **Selecciona el proyecto**: `portal-institucional-185ec`
3. **Ve a Configuración del proyecto** (⚙️)
4. **En la pestaña Cuentas de servicio**, descarga la clave JSON
5. **Actualiza la configuración de Firebase**

### **Opción 2: Cambiar Región del Proyecto**

#### **Paso 1: Crear Nuevo Proyecto**
1. **Ve a Firebase Console**
2. **Crea un nuevo proyecto**: `portal-hdsa-v2`
3. **Selecciona región**: **US-Central1** (admite Storage gratuito)

#### **Paso 2: Migrar Datos**
1. **Exporta datos** del proyecto actual
2. **Importa datos** al nuevo proyecto
3. **Actualiza configuración** en el código

### **Opción 3: Usar Storage con Pago**

#### **Paso 1: Activar Facturación**
1. **Ve a Google Cloud Console**
2. **Configura facturación** (tarjeta de crédito)
3. **Activa Cloud Storage API**

#### **Paso 2: Crear Bucket**
1. **Sigue los pasos** de la Opción 1
2. **El bucket funcionará** con pago por uso

## 🎯 Recomendación: Opción 1

**Crear un bucket en la región US** es la mejor opción porque:
- ✅ **Admite Storage gratuito** (hasta 1GB)
- ✅ **No requiere pago** si el uso es bajo
- ✅ **Mismo proyecto Firebase**
- ✅ **Configuración sencilla**

## 📋 Pasos Detallados - Opción 1

### **1. Crear Bucket en Google Cloud Console**
```
1. https://console.cloud.google.com
2. Proyecto: portal-institucional-185ec
3. Cloud Storage → Navegador → Crear bucket
4. Nombre: portal-institucional-185ec-storage
5. Multirregión → US
6. Clase: Estándar
7. Control: Uniforme
```

### **2. Configurar Firebase**
1. **Ve a Firebase Console**
2. **Configuración del proyecto** → **Cuentas de servicio**
3. **Descarga clave JSON**
4. **Actualiza firebase-config.js**:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "portal-institucional-185ec",
  storageBucket: "portal-institucional-185ec-storage.appspot.com", // Nuevo bucket
  messagingSenderId: "...",
  appId: "..."
};
```

### **3. Configurar CORS**
Una vez creado el bucket, aplica la configuración CORS:

```bash
gsutil cors set cors.json gs://portal-institucional-185ec-storage.appspot.com
```

## 🔄 Después de Crear el Bucket

1. **Reinicia el servidor local**
2. **Prueba la subida de archivos**
3. **Verifica en el portal**
4. **Los archivos deberían funcionar**

## 💡 Costos Estimados

**Storage gratuito (plan Spark):**
- ✅ **1 GB** de almacenamiento
- ✅ **10 GB** de descargas/mes
- ✅ **20,000** operaciones de escritura/mes
- ✅ **50,000** operaciones de lectura/mes

**Para el hospital:** Más que suficiente para órdenes médicas y autorizaciones.

## 🚀 ¿Qué Prefieres Hacer?

1. **Crear bucket en región US** (recomendado)
2. **Crear nuevo proyecto Firebase** 
3. **Activar facturación** (pago por uso)

**¿Quieres que te guíe paso a paso para crear el bucket?**
