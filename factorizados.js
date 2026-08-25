// ==================== VARIABLES GLOBALES ====================
let puntaje = 0;
let nivel = 1;
let racha = 0;
let preguntaActual = {};
let opcionesActuales = [];
let respuestaCorrecta = "";
let usuario = null;

// ==================== FUNCIONES DE GENERACIÓN ====================

function generarPregunta() {
    console.log("🔄 Generando nueva pregunta...");
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

    console.log("📝 Pregunta generada:", pregunta);
    console.log("✅ Respuesta correcta:", correcta);
    console.log("🔘 Opciones:", opciones);

    // Actualizar el DOM (con múltiples selectores)
    actualizarElemento("pregunta", `Factoriza: ${pregunta}`);
    actualizarElemento("preguntaDisplay", `Factoriza: ${pregunta}`);
    actualizarElemento("question", `Factoriza: ${pregunta}`);
    // También buscar cualquier elemento que contenga "CARGANDO PREGUNTA" y reemplazarlo
    const todosLosElementos = document.querySelectorAll("*");
    for (let el of todosLosElementos) {
        if (el.textContent && el.textContent.includes("CARGANDO PREGUNTA")) {
            el.textContent = `Factoriza: ${pregunta}`;
            break;
        }
    }

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

function actualizarElemento(id, texto) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = texto;
        console.log(`✅ Actualizado #${id} con: ${texto}`);
    } else {
        // Buscar por clase o cualquier otro selector
        const alternativos = document.querySelectorAll(`[data-role="${id}"], .${id}, [name="${id}"]`);
        if (alternativos.length > 0) {
            alternativos.forEach(e => e.textContent = texto);
            console.log(`✅ Actualizado ${alternativos.length} elementos con data-role/clase ${id}`);
        } else {
            console.warn(`⚠️ No se encontró elemento con id #${id}, clase .${id} o data-role="${id}"`);
        }
    }
}

function mostrarOpciones(opciones) {
    // Buscar contenedor de opciones por varios métodos
    let contenedor = document.getElementById("opciones");
    if (!contenedor) {
        contenedor = document.querySelector(".opciones-container, [data-role='opciones']");
    }
    if (!contenedor) {
        // Si no existe, crearlo
        console.warn("⚠️ No se encontró contenedor de opciones. Creando uno nuevo...");
        contenedor = document.createElement("div");
        contenedor.id = "opciones";
        contenedor.style.display = "flex";
        contenedor.style.flexWrap = "wrap";
        contenedor.style.gap = "10px";
        contenedor.style.justifyContent = "center";
        contenedor.style.marginTop = "20px";
        // Insertar después del elemento de la pregunta
        const preguntaEl = document.getElementById("pregunta") || document.querySelector("[data-role='pregunta']") || document.body;
        preguntaEl.parentNode.insertBefore(contenedor, preguntaEl.nextSibling);
    }

    contenedor.innerHTML = "";
    opciones.forEach(opcion => {
        const btn = document.createElement("button");
        btn.textContent = opcion;
        btn.style.padding = "10px 20px";
        btn.style.margin = "5px";
        btn.style.fontSize = "1.2rem";
        btn.style.cursor = "pointer";
        btn.addEventListener("click", () => verificarRespuesta(opcion));
        contenedor.appendChild(btn);
    });
    console.log("🔘 Opciones mostradas en el DOM");
}

// ==================== VERIFICACIÓN ====================

function verificarRespuesta(seleccionada) {
    const esCorrecta = (seleccionada === respuestaCorrecta);
    const feedback = document.getElementById("feedback") || document.querySelector(".feedback") || document.createElement("div");
    if (!feedback.id) feedback.id = "feedback";

    if (esCorrecta) {
        puntaje += 10;
        racha++;
        feedback.textContent = "✅ ¡Correcto! +10 puntos";
        feedback.style.color = "green";
        if (puntaje % 50 === 0) {
            nivel++;
            actualizarElemento("nivel", `Nivel: ${nivel}`);
            actualizarElemento("nivelActual", `Nivel ${nivel}`);
        }
        guardarProgreso();
    } else {
        racha = 0;
        feedback.textContent = "❌ Incorrecto. La respuesta era: " + respuestaCorrecta;
        feedback.style.color = "red";
    }

    actualizarElemento("puntaje", `Puntaje: ${puntaje}`);
    actualizarElemento("score", `${puntaje}`);
    actualizarElemento("racha", `Racha: ${racha}`);
    actualizarElemento("xp", `${puntaje} / 100 XP`);

    // Deshabilitar botones
    const botones = document.querySelectorAll("#opciones button, .opciones-container button, [data-role='opciones'] button");
    botones.forEach(btn => btn.disabled = true);

    setTimeout(() => {
        feedback.textContent = "";
        generarPregunta();
    }, 1600);
}

// ==================== GUARDADO EN FIRESTORE ====================

function guardarProgreso() {
    if (!usuario) return;
    try {
        const db = firebase.firestore();
        const userRef = db.collection("usuarios").doc(usuario.uid);
        userRef.set({
            puntaje: puntaje,
            nivel: nivel,
            racha: racha,
            nombre: usuario.displayName || "Anónimo"
        }, { merge: true })
        .then(() => console.log("💾 Progreso guardado"))
        .catch(error => console.error("Error guardando:", error));
    } catch (e) {
        console.error("Error al acceder a Firestore:", e);
    }
}

// ==================== AUTENTICACIÓN ====================

function cerrarSesion() {
    if (confirm("¿Seguro que quieres salir?")) {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem("usuario");
            window.location.href = "index.html";
        });
    }
}

function guardarNombre() {
    const nuevoNombre = prompt("Nuevo nombre de usuario:", usuario ? usuario.displayName : "");
    if (nuevoNombre && nuevoNombre.trim() !== "") {
        const nombreLimpio = nuevoNombre.trim();
        if (usuario) {
            usuario.updateProfile({ displayName: nombreLimpio }).then(() => {
                try {
                    const db = firebase.firestore();
                    db.collection("usuarios").doc(usuario.uid).set({ nombre: nombreLimpio }, { merge: true });
                } catch (e) {}
                actualizarElemento("usuarioNombre", nombreLimpio);
                actualizarElemento("nombreUsuario", nombreLimpio);
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
                alert("✅ Nombre actualizado");
            }).catch(error => alert("Error al actualizar nombre"));
        }
    }
}

// ==================== INICIALIZACIÓN ====================

function iniciarJuego() {
    console.log("🎮 Iniciando juego...");
    // Actualizar nombre
    const nombre = usuario.displayName || "Aventurero";
    actualizarElemento("usuarioNombre", nombre);
    actualizarElemento("nombreUsuario", nombre);
    // También buscar cualquier elemento que muestre el nombre
    document.querySelectorAll("*").forEach(el => {
        if (el.textContent && el.textContent.includes("Aventurero") && el.tagName !== "INPUT") {
            el.textContent = nombre;
        }
    });

    // Cargar progreso
    try {
        const db = firebase.firestore();
        db.collection("usuarios").doc(usuario.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                puntaje = data.puntaje || 0;
                nivel = data.nivel || 1;
                racha = data.racha || 0;
                actualizarElemento("puntaje", `Puntaje: ${puntaje}`);
                actualizarElemento("score", `${puntaje}`);
                actualizarElemento("nivel", `Nivel: ${nivel}`);
                actualizarElemento("nivelActual", `Nivel ${nivel}`);
                actualizarElemento("racha", `Racha: ${racha}`);
                actualizarElemento("xp", `${puntaje} / 100 XP`);
            }
            // Generar primera pregunta
            generarPregunta();
        }).catch(error => {
            console.error("Error cargando progreso:", error);
            generarPregunta();
        });
    } catch (e) {
        console.error("Error al acceder a Firestore:", e);
        generarPregunta();
    }

    // Botones
    const salirBtn = document.getElementById("salir") || document.getElementById("cerrarSesion") || document.querySelector("[data-role='salir']");
    if (salirBtn) salirBtn.addEventListener("click", cerrarSesion);
    const guardarBtn = document.getElementById("guardar") || document.getElementById("editarNombre") || document.querySelector("[data-role='guardar']");
    if (guardarBtn) guardarBtn.addEventListener("click", guardarNombre);
}

// ==================== CARGA DE LA PÁGINA ====================

document.addEventListener("DOMContentLoaded", function () {
    console.log("📄 factorizados.html cargado");

    // Mostrar mensaje de carga
    const feedback = document.getElementById("feedback") || document.querySelector(".feedback");
    if (feedback) {
        feedback.textContent = "⏳ Verificando sesión...";
        feedback.style.color = "blue";
    }

    const user = firebase.auth().currentUser;
    if (user) {
        console.log("👤 Usuario autenticado:", user.displayName);
        usuario = user;
        sessionStorage.setItem("usuario", JSON.stringify(usuario));
        if (feedback) feedback.textContent = "";
        iniciarJuego();
    } else {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("👤 Usuario autenticado (callback):", user.displayName);
                usuario = user;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
                if (feedback) feedback.textContent = "";
                iniciarJuego();
            } else {
                console.log("❌ No hay usuario, redirigiendo...");
                sessionStorage.removeItem("usuario");
                window.location.href = "index.html";
            }
        });
    }
});
