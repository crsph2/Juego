// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0;
let feedbackTimeout = null;

// Elementos del DOM
let elNombre, elPuntuacion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elHistorialPasos, elVistaPrevia, elFeedbackPractica, elNextPracticaBtn;
let elNumeroPractica, elBtnAccion, elOperacionBtns;
let elControlesPractica, elMensajeExito, elTextoSolucion;

// ---------- Generación de ecuaciones ----------
function generarEcuacionLineal() {
    const a = Math.floor(Math.random() * 4) + 1;
    const b = Math.floor(Math.random() * 10) - 5;
    const x = Math.floor(Math.random() * 10) - 5;
    const c = a * x + b;
    return { a, b, c, x };
}

function formatearEcuacion(a, b, c) {
    let left = '';
    if (a === 1) left = 'x';
    else if (a === -1) left = '-x';
    else left = a + 'x';
    if (b > 0) left += ' + ' + b;
    else if (b < 0) left += ' - ' + Math.abs(b);
    return left + ' = ' + c;
}

// ---------- Generación de pasos correctos ----------
function generarPasos(a, b, c, x) {
    const pasos = [];
    pasos.push({ tipo: 'original', texto: formatearEcuacion(a, b, c), a, b, c });

    let pasoActual = { a, b, c };

    if (b !== 0) {
        const valor = Math.abs(b);
        const operacion = b > 0 ? 'restar' : 'sumar';
        const nuevoB = 0;
        const nuevoC = c - b;
        pasos.push({
            tipo: 'mover_constante',
            operacion,
            valor,
            a: a,
            b: nuevoB,
            c: nuevoC,
            texto: formatearEcuacion(a, nuevoB, nuevoC)
        });
        pasoActual = { a, b: nuevoB, c: nuevoC };
    }

    if (a !== 1) {
        const valor = a;
        const operacion = 'dividir';
        const nuevoA = 1;
        const nuevoC = pasoActual.c / a;
        pasos.push({
            tipo: 'dividir',
            operacion,
            valor,
            a: nuevoA,
            b: pasoActual.b,
            c: nuevoC,
            texto: formatearEcuacion(nuevoA, pasoActual.b, nuevoC)
        });
        pasoActual = { a: nuevoA, b: pasoActual.b, c: nuevoC };
    }

    pasos.push({ tipo: 'solucion', x, texto: 'x = ' + x });
    return pasos;
}

// ---------- Estado de práctica ----------
let practicaState = {
    pasos: [],
    pasoActual: 0,              // índice del último paso confirmado (original + simplificaciones)
    operacionPendiente: null,   // { operacion, numero, textoVistaPrevia } cuando se ha presionado "Operar"
    eq: null
};

// ---------- Funciones auxiliares ----------
function aplicarOperacion(ecuacion, op, num) {
    let { a, b, c } = ecuacion;
    switch (op) {
        case 'sumar': return { a, b: b + num, c: c + num };
        case 'restar': return { a, b: b - num, c: c - num };
        case 'multiplicar': return { a: a * num, b: b * num, c: c * num };
        case 'dividir': return { a: a / num, b: b / num, c: c / num };
        default: return { a, b, c };
    }
}

// ---------- Iniciar práctica ----------
function iniciarPractica() {
    const eq = generarEcuacionLineal();
    practicaState.eq = eq;
    practicaState.pasos = generarPasos(eq.a, eq.b, eq.c, eq.x);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;

    // Mostrar controles, ocultar mensaje de éxito y siguiente
    if (elControlesPractica) elControlesPractica.style.display = 'block';
    if (elMensajeExito) elMensajeExito.style.display = 'none';
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';
    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
        if (feedbackTimeout) {
            clearTimeout(feedbackTimeout);
            feedbackTimeout = null;
        }
    }

    mostrarHistorial();

    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'none';
        elVistaPrevia.innerHTML = '';
    }

    resetearControles();
    elOperacionBtns.forEach(btn => btn.disabled = false);
    elNumeroPractica.disabled = false;
    elBtnAccion.disabled = true;
    elBtnAccion.textContent = 'Operar';
}

function mostrarHistorial() {
    if (!elHistorialPasos) return;
    elHistorialPasos.innerHTML = '';
    // Mostrar todos los pasos confirmados (desde 0 hasta pasoActual inclusive)
    for (let i = 0; i <= practicaState.pasoActual; i++) {
        const paso = practicaState.pasos[i];
        if (!paso) continue;
        const div = document.createElement('div');
        div.className = 'ecuacion-linea paso-confirmado';
        div.textContent = paso.texto;
        elHistorialPasos.appendChild(div);
    }
}

function resetearControles() {
    elOperacionBtns.forEach(btn => btn.classList.remove('seleccionado'));
    elNumeroPractica.value = '';
    elBtnAccion.disabled = true;
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'none';
        elVistaPrevia.innerHTML = '';
    }
}

// ---------- Actualizar vista previa (solo para "Operar") ----------
function actualizarVistaPrevia() {
    // Solo si no hay operación pendiente
    if (practicaState.operacionPendiente) {
        // Ya hay una operación en espera, no actualizar vista previa
        return;
    }

    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) {
        if (elVistaPrevia) {
            elVistaPrevia.style.display = 'none';
            elVistaPrevia.innerHTML = '';
        }
        elBtnAccion.disabled = true;
        return;
    }
    const operacion = opSeleccionada.dataset.op;
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) {
        if (elVistaPrevia) {
            elVistaPrevia.style.display = 'none';
            elVistaPrevia.innerHTML = '';
        }
        elBtnAccion.disabled = true;
        return;
    }

    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') {
        elBtnAccion.disabled = true;
        return;
    }

    // Generar la ecuación con la operación aplicada (sin simplificar)
    const nuevaEcuacion = aplicarOperacion(ecuacionActual, operacion, num);
    const textoConOperacion = `${ecuacionActual.texto}  →  ${formatearEcuacion(nuevaEcuacion.a, nuevaEcuacion.b, nuevaEcuacion.c)}`;

    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'block';
        elVistaPrevia.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'ecuacion-linea vista-previa';
        div.textContent = textoConOperacion;
        elVistaPrevia.appendChild(div);
    }

    elBtnAccion.disabled = false;
    elBtnAccion.textContent = 'Operar';
}

// ---------- Manejar el botón (alterna entre Operar y Confirmar paso) ----------
function manejarBoton() {
    if (practicaState.operacionPendiente) {
        // Estamos en modo "Confirmar paso"
        confirmarPaso();
    } else {
        // Estamos en modo "Operar"
        realizarOperacion();
    }
}

// ---------- Operar: mostrar la operación sin simplificar ----------
function realizarOperacion() {
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) {
        mostrarFeedbackPractica('Selecciona una operación.', 'error');
        return;
    }
    const operacion = opSeleccionada.dataset.op;
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) {
        mostrarFeedbackPractica('Ingresa un número positivo.', 'error');
        return;
    }

    // Verificar que no estemos ya en la solución
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        mostrarFeedbackPractica('Ya has resuelto la ecuación.', 'error');
        return;
    }

    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') {
        mostrarFeedbackPractica('No hay más pasos.', 'error');
        return;
    }

    // Generar la ecuación con la operación aplicada (sin simplificar)
    const nuevaEcuacion = aplicarOperacion(ecuacionActual, operacion, num);
    const textoConOperacion = `${ecuacionActual.texto}  →  ${formatearEcuacion(nuevaEcuacion.a, nuevaEcuacion.b, nuevaEcuacion.c)}`;

    // Guardar la operación pendiente
    practicaState.operacionPendiente = {
        operacion,
        numero: num,
        ecuacionOriginal: ecuacionActual,
        ecuacionAplicada: nuevaEcuacion,
        textoVistaPrevia: textoConOperacion
    };

    // Mostrar la vista previa (ya está mostrada, pero aseguramos)
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'block';
        elVistaPrevia.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'ecuacion-linea vista-previa';
        div.textContent = textoConOperacion;
        elVistaPrevia.appendChild(div);
    }

    // Cambiar el botón a "Confirmar paso"
    elBtnAccion.textContent = 'Confirmar paso';
    // Deshabilitar los botones de operación y número para que no se cambien
    elOperacionBtns.forEach(btn => btn.disabled = true);
    elNumeroPractica.disabled = true;
    // El botón ya está habilitado
    elBtnAccion.disabled = false;
}

// ---------- Confirmar paso: simplificar y agregar al historial ----------
function confirmarPaso() {
    if (!practicaState.operacionPendiente) {
        // No debería ocurrir
        return;
    }

    const pendiente = practicaState.operacionPendiente;
    const ecuacionAplicada = pendiente.ecuacionAplicada;
    const ecuacionSimplificada = aplicarOperacion(
        pendiente.ecuacionOriginal,
        pendiente.operacion,
        pendiente.numero
    );
    // La ecuación simplificada ya la tenemos (es la misma que aplicada, pero la calculamos de nuevo por claridad)
    // En realidad, `ecuacionAplicada` ya es el resultado de aplicar la operación, que es la simplificada.
    // Pero para evitar redondeos, usamos la que tenemos.
    const textoSimplificado = formatearEcuacion(ecuacionAplicada.a, ecuacionAplicada.b, ecuacionAplicada.c);

    // Verificar si este paso coincide con el siguiente paso esperado
    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    let esCorrecto = false;
    if (pasoEsperado && (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir')) {
        // Comparar con la operación y número esperados
        esCorrecto = (pendiente.operacion === pasoEsperado.operacion && pendiente.numero === pasoEsperado.valor);
    }

    if (!esCorrecto) {
        // El paso no es correcto
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Revisa la pista.', 'error');
        // Dejamos la operación pendiente para que pueda corregir? Mejor reiniciamos el estado de pendiente y habilitamos controles
        practicaState.operacionPendiente = null;
        resetearControles();
        elOperacionBtns.forEach(btn => btn.disabled = false);
        elNumeroPractica.disabled = false;
        elBtnAccion.textContent = 'Operar';
        elBtnAccion.disabled = true;
        // Ocultar vista previa
        if (elVistaPrevia) {
            elVistaPrevia.style.display = 'none';
            elVistaPrevia.innerHTML = '';
        }
        return;
    }

    // Paso correcto: avanzar al siguiente paso confirmado (el simplificado)
    practicaState.pasoActual++;
    // Agregar al historial el texto simplificado
    mostrarHistorial();  // Esto mostrará todos los pasos confirmados hasta el actual

    // Limpiar la operación pendiente
    practicaState.operacionPendiente = null;

    // Ocultar vista previa
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'none';
        elVistaPrevia.innerHTML = '';
    }

    // Restablecer controles
    resetearControles();
    elOperacionBtns.forEach(btn => btn.disabled = false);
    elNumeroPractica.disabled = false;
    elBtnAccion.textContent = 'Operar';
    elBtnAccion.disabled = true;

    // Verificar si hemos llegado a la solución
    if (practicaState.pasoActual === practicaState.pasos.length - 1) {
        // Solución alcanzada
        const solucion = practicaState.pasos[practicaState.pasoActual];
        if (elControlesPractica) elControlesPractica.style.display = 'none';
        if (elMensajeExito) {
            elMensajeExito.style.display = 'block';
            if (elTextoSolucion) elTextoSolucion.textContent = solucion.texto;
        }
        if (elFeedbackPractica) {
            elFeedbackPractica.className = 'feedback hidden';
            elFeedbackPractica.textContent = '';
            if (feedbackTimeout) {
                clearTimeout(feedbackTimeout);
                feedbackTimeout = null;
            }
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        // Deshabilitar todo
        elOperacionBtns.forEach(btn => btn.disabled = true);
        elNumeroPractica.disabled = true;
        elBtnAccion.disabled = true;
    } else {
        // Mostrar feedback de éxito
        mostrarFeedbackPractica('✅ ¡Bien hecho!', 'exito');
    }
}

function mostrarFeedbackPractica(mensaje, tipo) {
    if (!elFeedbackPractica) return;
    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = null;
    }
    elFeedbackPractica.textContent = mensaje;
    elFeedbackPractica.className = 'feedback';
    if (tipo === 'exito') elFeedbackPractica.classList.add('feedback-exito');
    else if (tipo === 'error') elFeedbackPractica.classList.add('feedback-error');
    elFeedbackPractica.classList.remove('hidden');
    feedbackTimeout = setTimeout(() => {
        elFeedbackPractica.classList.add('hidden');
        feedbackTimeout = null;
    }, 2500);
}

// ---------- Modo Alternativas ----------
let preguntaActualAlt = null;

function generarPreguntaAlternativas() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    const enunciado = formatearEcuacion(a, b, c);
    const correcta = x;
    const opciones = new Set();
    opciones.add(correcta);
    let intentos = 0;
    while (opciones.size < 4 && intentos < 100) {
        intentos++;
        let distractora = correcta + Math.floor(Math.random() * 10) - 5;
        if (distractora !== correcta && distractora >= -10 && distractora <= 10) {
            opciones.add(distractora);
        }
    }
    return {
        enunciado: `Resuelve: ${enunciado}`,
        respuestaCorrecta: correcta,
        opciones: mezclarArray(Array.from(opciones))
    };
}

function nuevaPreguntaAlternativas() {
    preguntaActualAlt = generarPreguntaAlternativas();
    if (elPreguntaAlt) elPreguntaAlt.textContent = preguntaActualAlt.enunciado + ' → x = ?';
    if (elOpcionesAlt) {
        elOpcionesAlt.innerHTML = '';
        preguntaActualAlt.opciones.forEach((opcion) => {
            const btn = document.createElement('button');
            btn.className = 'rpg-button btn-opcion';
            btn.textContent = opcion;
            btn.addEventListener('click', () => responderAlternativa(opcion, btn));
            elOpcionesAlt.appendChild(btn);
        });
    }
    if (elFeedbackAlt) {
        elFeedbackAlt.classList.add('hidden');
        elFeedbackAlt.classList.remove('feedback-exito', 'feedback-error');
    }
}

function responderAlternativa(opcionElegida, btnElegido) {
    if (!elOpcionesAlt) return;
    [...elOpcionesAlt.children].forEach(b => b.disabled = true);
    const esCorrecta = opcionElegida === preguntaActualAlt.respuestaCorrecta;

    if (esCorrecta) {
        racha++;
        puntuacion += 10 + Math.min(racha, 5) * 2;
        btnElegido.classList.add('opcion-correcta');
        if (elFeedbackAlt) {
            elFeedbackAlt.textContent = '✅ ¡Correcto! x = ' + preguntaActualAlt.respuestaCorrecta;
            elFeedbackAlt.className = 'feedback feedback-exito';
            elFeedbackAlt.classList.remove('hidden');
        }
    } else {
        racha = 0;
        btnElegido.classList.add('opcion-incorrecta');
        if (elFeedbackAlt) {
            elFeedbackAlt.textContent = `❌ Casi. La respuesta correcta era x = ${preguntaActualAlt.respuestaCorrecta}`;
            elFeedbackAlt.className = 'feedback feedback-error';
            elFeedbackAlt.classList.remove('hidden');
        }
    }
    if (elRachaAlt) elRachaAlt.textContent = racha;
    if (elPuntuacion) elPuntuacion.textContent = puntuacion;

    guardarProgreso(esCorrecta);
    setTimeout(nuevaPreguntaAlternativas, 1600);
}

async function guardarProgreso(acerto) {
    if (!window.uid) return;
    try {
        const ref = db.collection('usuarios').doc(window.uid);
        await ref.update({
            [`juegos.incognita.puntuacion`]: puntuacion,
            [`juegos.incognita.racha`]: racha,
            [`juegos.incognita.ultimaJugada`]: new Date().toISOString()
        });
        await ref.update({
            xpTotal: firebase.firestore.FieldValue.increment(acerto ? 5 : 0)
        });
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- Cambio de modo ----------
function cambiarModo(modo) {
    modoActual = modo;
    const modoAlt = document.getElementById('modo-alternativas');
    const modoPract = document.getElementById('modo-practica');
    const btnAlt = document.getElementById('mode-alternativas');
    const btnPract = document.getElementById('mode-practica');

    if (modoAlt) modoAlt.style.display = modo === 'alternativas' ? 'block' : 'none';
    if (modoPract) modoPract.style.display = modo === 'practica' ? 'block' : 'none';
    if (btnAlt) btnAlt.classList.toggle('active', modo === 'alternativas');
    if (btnPract) btnPract.classList.toggle('active', modo === 'practica');

    if (modo === 'alternativas') {
        nuevaPreguntaAlternativas();
    } else {
        iniciarPractica();
    }
}

// ---------- Inicialización ----------
function iniciarJuego() {
    elNombre = document.getElementById('player-name');
    elPuntuacion = document.getElementById('player-score');
    elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
    elOpcionesAlt = document.getElementById('opciones-container-alt');
    elFeedbackAlt = document.getElementById('feedback-message-alt');
    elRachaAlt = document.getElementById('racha-actual-alt');
    elHistorialPasos = document.getElementById('historial-pasos');
    elVistaPrevia = document.getElementById('vista-previa');
    elFeedbackPractica = document.getElementById('feedback-practica');
    elNextPracticaBtn = document.getElementById('next-practica-btn');
    elNumeroPractica = document.getElementById('numero-practica');
    elBtnAccion = document.getElementById('btn-accion');
    elControlesPractica = document.getElementById('controles-practica');
    elMensajeExito = document.getElementById('mensaje-exito');
    elTextoSolucion = document.getElementById('texto-solucion');

    if (elBtnAccion) {
        elBtnAccion.addEventListener('click', manejarBoton);
    }

    elOperacionBtns = document.querySelectorAll('.operacion-btn');

    elOperacionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Si hay operación pendiente, no permitir cambiar
            if (practicaState.operacionPendiente) return;
            elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
            actualizarVistaPrevia();
        });
    });

    elNumeroPractica.addEventListener('input', () => {
        if (practicaState.operacionPendiente) return;
        actualizarVistaPrevia();
    });

    if (window.jugador) {
        elNombre.textContent = window.jugador.nombre || 'Jugador';
        puntuacion = window.jugador.juegos?.incognita?.puntuacion || 0;
        racha = window.jugador.juegos?.incognita?.racha || 0;
        if (elPuntuacion) elPuntuacion.textContent = puntuacion;
        if (elRachaAlt) elRachaAlt.textContent = racha;
    }

    document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
    document.getElementById('mode-practica').addEventListener('click', () => cambiarModo('practica'));

    if (elNextPracticaBtn) {
        elNextPracticaBtn.addEventListener('click', () => {
            iniciarPractica();
        });
    }

    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });

    cambiarModo('alternativas');
}

// ---------- Esperar a common.js ----------
function esperarJugador() {
    if (window.jugador) {
        iniciarJuego();
    } else {
        setTimeout(esperarJugador, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.jugador) {
        iniciarJuego();
    } else {
        esperarJugador();
    }
});
