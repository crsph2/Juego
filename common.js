// common.js - Funciones compartidas para todas las páginas

window.uid = null;
window.jugador = null;

function getUid() {
    return sessionStorage.getItem('mathquest_uid');
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
        // Inicializar campos
        if (window.jugador.monedas === undefined) window.jugador.monedas = 0;
        if (!window.jugador.inventario) window.jugador.inventario = ['avatar_base'];
        if (!window.jugador.equipo) {
            window.jugador.equipo = {
                avatar: 'avatar_base',
                superior: null,
                inferior: null,
                sombrero: null,
                zapatillas: null,
                insignia: null
            };
        } else if (!window.jugador.equipo.avatar) {
            window.jugador.equipo.avatar = 'avatar_base';
        }
        if (!window.jugador.factorizados) {
            window.jugador.factorizados = { nivel: 1, xp: 0, region: 'Aldea del Factor Común', racha: 0 };
        }
        if (!window.jugador.incognita) {
            window.jugador.incognita = { nivel: 1, xp: 0, region: 'Aldea de las Ecuaciones', racha: 0 };
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

function actualizarUICompleta() {
    if (!window.jugador) return;

    // Nombre
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = window.jugador.nombre;

    // Monedas
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = window.jugador.monedas || 0;

    // Factorizados: nivel, XP, región
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

    // Actualizar avatar
    actualizarAvatar();
}

function actualizarAvatar() {
    const avatarContainer = document.getElementById('avatar-display');
    if (!avatarContainer) return;

    const equipo = window.jugador.equipo || {};
    const nombre = window.jugador.nombre || 'Aventurero';

    // Función para obtener emoji de un item por ID
    function getEmoji(id, defaultEmoji) {
        if (!id) return defaultEmoji;
        if (window.obtenerItemPorIdGlobal) {
            const item = window.obtenerItemPorIdGlobal(id);
            if (item) return item.emoji;
        }
        return defaultEmoji;
    }

    const sombreroEmoji = getEmoji(equipo.sombrero, ' ');
    const superiorEmoji = getEmoji(equipo.superior, ' ');
    const inferiorEmoji = getEmoji(equipo.inferior, ' ');
    const zapatillasEmoji = getEmoji(equipo.zapatillas, ' ');
    const insigniaEmoji = getEmoji(equipo.insignia, ' ');

    // Generar URL de DiceBear con el nombre como seed y parámetros de personalización (pelo, color, etc.)
    // Podemos añadir más parámetros según las compras (por ahora solo seed)
    const seed = encodeURIComponent(nombre);
    const dicebearUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`;

    // Construir HTML del avatar
    avatarContainer.innerHTML = `
        <div class="avatar-dicebear">
            <img src="${dicebearUrl}" alt="Avatar" style="width:100%; height:100%; border-radius:50%;">
        </div>
        ${sombreroEmoji ? `<div class="avatar-accesorio avatar-sombrero">${sombreroEmoji}</div>` : ''}
        ${superiorEmoji ? `<div class="avatar-accesorio avatar-superior">${superiorEmoji}</div>` : ''}
        ${inferiorEmoji ? `<div class="avatar-accesorio avatar-inferior">${inferiorEmoji}</div>` : ''}
        ${zapatillasEmoji ? `<div class="avatar-accesorio avatar-zapatillas">${zapatillasEmoji}</div>` : ''}
        ${insigniaEmoji ? `<div class="avatar-accesorio avatar-insignia">${insigniaEmoji}</div>` : ''}
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
