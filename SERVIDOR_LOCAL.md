# 🚀 Servidor Local HTTPS - Hospital HDSA

## 📋 Requisitos
- ✅ Node.js instalado (v22.18.0)
- ✅ npm instalado (v10.9.3)
- ✅ Dependencias instaladas

## 🎯 Para Iniciar el Servidor

### **Opción 1: Iniciar Directamente**
```bash
cd c:\Users\auxsistemas2\Desktop\Paginahospital
npm start
```

### **Opción 2: Modo Desarrollo**
```bash
cd c:\Users\auxsistemas2\Desktop\Paginahospital
npm run dev
```

### **Opción 3: Ejecutar el servidor directamente**
```bash
cd c:\Users\auxsistemas2\Desktop\Paginahospital
node server-local.js
```

## 🌐 URLs Disponibles

Una vez iniciado el servidor, accede a:

### **Páginas Principales:**
- 🏠 **Página Principal**: https://localhost:3000
- 📝 **Formulario Citas**: https://localhost:3000/citas-medicas-online.html
- 🏢 **Portal Institucional**: https://localhost:3000/portal-institucional.html
- 🔐 **Login Administrativo**: https://localhost:3000/login-institucional.html

### **Recursos:**
- 📁 **CSS**: https://localhost:3000/css/
- 📁 **JavaScript**: https://localhost:3000/js/
- 📁 **Imágenes**: https://localhost:3000/imagenes/

## ⚠️ Advertencia de Seguridad

**IMPORTANTE:** El servidor usa certificado SSL auto-firmado, por lo que el navegador mostrará una advertencia:

```
Tu conexión no es privada
NET::ERR_CERT_AUTHORITY_INVALID
```

**Cómo solucionarlo:**
1. **Haz clic en "Avanzado"**
2. **Haz clic en "Ir a localhost (no seguro)"**
3. **La página cargará correctamente**

## 🔧 Características del Servidor

### **✅ Configuración CORS:**
- Permite solicitudes desde `https://localhost:3000`
- Permite solicitudes desde `https://hdsa.gov.co`
- Métodos: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With

### **✅ Funcionalidades:**
- **Archivos estáticos** servidos correctamente
- **Logging** de todas las peticiones
- **Manejo de errores** robusto
- **API de prueba** para simulación
- **HTTPS** con certificado auto-firmado

### **✅ Límites:**
- **JSON**: 50MB
- **URL encoded**: 50MB
- **Archivos**: Sin límite (depende del sistema)

## 🧪 Pruebas que Puedes Realizar

### **1. Formulario de Citas:**
1. Accede a: https://localhost:3000/citas-medicas-online.html
2. Llena todos los campos
3. Adjunta archivos (deberían funcionar sin CORS)
4. Envía el formulario
5. Verifica que la cita se registre

### **2. Portal Administrativo:**
1. Accede a: https://localhost:3000/portal-institucional.html
2. Inicia sesión con: `coord.sistemas@hdsa.gov.co`
3. Prueba el desplegable de estados
4. Prueba el envío de emails (modo desarrollo)

### **3. Archivos Adjuntos:**
1. Prueba subir archivos PDF
2. Prueba subir imágenes
3. Verifica que no haya errores CORS
4. Confirma que los archivos se procesen

## 🐛 Solución de Problemas

### **Error: "Port already in use"**
```bash
# Cambiar el puerto en server-local.js
const PORT = 3001; // o cualquier otro puerto
```

### **Error: "Certificate expired"**
```bash
# Elimina los certificados generados automáticamente
# El servidor generará nuevos al reiniciar
```

### **Error: "Cannot GET /url"**
```bash
# Verifica que el archivo exista en la carpeta correcta
# La URL debe coincidir con el nombre del archivo
```

### **Error de Firebase:**
```javascript
// Abre la consola del navegador y verifica:
console.log('Firebase config:', window.firebaseConfig);
// Asegúrate de que las credenciales sean correctas
```

## 📊 Ventajas del Servidor Local

### **✅ Sin Problemas CORS:**
- Los archivos se suben correctamente
- No hay bloqueos de seguridad
- Ambiente controlado de desarrollo

### **✅ Desarrollo Rápido:**
- Cambios se reflejan al instante
- Logs detallados en consola
- Facil depuración

### **✅ Pruebas Completas:**
- Todas las funcionalidades disponibles
- Simulación de producción
- Ambiente aislado

## 🛑 Para Detener el Servidor

**Presiona `Ctrl + C`** en la terminal donde está corriendo el servidor.

---

**🎯 Listo para probar:** Ejecuta `npm start` y accede a https://localhost:3000
