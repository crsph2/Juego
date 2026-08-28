// common.js - Funciones compartidas para todas las páginas

window.uid = null;
window.jugador = null;

function getUid() { return sessionStorage.getItem('mathquest_uid'); }

async function cargarJugador() {
    window.uid = getUid();
    if (!window.uid) { window.location.href = 'index.html'; return; }
    try {
        const snap = await db.collection('usuarios').doc(window.uid).get();
        if (!snap.exists) { window.location.href = 'index.html'; return; }
        window.jugador = snap.data();
        if (window.jugador.monedas === undefined) window.jugador.monedas = 0;
        if (!window.jugador.inventario) window.jugador.inventario = ['avatar_base'];
        if (!window.jugador.equipo) window.jugador.equipo = { avatar: 'avatar_base', superior: null, inferior: null, sombrero: null, zapatillas: null, insignia: null, simbolos: [] };
        if (!window.jugador.equipo.simbolos) window.jugador.equipo.simbolos = [];
        if (!window.jugador.factorizados) window.jugador.factorizados = { nivel: 1, xp: 0, region: 'Aldea del Factor Común', racha: 0 };
        if (!window.jugador.incognita) window.jugador.incognita = { nivel: 1, xp: 0, region: 'Aldea de las Ecuaciones', racha: 0 };
        if (!window.jugador.nombre) window.jugador.nombre = 'Trotamundos';

        actualizarUICompleta();
        configurarEdicionNombre();
        document.dispatchEvent(new CustomEvent('jugador-cargado', { detail: window.jugador }));
    } catch (error) {
        console.error('Error al cargar jugador:', error);
        const elNombre = document.getElementById('player-name');
        if (elNombre) elNombre.textContent = 'Error al cargar';
    }
}

function actualizarUICompleta() {
    if (!window.jugador) return;
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = window.jugador.nombre;
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = window.jugador.monedas || 0;
    const fac = window.jugador.factorizados || { nivel: 1, xp: 0, region: 'Aldea del Factor Común' };
    const elNivel = document.getElementById('player-level');
    if (elNivel) elNivel.textContent = fac.nivel || 1;
    const elXpBarra = document.getElementById('xp-bar-fill');
    const elXpTexto = document.getElementById('xp-text');
    if (elXpBarra && elXpTexto) {
        const XP_POR_NIVEL = 100;
        const xpEnNivel = (fac.xp || 0) % XP_POR_NIVEL;
        elXpBarra.style.width = `${xpEnNivel}%`;
        elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
    }
    const elRegion = document.getElementById('player-region');
    if (elRegion) elRegion.textContent = fac.region || 'Aldea del Factor Común';
    actualizarAvatar();
}

// Símbolos Matemáticos SVG (Rigurosos)
const SIMBOLOS_SVG = {
    'pi': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 L4 8 A4 4 0 0 1 8 4 L20 4"/><path d="M8 12 L16 12"/></svg>',
    'integral': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4c-3 0-3 4-3 8s0 8 3 8"/><path d="M17 4c3 0 3 4 3 8s0 8-3 8"/></svg>',
    'raiz': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2l2 7 3-14 3 7h8"/></svg>',
    'sigma': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6l6 8-6 8h12"/></svg>',
    'infinito': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>',
    'delta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4L3 20h18L12 4z"/></svg>',
    'theta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 6v12M15 6v12"/></svg>',
    'suma_frac': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4L10 20"/><path d="M12 8h4M8 16h4"/></svg>'
};

// Estilos de avatares
const AVATAR_ESTILOS = {
    'avatar_base': { style: 'adventurer', label: 'Clásico' },
    'avatar_robot': { style: 'bottts', label: 'Robot' },
    'avatar_personas': { style: 'personas', label: 'Caricatura' },
    'avatar_notionists': { style: 'notionists', label: 'Minimalista' }
};

function actualizarAvatar() {
    const avatarContainer = document.getElementById('avatar-display');
    if (!avatarContainer) return;

    const equipo = window.jugador.equipo || {};
    const nombre = window.jugador.nombre || 'Aventurero';
    const avatarId = equipo.avatar || 'avatar_base';

    let estilo = AVATAR_ESTILOS['avatar_base'];
    if (avatarId.includes('robot')) estilo = AVATAR_ESTILOS['avatar_robot'];
    else if (avatarId.includes('personas')) estilo = AVATAR_ESTILOS['avatar_personas'];
    else if (avatarId.includes('notionists')) estilo = AVATAR_ESTILOS['avatar_notionists'];

    let url = `https://api.dicebear.com/10.x/${estilo.style}/svg?seed=${avatarId}`;
    if (estilo.style === 'adventurer' || estilo.style === 'personas') {
        url += '&skinColor=f1c27d&hairColor=2c1b18&hair=short';
    }

    let simbolosHTML = '';
    (equipo.simbolos || []).forEach(simbolo => {
        const item = SIMBOLOS_SVG[simbolo.id];
        if (item) {
            simbolosHTML += `<div class="avatar-simbolo">${item}</div>`;
        }
    });

    avatarContainer.innerHTML = `
        <div class="avatar-dicebear">
            <img src="${url}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; margin-top:-25px;">
        </div>
        <div class="avatar-simbolos-fila">
            ${simbolosHTML}
        </div>
        <div class="avatar-nombre">${nombre}</div>
    `;
}

function configurarEdicionNombre() {
    const btnEditar = document.getElementById('edit-name-btn') || document.getElementById('btn-edit-name');
    if (!btnEditar) return;
    const nuevoBtn = btnEditar.cloneNode(true);
    btnEditar.parentNode.replaceChild(nuevoBtn, btnEditar);
    nuevoBtn.addEventListener('click', () => {
        if (!window.jugador) return;
        const nuevoNombre = prompt('Ingresa tu nuevo nombre de aventurero:', window.jugador.nombre);
        if (nuevoNombre && nuevoNombre.trim() !== '' && nuevoNombre !== window.jugador.nombre) {
            const nombreLimpio = nuevoNombre.trim();
            db.collection('usuarios').doc(window.uid).update({ nombre: nombreLimpio })
                .then(() => {
                    window.jugador.nombre = nombreLimpio;
                    sessionStorage.setItem('mathquest_nombre', nombreLimpio);
                    actualizarUICompleta();
                    mostrarFeedback('¡Nombre actualizado!', 'exito');
                })
                .catch(err => { console.error('Error al actualizar nombre:', err); alert('No se pudo actualizar el nombre. Intenta de nuevo.'); });
        }
    });
}

function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById('feedback-message');
    if (feedback) {
        feedback.textContent = mensaje;
        feedback.className = 'feedback';
        if (tipo === 'exito') feedback.classList.add('feedback-exito');
        else if (tipo === 'error') feedback.classList.add('feedback-error');
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 3000);
    }
}

firebase.auth().onAuthStateChanged((user) => {
    const paginasPublicas = ['index.html', 'register.html'];
    const path = window.location.pathname.split('/').pop();
    if (!user && !paginasPublicas.includes(path)) {
        window.location.href = 'index.html';
    }
});

// MODO OSCURO
function aplicarTema(tema) {
    if (tema === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = '🌙';
    }
    localStorage.setItem('mathquest_theme', tema);
}

const temaGuardado = localStorage.getItem('mathquest_theme') || 'light';
aplicarTema(temaGuardado);

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const nuevoTema = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            aplicarTema(nuevoTema);
        });
    }
    cargarJugador();
});
