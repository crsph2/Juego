// common.js - Funciones compartidas para todas las páginas (actualizado)
let uid = null;
let jugador = null;

function getUid() {
    return sessionStorage.getItem('mathquest_uid');
}

async function cargarJugador() {
    uid = getUid();
    if (!uid) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const snap = await db.collection('usuarios').doc(uid).get();
        if (!snap.exists) {
            window.location.href = 'index.html';
            return;
        }
        jugador = snap.data();
        if (!jugador.nombre) jugador.nombre = 'Trotamundos';
        actualizarUICompleta();
        configurarEdicionNombre();
    } catch (error) {
        console.error('Error al cargar jugador:', error);
        const elNombre = document.getElementById('player-name');
        if (elNombre) elNombre.textContent = 'Error al cargar';
    }
}

// Actualiza todos los elementos de la UI que puedan existir
function actualizarUICompleta() {
    if (!jugador) return;

    // Nombre
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = jugador.nombre;

    // Nivel
    const elNivel = document.getElementById('player-level');
    if (elNivel) elNivel.textContent = jugador.nivel || 1;

    // Monedas
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = jugador.monedas || 0;

    // XP bar
    const elXpBarra = document.getElementById('xp-bar-fill');
    const elXpTexto = document.getElementById('xp-text');
    if (elXpBarra && elXpTexto) {
        const XP_POR_NIVEL = 100;
        const xpEnNivel = (jugador.xp || 0) % XP_POR_NIVEL;
        elXpBarra.style.width = `${xpEnNivel}%`;
        elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
    }

    // Región
    const elRegion = document.getElementById('player-region');
    if (elRegion) {
        // Si tienes función regionParaNivel, la puedes usar; si no, mostrar región guardada
        elRegion.textContent = jugador.regionActual || 'Aldea del Factor Común';
    }

    // Puntuación (para incógnita)
    const elPuntuacion = document.getElementById('player-score');
    if (elPuntuacion) {
        elPuntuacion.textContent = jugador.juegos?.incognita?.puntuacion || 0;
    }
}

function configurarEdicionNombre() {
    // Buscar tanto el botón del lobby (edit-name-btn) como el de los juegos (btn-edit-name)
    const btnEditar = document.getElementById('edit-name-btn') || document.getElementById('btn-edit-name');
    if (!btnEditar) return;
    
    // Reemplazar cualquier listener anterior clonando el botón (para evitar duplicados)
    const nuevoBtn = btnEditar.cloneNode(true);
    btnEditar.parentNode.replaceChild(nuevoBtn, btnEditar);

    nuevoBtn.addEventListener('click', () => {
        if (!jugador) return;
        const nuevoNombre = prompt('Ingresa tu nuevo nombre de aventurero:', jugador.nombre);
        if (nuevoNombre && nuevoNombre.trim() !== '' && nuevoNombre !== jugador.nombre) {
            const nombreLimpio = nuevoNombre.trim();
            db.collection('usuarios').doc(uid).update({ nombre: nombreLimpio })
                .then(() => {
                    jugador.nombre = nombreLimpio;
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
    // Buscar cualquier elemento con id feedback-message (puede estar en lobby o juegos)
    const feedback = document.getElementById('feedback-message');
    if (feedback) {
        feedback.textContent = mensaje;
        feedback.className = 'feedback';
        if (tipo === 'exito') {
            feedback.classList.add('feedback-exito');
        } else if (tipo === 'error') {
            feedback.classList.add('feedback-error');
        }
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 2500);
    }
}

// Escuchar cambios de autenticación para redirigir si es necesario (opcional)
firebase.auth().onAuthStateChanged((user) => {
    // Si no hay usuario y estamos en una página que requiere login, redirigir
    const paginasPublicas = ['index.html', 'register.html'];
    const path = window.location.pathname.split('/').pop();
    if (!user && !paginasPublicas.includes(path)) {
        window.location.href = 'index.html';
    }
});

// Cargar jugador al iniciar
document.addEventListener('DOMContentLoaded', cargarJugador);
