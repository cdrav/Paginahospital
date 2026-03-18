// Importar Firebase Firestore
import { 
    doc, 
    updateDoc, 
    addDoc, 
    collection, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

// Configuración de EmailJS para pruebas locales
(function() {
    // Configuración para desarrollo local
    window.EMAILJS_CONFIG = {
        isDevelopment: false, // Cambiar a false en producción
        serviceId: 'service_dxylc2z', // Tu Service ID real
        templateId: 'template_27m7z1g', // Template ID real configurado
        publicKey: 'gcybOcZM8nYnJy19f', // Tu Public Key real
        
        // Configuración de producción
        testMode: {
            enabled: false, // Desactivar en producción
            logEmails: true, // Mostrar emails en consola
            simulateSending: false // Enviar emails reales
        }
    };
    
    // Inicializar EmailJS si está disponible
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log('✅ EmailJS inicializado en modo', EMAILJS_CONFIG.isDevelopment ? 'desarrollo' : 'producción');
    }
})();

// Función mejorada para enviar emails con soporte local
async function sendEmailResponse(docId, pacienteEmail) {
    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;
    const updateStatus = document.getElementById('emailUpdateStatus').checked;

    try {
        // Mostrar loading
        const sendBtn = document.getElementById('sendEmailBtn');
        if (!sendBtn) {
            throw new Error('Botón de envío no encontrado');
        }
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        sendBtn.disabled = true;

        // Datos del email
        const emailData = {
            to_email: pacienteEmail,
            from_name: 'Hospital San Antonio',
            from_email: 'sistemashdsa@gmail.com', // Email remitente
            subject: subject,
            message: message,
            reply_to: 'citas@hdsa.gov.co', // Email del hospital para respuestas
            bcc: 'sistemashdsa@gmail.com', // Copia oculta para control
            hospital_info: {
                name: 'Hospital Departamental San Antonio de Roldanillo',
                phone: '(2) 2295000',
                address: 'Avenida Santander # 10-50, Roldanillo',
                email: 'citas@hdsa.gov.co' // Email institucional
            }
        };

        // Modo desarrollo local
        if (EMAILJS_CONFIG.isDevelopment && EMAILJS_CONFIG.testMode.enabled) {
            console.log('📧 MODO DESARROLLO - Email no enviado realmente');
            console.log('📋 Datos del email:', emailData);
            console.log('📧 From:', emailData.from_email);
            console.log('📧 Reply-To:', emailData.reply_to);
            console.log('📧 BCC:', emailData.bcc);
            
            // Simular envío exitoso
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mostrar confirmación
            alert(`✅ MODO PRUEBA: Email simulado enviado a: ${pacienteEmail}\n\nDesde: ${emailData.from_email}\nResponder a: ${emailData.reply_to}\nCon copia a: ${emailData.bcc}\n\nAsunto: ${subject}\n\nMensaje: ${message.substring(0, 100)}...`);
            
        } else {
            // Modo producción - enviar email real
            if (typeof emailjs !== 'undefined') {
                const response = await emailjs.send(
                    EMAILJS_CONFIG.serviceId,
                    EMAILJS_CONFIG.templateId,
                    emailData
                );
                
                console.log('✅ Email enviado exitosamente:', response);
                alert('✅ Email enviado exitosamente a: ' + pacienteEmail);
            } else {
                throw new Error('EmailJS no está configurado');
            }
        }

        // Actualizar estado si se solicitó
        if (updateStatus) {
            await updateDoc(doc(db, "citasOnline", docId), {
                status: 'En Proceso',
                emailSent: true,
                emailSentAt: new Date(),
                emailSubject: subject,
                emailMessage: message.substring(0, 500) + '...' // Guardar parte del mensaje
            });
            console.log('📊 Estado actualizado a "En Proceso"');
        }

        // Registrar log del email
        await addDoc(collection(db, "emailLogs"), {
            citaId: docId,
            pacienteEmail: pacienteEmail,
            subject: subject,
            message: message.substring(0, 200) + '...',
            sentAt: serverTimestamp(),
            sentBy: auth.currentUser.email,
            mode: EMAILJS_CONFIG.isDevelopment ? 'development' : 'production',
            status: 'sent'
        });

        // Restaurar botón
        if (sendBtn) {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
        if (modal) {
            modal.hide();
        }
        
        // Limpiar formulario
        document.getElementById('emailSubject').value = '';
        document.getElementById('emailMessage').value = '';
        document.getElementById('emailUpdateStatus').checked = false;
        
        // Actualizar tabla de citas
        if (typeof loadCitas === 'function') {
            loadCitas();
        }
        
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        
        // Restaurar botón
        const sendBtn = document.getElementById('sendEmailBtn');
        if (sendBtn) {
            sendBtn.innerHTML = originalText || 'Enviar Email';
            sendBtn.disabled = false;
        }
        
        alert('❌ Error al enviar email: ' + error.message);
    }
}

// Función para probar EmailJS localmente
async function testEmailConfiguration() {
    try {
        console.log('🧪 Probando configuración de EmailJS...');
        
        const testData = {
            to_email: 'test@hdsa.gov.co',
            from_name: 'Test Hospital',
            subject: 'Email de Prueba',
            message: 'Este es un email de prueba desde el portal institucional.',
            test_mode: true
        };

        if (EMAILJS_CONFIG.isDevelopment) {
            console.log('📧 Modo desarrollo - Email simulado');
            console.log('📋 Datos de prueba:', testData);
            alert('✅ Configuración de EmailJS en modo desarrollo funcionando correctamente');
        } else {
            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                testData
            );
            console.log('✅ Email de prueba enviado:', response);
            alert('✅ Email de prueba enviado exitosamente');
        }
        
    } catch (error) {
        console.error('❌ Error en configuración EmailJS:', error);
        alert('❌ Error en configuración: ' + error.message);
    }
}

// Agregar botón de prueba en modo desarrollo
document.addEventListener('DOMContentLoaded', function() {
    if (EMAILJS_CONFIG.isDevelopment) {
        // Agregar botón de prueba en el panel de administración
        setTimeout(() => {
            const adminPanel = document.getElementById('citas-admin-panel');
            if (adminPanel) {
                const testButton = document.createElement('button');
                testButton.className = 'btn btn-warning btn-sm mb-3';
                testButton.innerHTML = '<i class="bi bi-envelope-check me-2"></i>Probar Email';
                testButton.onclick = testEmailConfiguration;
                
                const cardHeader = adminPanel.querySelector('.card-header');
                if (cardHeader) {
                    cardHeader.appendChild(testButton);
                }
            }
        }, 2000);
    }
});

// Exportar funciones para uso global
window.sendEmailResponse = sendEmailResponse;
window.testEmailConfiguration = testEmailConfiguration;
