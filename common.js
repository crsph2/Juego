// common.js - Funciones compartidas para todas las páginas del juego
// Se debe cargar en lobby.html, factorizados.html, etc.

let uid = null;
let jugador = null;

// Obtener el UID desde sessionStorage
function getUid() {
  return sessionStorage.getItem('mathquest_uid');
}

// Cargar datos del jugador desde Firestore
async function cargarJugador() {
  uid = getUid();
  if (!uid) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) {
      // Si no existe, redirigir al login (por si acaso)
      window.location.href = 'index.html';
      return;
    }
    jugador = snap.data();
    // Asegurar que el nombre esté definido
    if (!jugador.nombre) jugador.nombre = 'Trotamundos';
    actualizarNombreUI();
    configurarEdicionNombre();
  } catch (error) {
    console.error('Error al cargar jugador:', error);
    // Mostrar mensaje de error en el elemento de nombre si existe
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = 'Error al cargar';
  }
}

// Actualizar el nombre en la UI (se llama después de editar o al cargar)
function actualizarNombreUI() {
  const elNombre = document.getElementById('player-name');
  if (elNombre && jugador) {
    elNombre.textContent = jugador.nombre;
  }
}

// Configurar el botón de edición de nombre (✏️)
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

// Función opcional para mostrar feedback (puedes personalizarla)
function mostrarFeedback(mensaje, tipo) {
  const feedback = document.getElementById('feedback-message');
  if (feedback) {
    feedback.textContent = mensaje;
    feedback.className = tipo;
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 2000);
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarJugador);
