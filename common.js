// common.js - Funciones compartidas

window.uid = null;
window.jugador = null;

function getUid() {
    return sessionStorage.getItem('mathquest_uid');
}

function getAvatarUrl(seed, style = 'adventurer') {
    // Usamos DiceBear con estilo adventurer, bottts, pixel-art, etc.
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=ffd700&radius=50`;
}

async function cargarJugador() {
    window.uid = getUid();
    if (!window.uid) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const snap = await db.collection('usuarios').doc(window.uid).get();
        if (!snap.exists) {
            window.location.href = 'index.html';
            return;
        }
        window.jugador = snap.data();
        // Inicializar campos si faltan
        if (window.jugador.monedas === undefined) window.jugador.monedas = 0;
        if (!window.jugador.inventario) window.jugador.inventario = ['avatar_base'];
        if (!window.jugador.avatarSeed) {
            // Si no tiene seed, generar uno (migración)
            window.jugador.avatarSeed = generarSeed();
            await db.collection('usuarios').doc(window.uid).update({ avatarSeed: window.jugador.avatarSeed });
        }
        if (!window.jugador.equipo) {
            window.jugador.equipo = { avatar: 'avatar_base', superior: null, inferior: null, sombrero: null, zapatillas: null, insignia: null };
        }
        if (!window.jugador.factorizados) {
            window.jugador.factorizados = { nivel: 1, xp: 0, region: 'Aldea del Factor Común' };
        }
        if (!window.jugador.incognita) {
            window.jugador.incognita = { nivel: 1, xp: 0, region: 'Aldea de las Ecuaciones' };
        }
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

function generarSeed() {
    return Math.random().toString(36).substring(2, 10);
}

function actualizarUICompleta() {
    if (!window.jugador) return;

    // Nombre
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = window.jugador.nombre;

    // Monedas
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = window.jugador.monedas || 0;

    // Factorizados
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
    if (elRegion) {
        elRegion.textContent = fac.region || 'Aldea del Factor Común';
    }

    // Avatar
    actualizarAvatar();
}

function actualizarAvatar() {
    const avatarContainer = document.getElementById('avatar-display');
    if (!avatarContainer) return;
    const seed = window.jugador.avatarSeed || 'default';
    const avatarUrl = getAvatarUrl(seed);
    avatarContainer.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="avatar-img" />`;
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
                .catch(err => {
                    console.error('Error al actualizar nombre:', err);
                    alert('No se pudo actualizar el nombre. Intenta de nuevo.');
                });
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

// Redirigir si no hay usuario
firebase.auth().onAuthStateChanged((user) => {
    const paginasPublicas = ['index.html', 'register.html'];
    const path = window.location.pathname.split('/').pop();
    if (!user && !paginasPublicas.includes(path)) {
        window.location.href = 'index.html';
    }
});

document.addEventListener('DOMContentLoaded', cargarJugador);
