// app.js - Lógica de autenticación con avatar DiceBear
const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
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

// Generar seed aleatorio para avatar
function generarAvatarSeed() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let seed = '';
    for (let i = 0; i < 10; i++) {
        seed += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return seed;
}

// ---- Registro ----
async function registrarUsuario(email, password) {
    try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const avatarSeed = generarAvatarSeed();
        await db.collection('usuarios').doc(uid).set({
            nombre: 'Trotamundos',
            fechaCreacion: new Date(),
            monedas: 0,
            avatarSeed: avatarSeed,
            inventario: ['avatar_base'],
            equipo: {
                avatar: 'avatar_base',
                superior: null,
                inferior: null,
                sombrero: null,
                zapatillas: null,
                insignia: null,
                simbolos: []
            },
            factorizados: {
                nivel: 1,
                xp: 0,
                region: 'Aldea del Factor Común',
                racha: 0
            },
            incognita: {
                nivel: 1,
                xp: 0,
                region: 'Aldea de las Ecuaciones',
                racha: 0
            },
            sistemas: {
                completado: false,
                puntuacion: 0,
                estrellas: 0,
                bombasDesactivadas: 0,
                errores: 0,
                pistasUsadas: 0,
                tiempo: 0
            },
            estadisticas: {
                factorizados_correctas: 0,
                factorizados_incorrectas: 0,
                incognita_correctas: 0,
                incognita_incorrectas: 0
            },
            historial: []
        });
        sessionStorage.setItem('mathquest_uid', uid);
        sessionStorage.setItem('mathquest_nombre', 'Trotamundos');
        window.location.href = 'lobby.html';
    } catch (error) {
        console.error('Error en registro:', error);
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
            showError('No se encontraron datos de este jugador.');
            return;
        }
        const jugador = snap.data();
        sessionStorage.setItem('mathquest_uid', uid);
        sessionStorage.setItem('mathquest_nombre', jugador.nombre || 'Trotamundos');
        window.location.href = 'lobby.html';
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
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
    if (!email || !password) {
        showError('Completa todos los campos.');
        return;
    }
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    registrarUsuario(email, password);
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
