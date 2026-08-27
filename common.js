// common.js - Fragmentos clave

async function cargarJugador() {
    // ... obtener snap
    window.jugador = snap.data();
    // Inicializar campos globales
    if (window.jugador.monedas === undefined) window.jugador.monedas = 0;
    if (!window.jugador.inventario) window.jugador.inventario = [];
    if (!window.jugador.equipo) {
        window.jugador.equipo = {
            superior: null,
            inferior: null,
            sombrero: null,
            zapatillas: null,
            insignia: null
        };
    }
    // ... resto
}

function actualizarUICompleta() {
    // ... actualizar nombre, nivel, etc.
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = window.jugador.monedas || 0;
    // ... XP, región, etc.
}
