const form = document.getElementById('player-form');
const input = document.getElementById('adventurer-name');
const errorDiv = document.getElementById('error-message');

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

async function iniciarJuego(playerName) {
    try {
        // 1. Autenticamos al jugador de forma anónima.
        // Sin esto, request.auth es null y las reglas (isAuthenticated())
        // rechazan cualquier escritura.
        const credenciales = await firebase.auth().signInAnonymously();
        const uid = credenciales.user.uid;

        // 2. Escribimos en "usuarios/{uid}", que es la colección
        // que tus reglas realmente protegen. La regla de "create" exige
        // request.auth.uid == userId, por eso usamos .doc(uid).set()
        // en vez de .add() con un ID aleatorio.
        await db.collection("usuarios").doc(uid).set({
            nombre: playerName,
            fechaCreacion: new Date(),
            xp: 0,
            monedas: 0,
            nivel: 1,
            regionActual: "Bosque de la Suma",
            logros: [],
            historial: [],
            estadisticas: {},
            progresoRegiones: {},
            dificultadActual: "facil"
        });

        sessionStorage.setItem('mathquest_uid', uid);
        sessionStorage.setItem('mathquest_nombre', playerName);

        window.location.href = 'juego.html';

    } catch (error) {
        console.error("Error completo de Firebase:", error);
        showError("Revisa las reglas de Firestore o tu conexión.");
    }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const playerName = input.value.trim();
  if (playerName.length < 3) {
    showError("Tu nombre debe tener al menos 3 caracteres, héroe.");
    return;
  }
  errorDiv.classList.add('hidden');
  iniciarJuego(playerName);
});
