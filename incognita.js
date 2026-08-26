// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0;

// Elementos del DOM
let elNombre, elPuntuacion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elPasosConfirmados, elVistaPrevia, elFeedbackPractica, elNextPracticaBtn;
let elNumeroPractica, elBtnOperar, elOperacionBtns;

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
    pasoActual: 0,        // índice del último paso confirmado (0 = original)
    eq: null
};

// ---------- Funciones auxiliares para aplicar operaciones ----------
function aplicarOperacion(ecuacion, op, num) {
    let { a, b, c } = ecuacion;
    switch (op) {
        case 'sumar':
            return { a, b: b + num, c: c + num };
        case 'restar':
            return { a, b: b - num, c: c - num };
        case 'multiplicar':
            return { a: a * num, b: b * num, c: c * num };
        case 'dividir':
            return { a: a / num, b: b / num, c: c / num };
        default:
            return { a, b, c };
    }
}

// ---------- Iniciar práctica ----------
function iniciarPractica() {
    const eq = generarEcuacionLineal();
    practicaState.eq = eq;
    practicaState.pasos = generarPasos(eq.a, eq.b, eq.c, eq.x);
    practicaState.pasoActual = 0; // la original ya está confirmada

    // Limpiar feedback y ocultar siguiente
    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
    }
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';

    // Mostrar la ecuación original en el área de pasos confirmados
    mostrarPasosConfirmados();

    // Limpiar vista previa
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'none';
        elVistaPrevia.innerHTML = '';
    }

    // Resetear controles
    resetearControles();

    // Habilitar controles
    elOperacionBtns.forEach(btn => btn.disabled = false);
    elNumeroPractica.disabled = false;
    elBtnOperar.disabled = true;
}

function mostrarPasosConfirmados() {
    if (!elPasosConfirmados) return;
    elPasosConfirmados.innerHTML = '';
    // Mostrar todos los pasos confirmados (desde 0 hasta pasoActual inclusive)
    for (let i = 0; i <= practicaState.pasoActual; i++) {
        const paso = practicaState.pasos[i];
        if (!paso) continue;
        const div = document.createElement('div');
        div.className = 'ecuacion-linea paso-confirmado';
        div.textContent = paso.texto;
        elPasosConfirmados.appendChild(div);
    }
}

function resetearControles() {
    // Desmarcar operaciones
    elOperacionBtns.forEach(btn => btn.classList.remove('seleccionado'));
    elNumeroPractica.value = '';
    elBtnOperar.disabled = true;
    // Ocultar vista previa
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'none';
        elVistaPrevia.innerHTML = '';
    }
}

// ---------- Actualizar vista previa ----------
function actualizarVistaPrevia() {
    // Obtener operación seleccionada
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) {
        // No hay operación seleccionada, ocultar vista previa
        if (elVistaPrevia) {
            elVistaPrevia.style.display = 'none';
            elVistaPrevia.innerHTML = '';
        }
        elBtnOperar.disabled = true;
        return;
    }
    const operacion = opSeleccionada.dataset.op;

    // Obtener número
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) {
        if (elVistaPrevia) {
            elVistaPrevia.style.display = 'none';
            elVistaPrevia.innerHTML = '';
        }
        elBtnOperar.disabled = true;
        return;
    }

    // Obtener la ecuación actual (la última confirmada)
    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') {
        elBtnOperar.disabled = true;
        return;
    }

    // Aplicar operación
    const nuevaEcuacion = aplicarOperacion(ecuacionActual, operacion, num);
    const textoNuevo = formatearEcuacion(nuevaEcuacion.a, nuevaEcuacion.b, nuevaEcuacion.c);

    // Mostrar vista previa
    if (elVistaPrevia) {
        elVistaPrevia.style.display = 'block';
        elVistaPrevia.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'ecuacion-linea vista-previa';
        div.textContent = textoNuevo;
        elVistaPrevia.appendChild(div);
    }

    // Habilitar botón Operar
    elBtnOperar.disabled = false;
}

// ---------- Operar (validar y aplicar paso) ----------
function operar() {
    // Obtener operación seleccionada
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) {
        mostrarFeedbackPractica('Selecciona una operación.', 'error');
        return;
    }
    const operacion = opSeleccionada.dataset.op;

    // Obtener número
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) {
        mostrarFeedbackPractica('Ingresa un número positivo.', 'error');
        return;
    }

    // Verificar si ya estamos en la solución
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        mostrarFeedbackPractica('Ya has resuelto la ecuación.', 'error');
        return;
    }

    // El paso esperado es el siguiente (pasoActual + 1)
    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    if (!pasoEsperado) {
        mostrarFeedbackPractica('No hay más pasos.', 'error');
        return;
    }

    // Validar
    let esCorrecto = false;
    if (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir') {
        esCorrecto = (operacion === pasoEsperado.operacion && num === pasoEsperado.valor);
    } else if (pasoEsperado.tipo === 'solucion') {
        // No debería llegar aquí porque la solución no tiene operación
        esCorrecto = false;
    }

    if (esCorrecto) {
        // Avanzar al siguiente paso (confirmar)
        practicaState.pasoActual++;
        // Mostrar los pasos confirmados actualizados
        mostrarPasosConfirmados();
        // Limpiar vista previa y controles
        resetearControles();
        mostrarFeedbackPractica('✅ ¡Bien hecho!', 'exito');

        // Verificar si hemos llegado a la solución
        if (practicaState.pasoActual === practicaState.pasos.length - 1) {
            // Solución alcanzada
            const solucion = practicaState.pasos[practicaState.pasoActual];
            if (elFeedbackPractica) {
                elFeedbackPractica.textContent = `🎉 Felicitaciones, has descubierto la incógnita: ${solucion.texto}`;
                elFeedbackPractica.className = 'feedback feedback-exito';
                elFeedbackPractica.classList.remove('hidden');
            }
            // Deshabilitar controles
            elOperacionBtns.forEach(btn => btn.disabled = true);
            elNumeroPractica.disabled = true;
            elBtnOperar.disabled = true;
            // Mostrar botón siguiente
            if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        } else {
            // Habilitar controles para el siguiente paso
            elOperacionBtns.forEach(btn => btn.disabled = false);
            elNumeroPractica.disabled = false;
            elBtnOperar.disabled = true;
        }
    } else {
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Revisa la pista.', 'error');
    }
}

function mostrarFeedbackPractica(mensaje, tipo) {
    if (!elFeedbackPractica) return;
    elFeedbackPractica.textContent = mensaje;
    elFeedbackPractica.className = 'feedback';
    if (tipo === 'exito') elFeedbackPractica.classList.add('feedback-exito');
    else if (tipo === 'error') elFeedbackPractica.classList.add('feedback-error');
    elFeedbackPractica.classList.remove('hidden');
    setTimeout(() => elFeedbackPractica.classList.add('hidden'), 2500);
}

// ---------- Modo Alternativas (sin cambios) ----------
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
    // Referencias
    elNombre = document.getElementById('player-name');
    elPuntuacion = document.getElementById('player-score');
    elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
    elOpcionesAlt = document.getElementById('opciones-container-alt');
    elFeedbackAlt = document.getElementById('feedback-message-alt');
    elRachaAlt = document.getElementById('racha-actual-alt');
    elPasosConfirmados = document.getElementById('pasos-confirmados');
    elVistaPrevia = document.getElementById('vista-previa');
    elFeedbackPractica = document.getElementById('feedback-practica');
    elNextPracticaBtn = document.getElementById('next-practica-btn');
    elNumeroPractica = document.getElementById('numero-practica');
    elBtnOperar = document.getElementById('btn-operar');

    if (!elBtnOperar) {
        console.error('❌ No se encontró el botón "Operar"');
    } else {
        elBtnOperar.addEventListener('click', operar);
    }

    elOperacionBtns = document.querySelectorAll('.operacion-btn');

    // Eventos para actualizar vista previa
    elOperacionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
            actualizarVistaPrevia();
        });
    });

    elNumeroPractica.addEventListener('input', actualizarVistaPrevia);

    // Cargar datos del jugador
    if (window.jugador) {
        elNombre.textContent = window.jugador.nombre || 'Jugador';
        puntuacion = window.jugador.juegos?.incognita?.puntuacion || 0;
        racha = window.jugador.juegos?.incognita?.racha || 0;
        if (elPuntuacion) elPuntuacion.textContent = puntuacion;
        if (elRachaAlt) elRachaAlt.textContent = racha;
    }

    // Eventos de modo
    document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
    document.getElementById('mode-practica').addEventListener('click', () => cambiarModo('practica'));

    // Siguiente ecuación
    if (elNextPracticaBtn) {
        elNextPracticaBtn.addEventListener('click', () => {
            iniciarPractica();
        });
    }

    // Salir
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
