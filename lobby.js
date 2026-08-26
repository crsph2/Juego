// lobby.js
document.addEventListener('DOMContentLoaded', () => {
    // El nombre y XP ya se cargan desde common.js
    // Pero necesitamos actualizar el XP después de cargar el jugador
    const elXp = document.getElementById('player-xp');

    // Escuchar cambios en el jugador (se dispara desde common.js)
    // Como common.js no notifica, usamos un observer o simplemente leemos al cargar
    // Usamos un pequeño intervalo para esperar a que common.js termine
    const checkJugador = setInterval(() => {
        if (typeof jugador !== 'undefined' && jugador !== null) {
            elXp.textContent = jugador.xpTotal || 0;
            clearInterval(checkJugador);
        }
    }, 100);

    // Cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });

    // Botón para ir a Factorizados
    document.getElementById('btn-factorizados').addEventListener('click', () => {
        window.location.href = 'factorizados.html';
    });

    // Botón para ir a Incógnita
    document.getElementById('btn-incognita').addEventListener('click', () => {
        window.location.href = 'incognita.html';
    });
});
