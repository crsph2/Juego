// app.js - Sin campo de nickname, siempre "Trotamundos"

// Configuración de Firebase (ya deberías tenerla en firebase-config.js)
// Asumimos que firebase y db ya están inicializados

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Elementos del login
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');

// Elementos del registro (sin nickname)
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');

// Mensajes de error
const errorMsg = document.getElementById('error-message');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

function hideError() {
  errorMsg.style.display = 'none';
}

// --- Mostrar formularios ---
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  hideError();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
  hideError();
});

// --- Registro (sin nickname) ---
async function registrarUsuario(email, password) {
  try {
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    // Guardar en Firestore con nombre por defecto "Trotamundos"
    await db.collection("usuarios").doc(uid).set({
      nombre: "Trotamundos",
      nivel: 1,
      xp: 0,
      monedas: 0,
      regionActual: "Aldea del Factor Común",
      estadisticas: { correctas: 0, incorrectas: 0 },
      historial: [],
      fechaCreacion: new Date()
    });

    // Guardar en sessionStorage para uso en otras páginas
    sessionStorage.setItem('mathquest_uid', uid);
    sessionStorage.setItem('mathquest_nombre', "Trotamundos");

    window.location.href = 'lobby.html';
  } catch (error) {
    showError(error.message);
  }
}

registerBtn.addEventListener('click', () => {
  hideError();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

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

// --- Login ---
loginBtn.addEventListener('click', async () => {
  hideError();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showError('Completa todos los campos.');
    return;
  }

  try {
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) {
      showError('Usuario no encontrado en la base de datos.');
      return;
    }
    const data = snap.data();
    sessionStorage.setItem('mathquest_uid', uid);
    sessionStorage.setItem('mathquest_nombre', data.nombre || "Trotamundos");
    window.location.href = 'lobby.html';
  } catch (error) {
    showError(error.message);
  }
});

// --- También permitir login con Enter ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (loginForm.style.display !== 'none') {
      loginBtn.click();
    } else if (registerForm.style.display !== 'none') {
      registerBtn.click();
    }
  }
});
