// js/portal-sesion.js — Sesión y permisos compartidos por las páginas del Portal Institucional.
//
// Permisos: colección "usuariosPortal" de Firestore, documento = correo del usuario
//   { nombre: "…", modulos: ["citas", "calidad", "soporte", …], inicio: "citas" }
// Módulos: "admin" (todo), "citas", "calidad", "soporte" (técnicos de Sistemas), "guia-chat".
// Sin documento se usan PERFILES_POR_DEFECTO. Las reglas de Firebase y los Apps Script
// deben coincidir con estos permisos (ver firebase/ y apps-script/).

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

export const PERFILES_POR_DEFECTO = {
    'coord.sistemas@hdsa.gov.co': { nombre: 'Administrador', modulos: ['admin'] },
    'citas@hdsa.gov.co': { nombre: 'Gestora de Citas', modulos: ['citas'], inicio: 'citas' },
    'chat@hdsa.gov.co': { nombre: 'Personal', modulos: ['guia-chat'] }
};
export const URL_GUIA_CHAT = '/documentos/Portal-institucional/guia-chat-hdsa/index.html';
export const URL_LOGIN = '/login-institucional.html';

export async function obtenerPerfil(email) {
    try {
        const snap = await getDoc(doc(db, 'usuariosPortal', email));
        if (snap.exists()) {
            const datos = snap.data();
            return { nombre: datos.nombre || '', modulos: Array.isArray(datos.modulos) ? datos.modulos : [], inicio: datos.inicio || '' };
        }
    } catch (error) {
        console.warn('No se pudo leer el perfil del usuario; se usan los permisos por defecto.', error);
    }
    return PERFILES_POR_DEFECTO[email] || { nombre: '', modulos: [] };
}

export function soloGuiaChat(perfil) {
    return perfil.modulos.length === 1 && perfil.modulos[0] === 'guia-chat';
}

/**
 * Exige sesión del portal. Sin sesión va al login; el usuario solo de la guía va a la guía.
 * Devuelve { user, email, perfil, tiene(modulo) }.
 */
export function exigirSesion() {
    return new Promise(resolve => {
        const cancelar = onAuthStateChanged(auth, async (user) => {
            cancelar();
            if (!user) { window.location.replace(URL_LOGIN); return; }
            const email = (user.email || '').toLowerCase();
            const perfil = await obtenerPerfil(email);
            if (soloGuiaChat(perfil)) { window.location.replace(URL_GUIA_CHAT); return; }
            const tiene = (modulo) => perfil.modulos.includes('admin') || perfil.modulos.includes(modulo);
            resolve({ user, email, perfil, tiene });
        });
    });
}

export function cerrarSesion() {
    return signOut(auth).then(() => window.location.replace(URL_LOGIN));
}

/** Escapa texto para insertarlo en HTML. */
export function esc(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
