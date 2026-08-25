// lobby.js - Vestíbulo principal

// Ya no necesitamos la autenticación aquí, la maneja common.js
// Solo usamos los datos de jugador que ya cargó common.js

// Referencias a elementos del DOM
const elNombre = document.getElementById('player-name');
const elNivel = document.getElementById('player-level');
const elMonedas = document.getElementById('player-coins');
const elRegion = document.getElementById('player-region');
// ... otros elementos del lobby

// Función para actualizar la UI del lobby (nivel, monedas, etc.)
function actualizarLobby() {
  if (jugador) {
    elNivel.textContent = jugador.nivel || 1;
    elMonedas.textContent = jugador.monedas || 0;
    elRegion.textContent = jugador.regionActual || 'Aldea del Factor Común';
    // También podrías actualizar la barra de XP si existe
  }
}

// Escuchar cambios en tiempo real (opcional)
// Por ejemplo, si se actualizan monedas desde otro lugar
// Pero aquí simplemente refrescamos al cargar

// Al cargar, después de que common.js cargue el jugador, actualizamos
document.addEventListener('DOMContentLoaded', () => {
  // common.js ya cargó jugador y actualizó el nombre
  // Ahora actualizamos el resto del lobby
  actualizarLobby();

  // También podrías agregar eventos para los botones de los juegos
  document.getElementById('btn-factorizacion').addEventListener('click', () => {
    window.location.href = 'factorizados.html';
  });
  // ... otros botones
});

// Si quieres que el lobby se actualice cuando el jugador cambie (por ejemplo, después de jugar)
// Puedes exponer una función global o usar un evento personalizado.
// Pero como cada juego redirige de vuelta al lobby, al recargar la página se actualizará.
