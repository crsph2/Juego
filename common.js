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

// Símbolos Matemáticos Unicode (rigurosos)
const SIMBOLOS_MATH = {
    'pi': 'π',
    'integral': '∫',
    'raiz': '√',
    'sigma': 'Σ',
    'infinito': '∞',
    'delta': 'Δ',
    'theta': 'θ',
    'suma_frac': '½'
};

// Estilos de avatares
const AVATAR_ESTILOS = {
    'avatar_base': { style: 'adventurer', label: 'Clásico' },
    'avatar_robot': { style: 'bottts', label: 'Robot' },
    'avatar_personas': { style: 'personas', label: 'Caricatura' },
    'avatar_notionists': { style: 'notionists', label: 'Minimalista' }
};

// Renderiza el avatar con símbolos equidistantes dentro del círculo
function renderizarAvatar(container, jugador) {
    if (!container || !jugador) return;
    const equipo = jugador.equipo || {};
    const nombre = jugador.nombre || 'Aventurero';
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
    const simbolos = equipo.simbolos || [];
    const numSimbolos = simbolos.length;

    simbolos.forEach((simbolo, index) => {
        const char = SIMBOLOS_MATH[simbolo.id];
        if (!char) return;

        const angulo = (2 * Math.PI * index) / numSimbolos - (Math.PI / 2);
        const x = 80 + 70 * Math.cos(angulo);
        const y = 80 + 70 * Math.sin(angulo);
        
        const styleAttr = `left:${x}px; top:${y}px; transform:translate(-50%, -50%);`;
        
        simbolosHTML += `<span class="avatar-simbolo-abs" style="${styleAttr}">${char}</span>`;
    });

    container.innerHTML = `
        <div class="avatar-circulo">
            <img src="${url}" alt="Avatar" class="avatar-img">
            ${simbolosHTML}
        </div>
        <div class="avatar-nombre">${nombre}</div>
    `;
}

function actualizarAvatar() {
    const avatarContainer = document.getElementById('avatar-display');
    if (!avatarContainer) return;
    renderizarAvatar(avatarContainer, window.jugador);
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
