// ==================== VARIABLES GLOBALES ====================
let puntaje = 0;
let nivel = 1;
let preguntaActual = {};
let opcionesActuales = [];
let respuestaCorrecta = "";
let usuario = null;

// ==================== FUNCIONES DE GENERACIÓN ====================

function generarPregunta() {
    const tipo = Math.floor(Math.random() * 4);
    let pregunta = "";
    let correcta = "";

    switch (tipo) {
        case 0: {
            const b = Math.floor(Math.random() * 9) + 2;
            pregunta = `x² - ${b * b}`;
            correcta = `(x-${b})(x+${b})`;
            break;
        }
        case 1: {
            const c = Math.floor(Math.random() * 9) + 2;
            const signo = Math.random() < 0.5 ? '+' : '-';
            pregunta = `x² ${signo === '+' ? '+' : '-'} ${2 * c}x + ${c * c}`;
            correcta = `(x${signo}${c})²`;
            break;
        }
        case 2: {
            const p = Math.floor(Math.random() * 9) + 2;
            const q = Math.floor(Math.random() * 9) + 2;
            const suma = p + q;
            const producto = p * q;
            const signoSuma = Math.random() < 0.5 ? '+' : '-';
            const signoProd = Math.random() < 0.5 ? '+' : '-';
            let b2 = (signoSuma === '+' ? suma : -suma);
            let c2 = (signoProd === '+' ? producto : -producto);
            pregunta = `x² ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}x ${c2 >= 0 ? '+' : '-'} ${Math.abs(c2)}`;
            const raiz1 = (signoSuma === '+' ? p : -p);
            const raiz2 = (signoProd === '+' ? q : -q);
            correcta = `(x${raiz1 >= 0 ? '+' : ''}${raiz1})(x${raiz2 >= 0 ? '+' : ''}${raiz2})`;
            break;
        }
        case 3: {
            const b5 = Math.floor(Math.random() * 9) + 2;
            const signoCubo = Math.random() < 0.5 ? '+' : '-';
            if (signoCubo === '+') {
                pregunta = `x³ + ${b5 * b5 * b5}`;
                correcta = `(x+${b5})(x²-${b5}x+${b5 * b5})`;
            } else {
                pregunta = `x³ - ${b5 * b5 * b5}`;
                correcta = `(x-${b5})(x²+${b5}x+${b5 * b5})`;
            }
            break;
        }
    }

    respuestaCorrecta = correcta;
    const opciones = generarOpcionesFactorizacion(correcta, tipo);
    opcionesActuales = opciones;
    preguntaActual = { pregunta, correcta, opciones };

    const preguntaElement = document.getElementById("pregunta");
    if (preguntaElement) preguntaElement.textContent = `Factoriza: ${pregunta}`;
    mostrarOpciones(opciones);
}

function generarOpcionesFactorizacion(correcta, tipo) {
    let incorrectas = [];

    switch (tipo) {
        case 0: {
            const matchDC = correcta.match(/\(x([+-])(\d+)\)\(x([+-])(\d+)\)/);
            if (matchDC) {
                const b = parseInt(matchDC[2]);
                let nuevoB;
                do {
                    nuevoB = Math.floor(Math.random() * 9) + 2;
                } while (nuevoB === b);
                incorrectas.push(`(x-${nuevoB})(x+${nuevoB})`);
                incorrectas.push(`(x+${b})(x-${b})`);
                let otroB;
                do {
                    otroB = Math.floor(Math.random() * 9) + 2;
                } while (otroB === b || otroB === nuevoB);
                incorrectas.push(`(x-${otroB})(x+${otroB})`);
            }
            break;
        }
        case 1: {
            const matchTCP = correcta.match(/\(x([+-])(\d+)\)²/);
            if (matchTCP) {
                const b = parseInt(matchTCP[2]);
                const signo = matchTCP[1];
                let nuevoB;
                do {
                    nuevoB = Math.floor(Math.random() * 9) + 2;
                } while (nuevoB === b);
                incorrectas.push(`(x${signo}${nuevoB})²`);
                const otroSigno = signo === '+' ? '-' : '+';
                incorrectas.push(`(x${otroSigno}${b})²`);
                incorrectas.push(`(x${otroSigno}${nuevoB})²`);
            }
            break;
        }
        case 2: {
            const matchTri = correcta.match(/\(x([+-])(\d+)\)\(x([+-])(\d+)\)/);
            if (matchTri) {
                const r1 = parseInt(matchTri[2]);
                const r2 = parseInt(matchTri[4]);
                const s1 = matchTri[1];
                const s2 = matchTri[3];
                let nr1;
                do {
                    nr1 = Math.floor(Math.random() * 9) + 2;
                } while (nr1 === r1);
                incorrectas.push(`(x${s1}${nr1})(x${s2}${r2})`);
                let nr2;
                do {
                    nr2 = Math.floor(Math.random() * 9) + 2;
                } while (nr2 === r2);
                incorrectas.push(`(x${s1}${r1})(x${s2}${nr2})`);
                const ns1 = s1 === '+' ? '-' : '+';
                const ns2 = s2 === '+' ? '-' : '+';
                incorrectas.push(`(x${ns1}${r1})(x${ns2}${r2})`);
            }
            break;
        }
        case 3: {
            const matchCubo = correcta.match(/\(x([+-])(\d+)\)\(x²([+-])(\d+)x\+(\d+)\)/);
            if (matchCubo) {
                const b = parseInt(matchCubo[2]);
                const signoPrimero = matchCubo[1];
                const signoMedio = matchCubo[3];
                const constante = parseInt(matchCubo[5]);

                let nb;
                do {
                    nb = Math.floor(Math.random() * 9) + 2;
                } while (nb === b);
                const nuevoSignoMedio = signoPrimero === '+' ? '-' : '+';
                incorrectas.push(`(x${signoPrimero}${nb})(x²${nuevoSignoMedio}${nb}x+${nb * nb})`);

                const otroSigno = signoPrimero === '+' ? '-' : '+';
                const otroMedio = otroSigno === '+' ? '-' : '+';
                incorrectas.push(`(x${otroSigno}${b})(x²${otroMedio}${b}x+${b * b})`);

                let nuevaConstante;
                do {
                    nuevaConstante = Math.floor(Math.random() * 9) + 2;
                } while (nuevaConstante === constante || nuevaConstante === b * b);
                incorrectas.push(`(x${signoPrimero}${b})(x²${signoMedio}${b}x+${nuevaConstante})`);
            }
            break;
        }
    }

    while (incorrectas.length < 3) {
        incorrectas.push(correcta);
    }

    const todas = [correcta, ...incorrectas.slice(0, 3)];
    return shuffleArray(todas);
}

// ==================== UTILIDADES ====================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function mostrarOpciones(opciones) {
    const opcionesElement = document.getElementById("opciones");
    if (!opcionesElement) return;
    opcionesElement.innerHTML = "";
    opciones.forEach(opcion => {
        const btn = document.createElement("button");
        btn.textContent = opcion;
        btn.addEventListener("click", () => verificarRespuesta(opcion));
        opcionesElement.appendChild(btn);
    });
}

// ==================== VERIFICACIÓN ====================

function verificarRespuesta(seleccionada) {
    const esCorrecta = (seleccionada === respuestaCorrecta);
    const feedbackElement = document.getElementById("feedback");
    if (esCorrecta) {
        puntaje += 10;
        if (feedbackElement) {
            feedbackElement.textContent = "✅ ¡Correcto! +10 puntos";
            feedbackElement.style.color = "green";
        }
        if (puntaje % 50 === 0) {
            nivel++;
            const nivelElement = document.getElementById("nivel");
            if (nivelElement) nivelElement.textContent = `Nivel: ${nivel}`;
        }
        guardarProgreso();
    } else {
        if (feedbackElement) {
            feedbackElement.textContent = "❌ Incorrecto. La respuesta era: " + respuestaCorrecta;
            feedbackElement.style.color = "red";
        }
    }
    const puntajeElement = document.getElementById("puntaje");
    if (puntajeElement) puntajeElement.textContent = `Puntaje: ${puntaje}`;
    const botones = document.querySelectorAll("#opciones button");
    botones.forEach(btn => btn.disabled = true);
    setTimeout(() => {
        if (feedbackElement) feedbackElement.textContent = "";
        generarPregunta();
    }, 1600);
}

// ==================== GUARDADO EN FIRESTORE ====================

function guardarProgreso() {
    if (!usuario) return;
    const db = firebase.firestore();
    const userRef = db.collection("usuarios").doc(usuario.uid);
    userRef.set({
        puntaje: puntaje,
        nivel: nivel,
        nombre: usuario.displayName || "Anónimo"
    }, { merge: true })
        .then(() => {
            console.log("Progreso guardado");
        })
        .catch(error => {
            console.error("Error guardando progreso:", error);
            const feedbackElement = document.getElementById("feedback");
            if (feedbackElement) {
                feedbackElement.textContent = "⚠️ Error al guardar progreso. Intenta de nuevo.";
                feedbackElement.style.color = "orange";
            }
        });
}

// ==================== AUTENTICACIÓN ====================

function cerrarSesion() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem("usuario");
            window.location.href = "index.html";
        }).catch(error => {
            console.error("Error al cerrar sesión:", error);
            alert("Error al cerrar sesión. Intenta de nuevo.");
        });
    }
}

function editarNombre() {
    const nuevoNombre = prompt("Ingresa tu nuevo nombre de usuario:", usuario ? usuario.displayName : "");
    if (nuevoNombre && nuevoNombre.trim() !== "") {
        const nombreLimpio = nuevoNombre.trim();
        if (usuario) {
            usuario.updateProfile({ displayName: nombreLimpio }).then(() => {
                const db = firebase.firestore();
                const userRef = db.collection("usuarios").doc(usuario.uid);
                userRef.set({ nombre: nombreLimpio }, { merge: true });
                const usuarioNombreElement = document.getElementById("usuarioNombre");
                if (usuarioNombreElement) usuarioNombreElement.textContent = nombreLimpio;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
                const feedbackElement = document.getElementById("feedback");
                if (feedbackElement) {
                    feedbackElement.textContent = "✅ Nombre actualizado.";
                    feedbackElement.style.color = "green";
                    setTimeout(() => feedbackElement.textContent = "", 2000);
                }
            }).catch(error => {
                console.error("Error al actualizar nombre:", error);
                alert("Error al actualizar nombre.");
            });
        }
    }
}

// ==================== INICIALIZACIÓN CON AUTH DE FIREBASE ====================

document.addEventListener("DOMContentLoaded", function () {
    // Verificar que los elementos existan antes de usarlos
    const feedback = document.getElementById("feedback");
    if (feedback) feedback.textContent = "⏳ Verificando sesión...";

    // Verificar que Firebase esté cargado
    if (typeof firebase === 'undefined') {
        console.error("Firebase no está cargado. Revisa tus scripts.");
        if (feedback) feedback.textContent = "❌ Error: Firebase no cargado.";
        return;
    }

    if (typeof firebase.auth === 'undefined') {
        console.error("Firebase Auth no está cargado.");
        if (feedback) feedback.textContent = "❌ Error: Firebase Auth no cargado.";
        return;
    }

    // Escuchar cambios en la autenticación
    firebase.auth().onAuthStateChanged(function (user) {
        console.log("onAuthStateChanged llamado. User:", user);
        if (user) {
            // Usuario autenticado
            usuario = user;
            sessionStorage.setItem("usuario", JSON.stringify(usuario));

            const nombreElement = document.getElementById("usuarioNombre");
            if (nombreElement) nombreElement.textContent = usuario.displayName || "Anónimo";

            // Cargar progreso
            const db = firebase.firestore();
            const userRef = db.collection("usuarios").doc(usuario.uid);
            userRef.get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    puntaje = data.puntaje || 0;
                    nivel = data.nivel || 1;
                    const puntajeElement = document.getElementById("puntaje");
                    const nivelElement = document.getElementById("nivel");
                    if (puntajeElement) puntajeElement.textContent = `Puntaje: ${puntaje}`;
                    if (nivelElement) nivelElement.textContent = `Nivel: ${nivel}`;
                }
                if (feedback) feedback.textContent = "";
                generarPregunta();
            }).catch(error => {
                console.error("Error cargando progreso:", error);
                if (feedback) feedback.textContent = "⚠️ Error al cargar progreso. Jugando desde cero.";
                generarPregunta();
            });

            // Listeners de botones
            const cerrarBtn = document.getElementById("cerrarSesion");
            const editarBtn = document.getElementById("editarNombre");
            if (cerrarBtn) cerrarBtn.addEventListener("click", cerrarSesion);
            if (editarBtn) editarBtn.addEventListener("click", editarNombre);

        } else {
            // No autenticado
            console.warn("Usuario no autenticado. Redirigiendo a index.html");
            sessionStorage.removeItem("usuario");
            window.location.href = "index.html";
        }
    });
});
