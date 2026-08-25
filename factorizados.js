// ==================== VARIABLES GLOBALES ====================
let puntaje = 0;
let nivel = 1;
let preguntaActual = {};
let opcionesActuales = [];
let respuestaCorrecta = "";
let usuario = null;
let authChecked = false; // Bandera para evitar múltiples redirecciones

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

    document.getElementById("pregunta").textContent = `Factoriza: ${pregunta}`;
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
        feedbackElement.textContent = "✅ ¡Correcto! +10 puntos";
        feedbackElement.style.color = "green";
        if (puntaje % 50 === 0) {
            nivel++;
            document.getElementById("nivel").textContent = `Nivel: ${nivel}`;
        }
        guardarProgreso();
    } else {
        feedbackElement.textContent = "❌ Incorrecto. La respuesta era: " + respuestaCorrecta;
        feedbackElement.style.color = "red";
    }
    document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
    const botones = document.querySelectorAll("#opciones button");
    botones.forEach(btn => btn.disabled = true);
    setTimeout(() => {
        feedbackElement.textContent = "";
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
            feedbackElement.textContent = "⚠️ Error al guardar progreso. Intenta de nuevo.";
            feedbackElement.style.color = "orange";
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
                document.getElementById("usuarioNombre").textContent = nombreLimpio;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
                const feedbackElement = document.getElementById("feedback");
                feedbackElement.textContent = "✅ Nombre actualizado.";
                feedbackElement.style.color = "green";
                setTimeout(() => feedbackElement.textContent = "", 2000);
            }).catch(error => {
                console.error("Error al actualizar nombre:", error);
                alert("Error al actualizar nombre.");
            });
        }
    }
}

// ==================== INICIALIZACIÓN CON AUTH DE FIREBASE Y FALLBACK ====================

function iniciarJuego(usuarioAutenticado) {
    if (usuarioAutenticado) {
        usuario = usuarioAutenticado;
        sessionStorage.setItem("usuario", JSON.stringify(usuario));
        document.getElementById("usuarioNombre").textContent = usuario.displayName || "Anónimo";

        const db = firebase.firestore();
        const userRef = db.collection("usuarios").doc(usuario.uid);
        userRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                puntaje = data.puntaje || 0;
                nivel = data.nivel || 1;
                document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
                document.getElementById("nivel").textContent = `Nivel: ${nivel}`;
            }
            const feedback = document.getElementById("feedback");
            if (feedback) feedback.textContent = "";
            generarPregunta();
        }).catch(error => {
            console.error("Error cargando progreso:", error);
            const feedback = document.getElementById("feedback");
            if (feedback) feedback.textContent = "⚠️ Error al cargar progreso. Jugando desde cero.";
            generarPregunta();
        });

        // Asignar listeners
        document.getElementById("cerrarSesion").addEventListener("click", cerrarSesion);
        document.getElementById("editarNombre").addEventListener("click", editarNombre);
    } else {
        // No autenticado: redirigir
        sessionStorage.removeItem("usuario");
        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error("Firebase no está definido. Asegúrate de cargar Firebase antes.");
        alert("Error: Firebase no está disponible. Revisa la consola.");
        return;
    }

    const feedback = document.getElementById("feedback");
    if (feedback) feedback.textContent = "⏳ Verificando sesión...";

    // 1. Intentar recuperar sesión desde sessionStorage (rápido)
    const storedUser = sessionStorage.getItem("usuario");
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.uid) {
                console.log("Sesión recuperada de sessionStorage:", parsed.displayName);
                // Intentamos iniciar el juego con este usuario, pero Firebase confirmará después
                // Para evitar conflictos, esperamos a onAuthStateChanged
            }
        } catch (e) {
            console.warn("Error al parsear usuario de sessionStorage", e);
        }
    }

    // 2. Escuchar cambios en autenticación (el método oficial)
    let authResolved = false;

    firebase.auth().onAuthStateChanged(function (user) {
        if (authResolved) return; // Ya se resolvió
        authResolved = true;

        console.log("onAuthStateChanged llamado. Usuario:", user ? user.displayName : "null");
        if (user) {
            // Autenticado correctamente
            console.log("Usuario autenticado:", user.displayName);
            iniciarJuego(user);
        } else {
            // No autenticado: intentar fallback con sessionStorage
            const stored = sessionStorage.getItem("usuario");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.uid) {
                        console.warn("onAuthStateChanged dijo null pero sessionStorage tiene usuario. Intentando usarlo como fallback.");
                        // Forzamos la autenticación con Firebase usando el token (esto puede no funcionar si expiró)
                        // Mejor redirigimos a login para que vuelva a autenticar.
                        sessionStorage.removeItem("usuario");
                        window.location.href = "index.html";
                        return;
                    }
                } catch (e) {}
            }
            // Si llegamos aquí, no hay sesión válida
            console.log("No hay usuario autenticado. Redirigiendo al login.");
            window.location.href = "index.html";
        }
    });

    // 3. Timeout de seguridad por si onAuthStateChanged no se dispara
    setTimeout(() => {
        if (!authResolved) {
            console.warn("onAuthStateChanged no se disparó en 5 segundos. Forzando verificación.");
            authResolved = true;
            // Verificar usuario actual manualmente
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log("currentUser obtenido por timeout:", currentUser.displayName);
                iniciarJuego(currentUser);
            } else {
                // Intentar sesión desde sessionStorage
                const stored = sessionStorage.getItem("usuario");
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed && parsed.uid) {
                            console.warn("Timeout: usando usuario de sessionStorage como fallback.");
                            // No tenemos forma de validar el token, pero podemos intentar
                            // Crear un objeto usuario simulado (esto es solo para pruebas)
                            // Normalmente deberías redirigir al login, pero aquí lo usamos como último recurso
                            const fakeUser = {
                                uid: parsed.uid,
                                displayName: parsed.displayName || "Anónimo",
                                updateProfile: () => Promise.resolve()
                            };
                            iniciarJuego(fakeUser);
                            return;
                        }
                    } catch (e) {}
                }
                console.warn("Timeout: No se encontró usuario. Redirigiendo al login.");
                window.location.href = "index.html";
            }
        }
    }, 5000); // 5 segundos de espera
});
