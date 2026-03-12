# 📧 Configuración de Email para Portal Institucional

## 🎯 Objetivo
Habilitar el envío de correos electrónicos directamente desde el portal institucional para responder a las solicitudes de citas.

## 📋 Requisitos Previos

### 1. Correo Institucional
```
📧 Email: citas@hdsa.gov.co
🔐 Contraseña: [Configurar segura]
🏢 Proveedor: Configurar (Gmail, Outlook, etc.)
```

### 2. Servidor de Email (Backend)
Se necesita un servicio backend para enviar emails. Opciones:

#### Opción A: EmailJS (Recomendado para empezar)
```javascript
// Configuración EmailJS
- Service ID: [Crear en EmailJS]
- Template ID: [Crear plantilla]
- Public Key: [Obtener de EmailJS]
```

#### Opción B: Firebase Cloud Functions
```javascript
// Función para enviar emails
exports.sendEmailResponse = functions.https.onCall(async (data, context) => {
  // Lógica para enviar email con Nodemailer
});
```

#### Opción C: API Externa (SendGrid, Mailgun)
```javascript
// Configuración SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## 🛠️ Implementación EmailJS (Más Simple)

### Paso 1: Crear cuenta EmailJS
1. Ir a https://www.emailjs.com/
2. Crear cuenta gratuita
3. Conectar servicio de email (Gmail, Outlook)

### Paso 2: Crear plantilla de email
```
Asunto: Respuesta a su solicitud de cita médica - Hospital San Antonio

Contenido:
Estimado/a {{nombre_paciente}},

Le escribimos en respuesta a su solicitud de cita médica.

{{mensaje_personalizado}}

Detalles de su cita:
- Especialidad: {{especialidad}}
- Fecha: {{fecha}}
- Hora: {{hora}}
- Estado: {{estado}}

Para cualquier consulta, contáctenos:
📞 Teléfono: (2) 2295000
📧 Email: citas@hdsa.gov.co
🏥 Dirección: Avenida Santander # 10-50, Roldanillo

Atentamente,
Hospital Departamental San Antonio de Roldanillo
```

### Paso 3: Integrar en el portal
```javascript
// Agregar a portal-institucional-v2.js
(function() {
    emailjs.init("TU_PUBLIC_KEY");
})();

async function sendEmailResponse(docId, pacienteEmail) {
    try {
        const response = await emailjs.send("TU_SERVICE_ID", "TU_TEMPLATE_ID", {
            to_email: pacienteEmail,
            from_name: "Hospital San Antonio",
            message: document.getElementById('emailMessage').value,
            // ... otros datos
        });
        
        console.log('Email enviado:', response);
        alert('✅ Email enviado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al enviar email');
    }
}
```

## 📄 Plantillas de Email Predefinidas

### 1. Confirmación de Cita
```
Asunto: ✅ SU CITA HA SIDO CONFIRMADA - Hospital San Antonio

Estimado/a {{nombre_paciente}},

Nos complace confirmar su cita médica:

📅 Fecha: {{fecha}}
⏰ Hora: {{hora}}
🏥 Especialidad: {{especialidad}}
📍 Ubicación: Hospital Departamental San Antonio

Por favor arrive 15 minutos antes de su cita.
Si no puede asistir, avísenos con 24 horas de anticipación.

Teléfono: (2) 2295000
```

### 2. Cancelación de Cita
```
Asunto: ❌ CANCELACIÓN DE CITA - Hospital San Antonio

Estimado/a {{nombre_paciente}},

Lamentamos informarle que su cita ha sido cancelada por:
{{motivo_cancelacion}}

Para reagendar una nueva cita, por favor:
📞 Llamar al (2) 2295000
🌐 Visitar nuestro portal web
📧 Enviar email a citas@hdsa.gov.co

Disculpe las molestias.
```

### 3. Recordatorio de Cita
```
Asunto: 📅 RECORDATORIO DE CITA - Hospital San Antonio

Estimado/a {{nombre_paciente}},

Le recordamos su cita programada para:

📅 Mañana: {{fecha}}
⏰ Hora: {{hora}}
🏥 {{especialidad}}

📍 Dirección: Avenida Santander # 10-50, Roldanillo
📞 Teléfono: (2) 2295000

No olvide traer:
📄 Documento de identidad
📄 Orden médica (si aplica)
📄 Resultados de exámenes (si tiene)

Lo esperamos!
```

## 🔧 Configuración Avanzada

### Variables del Sistema
```javascript
const EMAIL_CONFIG = {
    serviceId: 'service_hdsa',
    templateId: 'template_cita_response',
    publicKey: 'PUBLIC_KEY_HERE',
    fromEmail: 'citas@hdsa.gov.co',
    fromName: 'Hospital San Antonio',
    hospitalInfo: {
        name: 'Hospital Departamental San Antonio de Roldanillo',
        phone: '(2) 2295000',
        address: 'Avenida Santander # 10-50, Roldanillo',
        email: 'citas@hdsa.gov.co'
    }
};
```

### Automatización de Estados
```javascript
const EMAIL_TRIGGERS = {
    'Confirmada': 'template_confirmation',
    'Cancelada': 'template_cancellation',
    'En Proceso': 'template_in_process',
    'Atendida': 'template_attended'
};
```

## 📊 Métricas y Seguimiento

### Estadísticas de Email
- 📈 Emails enviados por día/semana/mes
- 📊 Tasa de respuesta de pacientes
- 📝 Plantillas más utilizadas
- ⏱️ Tiempo promedio de respuesta

### Logs de Actividad
```javascript
// Registrar cada envío
await addDoc(collection(db, "emailLogs"), {
    citaId: docId,
    pacienteEmail: pacienteEmail,
    template: templateId,
    sentAt: serverTimestamp(),
    sentBy: auth.currentUser.email,
    status: 'sent'
});
```

## 🚀 Próximos Pasos

1. **Configurar cuenta EmailJS**
2. **Crear plantillas de email**
3. **Obtener credenciales**
4. **Probar envío de emails**
5. **Implementar en producción**
6. **Monitorear uso y rendimiento**
