# 📊 Análisis de Base de Datos Firebase

## 🗄️ Información del Proyecto Firebase

**Project ID:** `portal-institucional-185ec`  
**Storage Bucket:** `portal-institucional-185ec.firebasestorage.app`  
**Dominio:** `hdsa.gov.co`

## 📋 Estructura de Datos

### 1. Firestore Database (Datos Estructurados)

```
📁 Colección: "citasOnline"
├── 📄 Documento: [ID_AUTOGENERADO]
│   ├── paciente: {
│   │   ├── tipoDocumento: "CC"
│   │   ├── numeroDocumento: "12345678"
│   │   ├── nombres: "Nombre Paciente"
│   │   ├── apellidos: "Apellido Paciente"
│   │   ├── genero: "Masculino"
│   │   ├── telefono: "3214567890"
│   │   ├── correo: "email@ejemplo.com"
│   │   └── eps: "SURA"
│   │   }
│   ├── especialidad: {
│   │   ├── id: "general"
│   │   ├── nombre: "Medicina General"
│   │   └── descripcion: "Consulta médica general"
│   │   }
│   ├── fecha: "2024-03-15"
│   ├── hora: "10:00 AM"
│   ├── motivoConsulta: "Descripción del motivo"
│   ├── tieneWhatsapp: "Si"
│   ├── ordenesMedicas: [
│   │   {
│   │   │   name: "documento.pdf"
│   │   │   url: "https://firebasestorage.googleapis.com/..."
│   │   │   size: 1024000
│   │   │   type: "application/pdf"
│   │   │   }
│   │   ]
│   ├── status: "Solicitada" | "Aprobada" | "Completada" | "Cancelada"
│   ├── createdAt: Timestamp (servidor)
│   └── corsIssue: true/false (marcado si hubo problemas)
```

### 2. Firebase Storage (Archivos)

```
📁 Bucket: portal-institucional-185ec.firebasestorage.app
└── 📁 citas/
    └── 📁 [ID_CITA]/
        ├── 📄 orden-medica.pdf
        ├── 📄 resultado-laboratorio.jpg
        ├── 📄 historia-clinica.png
        └── 📄 otros-documentos.docx
```

## 🔍 Acceso a los Datos

### Opción 1: Firebase Console (Administración)

1. **URL:** https://console.firebase.google.com/
2. **Email:** coord.sistemas@hdsa.gov.co
3. **Proyecto:** portal-institucional-185ec

**Navegación:**
- **Firestore Database** → Ver/editar datos de citas
- **Storage** → Ver/archivos adjuntos
- **Authentication** → Gestionar usuarios
- **Hosting** → Configuración del sitio

### Opción 2: Portal Institucional (Panel Administrativo)

**URL:** https://hdsa.gov.co/portal-institucional.html

**Funciones:**
- Ver citas en tiempo real
- Cambiar estados
- Ver detalles pacientes
- Descargar archivos
- Filtrar por fecha/estado

## 📊 Consultas Útiles

### Obtener todas las citas
```javascript
import { collection, getDocs, orderBy } from "firebase/firestore";

const q = query(collection(db, "citasOnline"), orderBy("createdAt", "desc"));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.id, " => ", doc.data());
});
```

### Obtener citas por estado
```javascript
import { collection, query, where, getDocs } from "firebase/firestore";

const q = query(collection(db, "citasOnline"), where("status", "==", "Solicitada"));
const querySnapshot = await getDocs(q);
```

### Obtener citas por fecha
```javascript
import { collection, query, where, getDocs } from "firebase/firestore";

const hoy = new Date().toISOString().split('T')[0];
const q = query(collection(db, "citasOnline"), where("fecha", "==", hoy));
const querySnapshot = await getDocs(q);
```

## 📈 Estadísticas Disponibles

- Total de citas por día/semana/mes
- Citas por especialidad
- Tiempo promedio de atención
- Tasa de completion
- Archivos adjuntos por cita

## 🔧 Herramientas de Monitoreo

Firebase Console incluye:
- **Realtime Database Listener** (actualizaciones en vivo)
- **Usage Analytics** (consumo y costos)
- **Security Rules** (permisos y acceso)
- **Index Management** (optimización de consultas)
