// Configuración de Firebase (asegúrate de que esté cargada antes)
let db;

// Variables globales del juego
let puntaje = 0;
let nivel = 1;
let preguntaActual = {};
let opcionesActuales = [];
let respuestaCorrecta = "";
let usuario = null;

// Elementos del DOM
const preguntaElement = document.getElementById("pregunta");
const opcionesElement = document.getElementById("opciones");
const puntajeElement = document.getElementById("puntaje");
const nivelElement = document.getElementById("nivel");
const feedbackElement = document.getElementById("feedback");
const cerrarSesionBtn = document.getElementById("cerrarSesion");
const editarNombreBtn = document.getElementById("editarNombre");
const usuarioNombreSpan = document.getElementById("usuarioNombre");

// ==================== FUNCIONES DE GENERACIÓN ====================

function generarPregunta() {
    const tipo = Math.floor(Math.random() * 4); // 0: dif cuadrados, 1: tcp, 2: trinomio, 3: cubo
    let pregunta = "";
    let correcta = "";

    switch (tipo) {
        case 0: // Diferencia de cuadrados
            const a = Math.floor(Math.random() * 9) + 2;
            const b = Math.floor(Math.random() * 9) + 2;
            pregunta = `x² - ${b*b}`;
            correcta = `(x-${b})(x+${b})`;
            break;
        case 1: // Trinomio cuadrado perfecto
            const c = Math.floor(Math.random() * 9) + 2;
            const signo = Math.random() < 0.5 ? '+' : '-';
            pregunta = `x² ${signo === '+' ? '+' : '-'} ${2*c}x + ${c*c}`;
            correcta = `(x${signo}${c})²`;
            break;
        case 2: // Trinomio de la forma x² + bx + c
            const p = Math.floor(Math.random() * 9) + 2;
            const q = Math.floor(Math.random() * 9) + 2;
            const suma = p + q;
            const producto = p * q;
            const signoSuma = Math.random() < 0.5 ? '+' : '-';
            const signoProd = Math.random() < 0.5 ? '+' : '-';
            let b2 = (signoSuma === '+' ? suma : -suma);
            let c2 = (signoProd === '+' ? producto : -producto);
            pregunta = `x² ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}x ${c2 >= 0 ? '+' : '-'} ${Math.abs(c2)}`;
            // Opciones correctas
            const raiz1 = (signoSuma === '+' ? p : -p);
            const raiz2 = (signoProd === '+' ? q : -q);
            correcta = `(x${raiz1 >= 0 ? '+' : ''}${raiz1})(x${raiz2 >= 0 ? '+' : ''}${raiz2})`;
            break;
        case 3: // Cubo (suma o diferencia)
            const b5 = Math.floor(Math.random() * 9) + 2;
            const signoCubo = Math.random() < 0.5 ? '+' : '-';
            if (signoCubo === '+') {
                pregunta = `x³ + ${b5*b5*b5}`;
                correcta = `(x+${b5})(x²-${b5}x+${b5*b5})`;
            } else {
                pregunta = `x³ - ${b5*b5*b5}`;
                correcta = `(x-${b5})(x²+${b5}x+${b5*b5})`;
            }
            break;
    }

    respuestaCorrecta = correcta;
    const opciones = generarOpcionesFactorizacion(correcta, tipo);
    opcionesActuales = opciones;
    preguntaActual = { pregunta, correcta, opciones };

    // Mostrar en UI
    preguntaElement.textContent = `Factoriza: ${pregunta}`;
    mostrarOpciones(opciones);
}

function generarOpcionesFactorizacion(correcta, tipo) {
    let opciones = [correcta];

    // Generar 3 opciones incorrectas según el tipo
    let incorrectas = [];

    switch (tipo) {
        case 0: // Diferencia de cuadrados
            // Ej: (x-3)(x+3) -> cambiar b
            const matchDC = correcta.match(/\(x([+-])(\d+)\)\(x([+-])(\d+)\)/);
            if (matchDC) {
                const b = parseInt(matchDC[2]);
                let nuevoB;
                do {
                    nuevoB = Math.floor(Math.random() * 9) + 2;
                } while (nuevoB === b);
                incorrectas.push(`(x-${nuevoB})(x+${nuevoB})`);
                incorrectas.push(`(x+${b})(x-${b})`); // signo cambiado
                let otroB;
                do {
                    otroB = Math.floor(Math.random() * 9) + 2;
                } while (otroB === b || otroB === nuevoB);
                incorrectas.push(`(x-${otroB})(x+${otroB})`);
            }
            break;

        case 1: // TCP
            const matchTCP = correcta.match(/\(x([+-])(\d+)\)²/);
            if (matchTCP) {
                const b = parseInt(matchTCP[2]);
                const signo = matchTCP[1];
                // cambiar b
                let nuevoB;
                do {
                    nuevoB = Math.floor(Math.random() * 9) + 2;
                } while (nuevoB === b);
                incorrectas.push(`(x${signo}${nuevoB})²`);
                // cambiar signo
                const otroSigno = signo === '+' ? '-' : '+';
                incorrectas.push(`(x${otroSigno}${b})²`);
                // cambiar ambos
                incorrectas.push(`(x${otroSigno}${nuevoB})²`);
            }
            break;

        case 2: // Trinomio
            const matchTri = correcta.match(/\(x([+-])(\d+)\)\(x([+-])(\d+)\)/);
            if (matchTri) {
                const r1 = parseInt(matchTri[2]);
                const r2 = parseInt(matchTri[4]);
                const s1 = matchTri[1];
                const s2 = matchTri[3];
                // cambiar r1
                let nr1;
                do {
                    nr1 = Math.floor(Math.random() * 9) + 2;
                } while (nr1 === r1);
                incorrectas.push(`(x${s1}${nr1})(x${s2}${r2})`);
                // cambiar r2
                let nr2;
                do {
                    nr2 = Math.floor(Math.random() * 9) + 2;
                } while (nr2 === r2);
                incorrectas.push(`(x${s1}${r1})(x${s2}${nr2})`);
                // cambiar ambos signos
                const ns1 = s1 === '+' ? '-' : '+';
                const ns2 = s2 === '+' ? '-' : '+';
                incorrectas.push(`(x${ns1}${r1})(x${ns2}${r2})`);
            }
            break;

        case 3: // Cubo
            // Regex corregido: sin espacios
            const matchCubo = correcta.match(/\(x([+-])(\d+)\)\(x²([+-])(\d+)x\+(\d+)\)/);
            if (matchCubo) {
                const b = parseInt(matchCubo[2]);
                const signoPrimero = matchCubo[1];  // + o -
                const signoMedio = matchCubo[3];    // + o -
                const coef = parseInt(matchCubo[4]); // debería ser b
                const constante = parseInt(matchCubo[5]); // b²

                // Opción 1: cambiar b (y por tanto constante y coeficiente)
                let nb;
                do {
                    nb = Math.floor(Math.random() * 9) + 2;
                } while (nb === b);
                // El signo medio debe ser opuesto al primero (si es suma, medio es -; si es resta, medio es +)
                const nuevoSignoMedio = signoPrimero === '+' ? '-' : '+';
                incorrectas.push(`(x${signoPrimero}${nb})(x²${nuevoSignoMedio}${nb}x+${nb*nb})`);

                // Opción 2: cambiar signo primero (y medio)
                const otroSigno = signoPrimero === '+' ? '-' : '+';
                const otroMedio = otroSigno === '+' ? '-' : '+';
                incorrectas.push(`(x${otroSigno}${b})(x²${otroMedio}${b}x+${b*b})`);

                // Opción 3: cambiar constante (b²) sin cambiar b
                let nuevaConstante;
                do {
                    nuevaConstante = Math.floor(Math.random() * 9) + 2;
                } while (nuevaConstante === constante || nuevaConstante === b*b);
                incorrectas.push(`(x${signoPrimero}${b})(x²${signoMedio}${b}x+${nuevaConstante})`);
            }
            break;
    }

    // Asegurar que tenemos al menos 3 incorrectas (rellenar con correcta si no)
    while (incorrectas.length < 3) {
        incorrectas.push(correcta);
    }

    // Mezclar correcta + incorrectas y devolver
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
    if (esCorrecta) {
        puntaje += 10;
        feedbackElement.textContent = "✅ ¡Correcto! +10 puntos";
        feedbackElement.style.color = "green";
        // Subir de nivel cada 5 aciertos
        if (puntaje % 50 === 0) {
            nivel++;
            nivelElement.textContent = `Nivel: ${nivel}`;
        }
        // Guardar progreso
        guardarProgreso();
    } else {
        feedbackElement.textContent = "❌ Incorrecto. La respuesta era: " + respuestaCorrecta;
        feedbackElement.style.color = "red";
    }
    puntajeElement.textContent = `Puntaje: ${puntaje}`;
    // Deshabilitar botones
    const botones = opcionesElement.querySelectorAll("button");
    botones.forEach(btn => btn.disabled = true);
    // Nueva pregunta después de 1.5 segundos
    setTimeout(() => {
        feedbackElement.textContent = "";
        generarPregunta();
        // Re-habilitar botones (se generan nuevos)
    }, 1600);
}

// ==================== GUARDADO EN FIRESTORE ====================

function guardarProgreso() {
    if (!usuario) return;
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
                // Actualizar en Firestore
                const userRef = db.collection("usuarios").doc(usuario.uid);
                userRef.set({ nombre: nombreLimpio }, { merge: true });
                usuarioNombreSpan.textContent = nombreLimpio;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
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

// ==================== INICIALIZACIÓN ====================

document.addEventListener("DOMContentLoaded", function() {
    // Inicializar Firebase (ya debe estar cargado)
    db = firebase.firestore();

    // Verificar usuario en sesión
    const usuarioJSON = sessionStorage.getItem("usuario");
    if (usuarioJSON) {
        usuario = JSON.parse(usuarioJSON);
        usuarioNombreSpan.textContent = usuario.displayName || "Anónimo";
    } else {
        // Si no hay sesión, redirigir al login
        window.location.href = "index.html";
        return;
    }

    // Cargar progreso desde Firestore
    if (usuario) {
        const userRef = db.collection("usuarios").doc(usuario.uid);
        userRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                puntaje = data.puntaje || 0;
                nivel = data.nivel || 1;
                puntajeElement.textContent = `Puntaje: ${puntaje}`;
                nivelElement.textContent = `Nivel: ${nivel}`;
            }
        }).catch(error => {
            console.error("Error cargando progreso:", error);
        });
    }

    // Generar primera pregunta
    generarPregunta();

    // Event listeners (sin duplicados)
    document.getElementById("cerrarSesion").addEventListener("click", cerrarSesion);
    document.getElementById("editarNombre").addEventListener("click", editarNombre);
});
