let uid = null;
let jugador = null;

const elNombre = document.getElementById('player-name');
const elXp = document.getElementById('player-xp');

// Cargar datos del usuario
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    uid = user.uid;

    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) {
        window.location.href = 'index.html';
        return;
    }

    jugador = snap.data();
    elNombre.textContent = jugador.nombre;
    elXp.textContent = jugador.xpTotal || 0;
});

// Cerrar sesión
document.getElementById('btn-logout').addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        await firebase.auth().signOut();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
});
