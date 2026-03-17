/**
 * Lógica para el sistema de Citas Médicas Online - VERSIÓN CORREGIDA
 * Maneja el wizard de pasos, validaciones, calendario y simulación de envío.
 */

// Variables globales de estado
let pasoActual = 1;
let datosCita = {
    paciente: {},
    especialidad: null,
    fecha: null,
    hora: null,
    motivoConsulta: '',
    tieneWhatsapp: '',
    ordenesMedicas: null
};
let fechaMostrada = new Date(); // Estado para el mes/año que muestra el calendario

// Sistema de inicialización robusto
class FormInitializer {
    constructor() {
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 50;
        this.retryInterval = 100;
    }

    async init() {
        console.log('🚀 Iniciando sistema de inicialización robusto...');
        
        // Esperar a que el DOM esté completamente listo
        await this.waitForDOM();
        
        // Inicializar componentes
        this.initializeComponents();
        
        // Configurar navegación
        this.setupNavigation();
        
        // Configurar eventos
        this.setupEventListeners();
        
        console.log('✅ Sistema inicializado correctamente');
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            const checkReady = () => {
                const requiredElements = [
                    '.form-slider',
                    '.form-content', 
                    '#paso1',
                    'button[data-action]',
                    '.step-wizard'
                ];
                
                const allReady = requiredElements.every(selector => {
                    const elements = document.querySelectorAll(selector);
                    return elements.length > 0;
                });
                
                if (allReady) {
                    console.log('✅ Todos los elementos requeridos están en el DOM');
                    resolve();
                } else {
                    this.retryCount++;
                    console.log(`⏳ Esperando elementos... intento ${this.retryCount}/${this.maxRetries}`);
                    
                    if (this.retryCount < this.maxRetries) {
                        setTimeout(checkReady, this.retryInterval);
                    } else {
                        console.error('❌ Timeout esperando elementos del DOM');
                        resolve(); // Continuar de todos modos
                    }
                }
            };
            
            checkReady();
        });
    }

    initializeComponents() {
        console.log('🔧 Inicializando componentes...');
        
        // Inicializar calendario
        if (typeof generarCalendario === 'function') {
            generarCalendario(fechaMostrada.getFullYear(), fechaMostrada.getMonth());
        }
        
        // Inicializar especialidades
        if (typeof cargarEspecialidades === 'function') {
            cargarEspecialidades();
        }
        
        // Ajustar vista inicial
        setTimeout(() => {
            if (typeof setStepView === 'function') {
                setStepView(pasoActual);
            }
        }, 300);
    }

    setupNavigation() {
        console.log('🧭 Configurando navegación...');
        
        const buttons = document.querySelectorAll('button[data-action]');
        console.log(`📋 Encontrados ${buttons.length} botones de navegación`);
        
        buttons.forEach((button, index) => {
            const action = button.dataset.action;
            const step = parseInt(button.dataset.step, 10);
            
            console.log(`🔘 Configurando botón ${index + 1}: ${action} (paso ${step})`);
            
            // Eliminar eventos anteriores
            button.removeEventListener('click', button._clickHandler);
            
            // Crear nuevo handler con debugging
            button._clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`🎯 Click detectado: ${action} en paso ${step}`);
                
                // Ejecutar acción
                if (action === 'next') {
                    if (typeof siguientePaso === 'function') {
                        siguientePaso(step);
                    }
                } else if (action === 'prev') {
                    if (typeof anteriorPaso === 'function') {
                        anteriorPaso(step);
                    }
                }
            };
            
            // Agregar evento con múltiples opciones para compatibilidad
            button.addEventListener('click', button._clickHandler, { capture: true });
            button.onclick = button._clickHandler;
        });
    }

    setupEventListeners() {
        console.log('👂 Configurando event listeners...');
        
        // Eventos de paso
        const stepIndicators = document.querySelectorAll('.step-item');
        stepIndicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const targetStep = parseInt(indicator.id.replace('step', ''), 10);
                if (targetStep < pasoActual && indicator.classList.contains('completed')) {
                    if (typeof jumpToStep === 'function') {
                        jumpToStep(targetStep);
                    }
                }
            });
        });

        // Eventos de especialidad
        const especialidadesContainer = document.getElementById('especialidadesContainer');
        if (especialidadesContainer) {
            especialidadesContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.specialty-card');
                if (card && typeof seleccionarEspecialidad === 'function') {
                    seleccionarEspecialidad(card.dataset.id, card.dataset.nombre, card);
                }
            });
        }

        // Eventos de calendario
        const calendarHeader = document.querySelector('.calendar-header');
        if (calendarHeader) {
            calendarHeader.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;
                if (button.id === 'prevMonthBtn' && typeof mesAnterior === 'function') {
                    mesAnterior();
                }
                if (button.id === 'nextMonthBtn' && typeof siguienteMes === 'function') {
                    siguienteMes();
                }
            });
        }

        // Resize events
        window.addEventListener('resize', () => {
            if (typeof setStepView === 'function') {
                setStepView(pasoActual);
            }
        });
    }
}

// Sistema de inicialización principal
const formInitializer = new FormInitializer();

// Múltiples puntos de entrada para asegurar inicialización
function initializeWhenReady() {
    if (!window.formInitialized) {
        window.formInitialized = true;
        formInitializer.init().catch(error => {
            console.error('❌ Error en inicialización:', error);
        });
    }
}

// 1. DOM Content Loaded (para módulos ES6)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
    initializeWhenReady();
}

// 2. Window Load (fallback)
window.addEventListener('load', () => {
    console.log('🔄 Window load - verificación de inicialización');
    setTimeout(initializeWhenReady, 100);
});

// 3. Timeout final (último recurso)
setTimeout(() => {
    if (!window.formInitialized) {
        console.log('⏰ Timeout final - forzando inicialización');
        initializeWhenReady();
    }
}, 2000);

// Exportar funciones para compatibilidad
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormInitializer };
}

// Hacer disponible globalmente para depuración
window.FormInitializer = FormInitializer;
window.formInitializer = formInitializer;
