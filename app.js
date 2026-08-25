const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nicknameInput = document.getElementById('nickname');
const errorDiv = document.getElementById('error-message');

const btnRegister = document.getElementById('btn-register');
const btnLogin = document.getElementById('btn-login');

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// ---- Registro ----
async function registrarUsuario(email, password, nickname) {
    try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        await db.collection("usuarios").doc(uid).set({
            nombre: nickname,
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
        sessionStorage.setItem('mathquest_nombre', nickname);
        window.location.href = 'juego.html';
    } catch (error) {
        console.error("Error en registro:", error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'Este correo ya está registrado. Por favor, inicia sesión.';
        } else if (error.code === 'auth/weak-password') {
            msg = 'La contraseña debe tener al menos 6 caracteres.';
        }
        showError(msg);
    }
}

// ---- Inicio de sesión ----
async function iniciarSesion(email, password) {
    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        const snap = await db.collection('usuarios').doc(uid).get();
        if (!snap.exists) {
            showError('No se encontraron datos de este jugador. Contacta al soporte.');
            return;
        }

        const jugador = snap.data();
        const nickname = jugador.nombre;

        const continuar = confirm(
            `¡Bienvenido de vuelta, ${nickname}!\n` +
            `¿Quieres continuar tu partida desde donde la dejaste?\n` +
            `(Nivel ${jugador.nivel} - ${jugador.xp} XP)\n\n` +
            `- Aceptar: seguir jugando\n` +
            `- Cancelar: empezar de nuevo (se perderá todo el progreso)`
        );

        if (continuar) {
            sessionStorage.setItem('mathquest_uid', uid);
            sessionStorage.setItem('mathquest_nombre', nickname);
            window.location.href = 'juego.html';
        } else {
            // Reiniciar progreso
            await db.collection('usuarios').doc(uid).update({
                xp: 0,
                monedas: 0,
                nivel: 1,
                regionActual: "Bosque de la Suma",
                logros: [],
                historial: [],
                estadisticas: {},
                progresoRegiones: {},
                dificultadActual: "facil",
                fechaCreacion: new Date()
            });

            sessionStorage.setItem('mathquest_uid', uid);
            sessionStorage.setItem('mathquest_nombre', nickname);
            window.location.href = 'juego.html';
        }
    } catch (error) {
        console.error("Error en inicio de sesión:", error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found') {
            msg = 'No existe una cuenta con ese correo. Regístrate primero.';
        } else if (error.code === 'auth/wrong-password') {
            msg = 'Contraseña incorrecta. Inténtalo de nuevo.';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'El formato del correo no es válido.';
        }
        showError(msg);
    }
}

// ---- Event listeners ----
btnRegister.addEventListener('click', () => {
    hideError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nickname = nicknameInput.value.trim();

    if (!email || !password || !nickname) {
        showError('Completa todos los campos: email, contraseña y nombre de aventurero.');
        return;
    }
    if (nickname.length < 3) {
        showError('El nombre debe tener al menos 3 caracteres.');
        return;
    }
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    registrarUsuario(email, password, nickname);
});

btnLogin.addEventListener('click', () => {
    hideError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Ingresa tu correo y contraseña.');
        return;
    }

    iniciarSesion(email, password);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    btnLogin.click();
});
