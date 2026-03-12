# 🧪 Guía de Pruebas - Portal Institucional

## 🎯 Objetivo
Verificar que el campo **Estado** sea desplegable en la tabla de gestión y que el sistema de email funcione correctamente.

## 📋 Pasos para Probar

### 1. Acceder al Portal Institucional
```
🌐 URL Local: https://localhost:3000/portal-institucional.html
🌐 URL Producción: https://hdsa.gov.co/portal-institucional.html
📧 Email: coord.sistemas@hdsa.gov.co
🔐 Contraseña: [tu contraseña]
```

### 2. Ir al Panel de Gestión de Citas
1. Hacer clic en **"Gestionar Citas"**
2. Ver la tabla con las solicitudes

### 3. Verificar Campo Estado Desplegable
En la tabla deberías ver:

| Radicado | Paciente | Especialidad | Fecha Solicitada | **Estado** | Acciones |
|-----------|----------|--------------|------------------|--------------|-----------|
| ID12345 | Juan Pérez | Medicina General | 12/03/2024 | **▼** | Ver Archivos Responder |

**El campo "Estado" debe ser:**
- ✅ **Un desplegable (select)**
- ✅ **Con las opciones**: Solicitada, En Proceso, Confirmada, Atendida, Cancelada
- ✅ **Selecciona automáticamente** el estado actual

### 4. Probar Cambio de Estado
1. **Seleccionar un estado diferente** del desplegable
2. **Esperar 2 segundos** (se actualiza en Firebase)
3. **Refrescar la página** (el estado debe mantenerse)

### 5. Probar Sistema de Email
1. **Hacer clic** en botón **"Responder"** de cualquier cita
2. **Se abre un modal** con formulario de email
3. **Completar los campos:**
   - Para: [email del paciente]
   - Asunto: "Respuesta a su solicitud"
   - Mensaje: [texto de prueba]
4. **Hacer clic** en **"Enviar Email"**

### 6. Verificar Resultados

#### Modo Desarrollo (localhost):
- ✅ **Alerta**: "MODO PRUEBA: Email simulado enviado"
- ✅ **Consola**: Muestra los datos del email
- ✅ **Logs**: Se guarda en Firestore (colección emailLogs)

#### Modo Producción (hdsa.gov.co):
- ✅ **Email real** enviado al paciente
- ✅ **Confirmación** en pantalla
- ✅ **Estado actualizado** a "En Proceso"

## 🔍 Verificación Técnica

### En la Consola del Navegador:
```javascript
// Verificar que el desplegable existe
document.querySelectorAll('.status-select').length > 0

// Verificar event listeners
getEventListeners(document.querySelector('.status-select'))

// Verificar actualización en Firebase
db.collection('citasOnline').onSnapshot(snapshot => {
    console.log('Citas actualizadas:', snapshot.docs.map(doc => doc.data()));
});
```

### En Firebase Console:
```
🌐 https://console.firebase.google.com/project/portal-institucional-185ec/firestore/data
📁 Colección: "citasOnline"
📋 Ver que el campo "status" se actualiza
📁 Colección: "emailLogs" (solo si se envían emails)
```

## 🐛 Solución de Problemas Comunes

### El desplegable no aparece:
```javascript
// Verificar que el CSS se cargue
console.log(document.querySelector('select.form-select-sm'));

// Forzar actualización
location.reload();
```

### El estado no se actualiza:
```javascript
// Verificar permisos Firebase
auth.currentUser?.email // debe ser coord.sistemas@hdsa.gov.co

// Verificar conexión a Firestore
db.collection('citasOnline').get()
```

### El email no se envía:
```javascript
// Verificar EmailJS
console.log(typeof emailjs); // debe ser 'object'

// Verificar configuración
console.log(window.EMAILJS_CONFIG);
```

## 📊 Resultados Esperados

### ✅ Funcionalidad Correcta:
- **Desplegable de estado** visible y funcional
- **Cambios se guardan** en tiempo real
- **Emails se envían** (o simulan en desarrollo)
- **Logs completos** de actividad
- **Interfaz responsiva** y usable

### 🔄 Actualización en Tiempo Real:
Cuando un administrador cambia un estado, **todos los usuarios** ven la actualización inmediatamente gracias a **Firebase onSnapshot**.

## 📱 Pruebas Móviles
- **Probar en celular** y tablet
- **Verificar que el desplegable** funcione con touch
- **Confirmar que los botones** sean accesibles

---

## 🎯 Checklist Final

- [ ] El campo **Estado** es desplegable
- [ ] Los cambios de estado **se guardan** en Firebase
- [ ] Los emails **se envían** correctamente
- [ ] La interfaz **funciona** en móvil
- [ ] Los **logs** se registran correctamente
- [ ] La **experiencia de usuario** es fluida

**Todo listo para producción** cuando todos los ítems estén marcados.
