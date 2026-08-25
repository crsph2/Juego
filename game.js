// ---------- Acciones del jugador ----------
async function cerrarSesion() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión? Perderás el progreso no guardado.")) {
        try {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Hubo un error al cerrar sesión. Inténtalo de nuevo.");
        }
    }
}

async function editarNombre() {
    if (!jugador) return;
    const nuevoNombre = prompt("Introduce tu nuevo nombre de aventurero:", jugador.nombre);
    if (nuevoNombre && nuevoNombre.trim().length >= 3) {
        const nombreFinal = nuevoNombre.trim();
        try {
            await db.collection('usuarios').doc(uid).update({
                nombre: nombreFinal
            });
            jugador.nombre = nombreFinal;
            elNombre.textContent = nombreFinal;
            sessionStorage.setItem('mathquest_nombre', nombreFinal);
            alert("¡Nombre actualizado correctamente!");
        } catch (error) {
            console.error("Error al actualizar nombre:", error);
            alert("No se pudo actualizar el nombre. Revisa tu conexión.");
        }
    } else if (nuevoNombre !== null) {
        alert("El nombre debe tener al menos 3 caracteres.");
    }
}

// Asignar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    const btnEditName = document.getElementById('btn-edit-name');
    if (btnLogout) btnLogout.addEventListener('click', cerrarSesion);
    if (btnEditName) btnEditName.addEventListener('click', editarNombre);
});
