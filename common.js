// common.js - Funciones compartidas para todas las páginas
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
        actualizarNombreUI();
        configurarEdicionNombre();
    } catch (error) {
        console.error('Error al cargar jugador:', error);
        const elNombre = document.getElementById('player-name');
        if (elNombre) elNombre.textContent = 'Error al cargar';
    }
}

function actualizarNombreUI() {
    const elNombre = document.getElementById('player-name');
    if (elNombre && jugador) {
        elNombre.textContent = jugador.nombre;
    }
}

function configurarEdicionNombre() {
    const btnEditar = document.getElementById('edit-name-btn');
    if (!btnEditar) return;
    btnEditar.addEventListener('click', () => {
        if (!jugador) return;
        const nuevoNombre = prompt('Ingresa tu nuevo nombre de aventurero:', jugador.nombre);
        if (nuevoNombre && nuevoNombre.trim() !== '' && nuevoNombre !== jugador.nombre) {
            const nombreLimpio = nuevoNombre.trim();
            db.collection('usuarios').doc(uid).update({ nombre: nombreLimpio })
                .then(() => {
                    jugador.nombre = nombreLimpio;
                    sessionStorage.setItem('mathquest_nombre', nombreLimpio);
                    actualizarNombreUI();
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
        feedback.className = tipo;
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 2000);
    }
}

document.addEventListener('DOMContentLoaded', cargarJugador);
