# 📊 Capacidad de Almacenamiento Firebase

## 🗄️ Información del Proyecto

**Project ID:** `portal-institucional-185ec`  
**Plan Firebase:** Spark Plan (Gratis)  
**Storage Bucket:** `portal-institucional-185ec.firebasestorage.app`

## 💾 Capacidad Actual (Spark Plan)

### **Firestore Database**
- ✅ **Límite:** 1 GiB de almacenamiento
- ✅ **Operaciones diarias:** 50,000 lecturas, 20,000 escrituras, 20,000 eliminaciones
- ✅ **Conexiones simultáneas:** 100

### **Firebase Storage**
- ✅ **Límite:** 1 GiB de almacenamiento
- ✅ **Descargas:** 10 GB/mes
- ✅ **Operaciones:** 20,000 subidas/mes, 50,000 descargas/mes

### **Hosting**
- ✅ **Límite:** 10 sitios
- ✅ **Almacenamiento:** 1 GiB
- ✅ **Transferencia:** 10 GB/mes

## 📈 Uso Estimado para Citas Médicas

### **Por cada cita con archivos:**
- **Datos Firestore:** ~2 KB
- **Archivos Storage:** Variable (PDF: 200KB - 5MB, Imágenes: 50KB - 2MB)

### **Proyección mensual:**
```
📊 100 citas/mes × 3 archivos promedio × 500KB = 150MB Storage/mes
📊 100 citas × 2KB = 200KB Firestore/mes
```

### **Capacidad real estimada:**
- **Firestore:** Puede manejar ~500,000 citas
- **Storage:** Puede manejar ~2,000 citas con archivos de 500KB

## 🔄 Planes de Actualización

### **Blaze Plan (Pago por uso)**
- **Firestore:** $0.18/GB-mes
- **Storage:** $0.026/GB-mes
- **Descargas:** $0.12/GB-mes
- **Sin límites** de operaciones

### **Recomendación:**
- **< 100 citas/mes:** Spark Plan suficiente
- **> 100 citas/mes:** Considerar Blaze Plan
- **> 1,000 citas/mes:** Blaze Plan necesario

## 📊 Monitoreo del Uso

### **Para ver el uso actual:**
1. **Firebase Console** → "Usage and billing"
2. **Firestore** → "Usage" tab
3. **Storage** → "Usage" tab

### **Alertas recomendadas:**
- 📧 Email al 80% de capacidad
- 📱 Notificación al 90% de uso mensual

## 💡 Optimizaciones Sugeridas

### **Para reducir almacenamiento:**
1. **Comprimir imágenes** antes de subir
2. **Limitar tamaño de archivos** (máx 5MB)
3. **Eliminar archivos** de citas canceladas
4. **Archivar citas** antiguas (> 1 año)

### **Para mejorar rendimiento:**
1. **Índices en Firestore** para consultas frecuentes
2. **Cache de imágenes** en navegador
3. **Lazy loading** para archivos grandes
