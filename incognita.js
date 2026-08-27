// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

const XP_POR_NIVEL = 100;

const REGIONES = [
    { minNivel: 1, nombre: "Aldea de las Ecuaciones" },
    { minNivel: 2, nombre: "Aldea de las Ecuaciones" },
    { minNivel: 5, nombre: "Aldea de las Ecuaciones" },
    { minNivel: 9, nombre: "Aldea de las Ecuaciones" },
    { minNivel: 13, nombre: "Aldea de las Ecuaciones" }
];

function regionParaNivel(nivel) {
    let region = REGIONES[0].nombre;
    for (const r of REGIONES) {
        if (nivel >= r.minNivel) region = r.nombre;
    }
    return region;
}

let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0; // solo para mostrar, no se usa para nivel
let feedbackTimeout = null;

// Elementos del DOM
let elNombre, elNivel, elMonedas, elXpBarra, elXpTexto, elRegion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elHistorialPasos, elFeedbackPractica, elNextPracticaBtn;
let elNumeroPractica, elBtnAccion, elOperacionBtns;
let elControlesPractica, elMensajeExito, elTextoSolucion;

// ---------- Generación de ecuaciones (siempre con b != 0) ----------
function generarEcuacionLineal() {
    let a, b, c, x;
    do {
        a = Math.floor(Math.random() * 4) + 1;
        b = Math.floor(Math.random() * 10) - 5;
    } while (b === 0);
    x = Math.floor(Math.random() * 10) - 5;
    c = a * x + b;
    return { a, b, c, x };
}

function formatearEcuacion(a, b, c, letra = 'x') {
    let left = '';
    if (a === 1) left = letra;
    else if (a === -1) left = '-' + letra;
    else left = a + letra;
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

    pasos.push({ tipo: 'solucion', x, texto: formatearEcuacion(1, 0, x) });
    return pasos;
}

// ---------- Estado de práctica ----------
let practicaState = {
    pasos: [],
    pasoActual: 0,
    historialLineas: [],
    operacionPendiente: null,
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

function formatearEcuacionConOperacion(original, op, num) {
    const textoOriginal = formatearEcuacion(original.a, original.b, original.c);
    const partes = textoOriginal.split('=');
    if (partes.length !== 2) return textoOriginal;
    let izq = partes[0].trim();
    let der = partes[1].trim();
    if (op === 'sumar' || op === 'restar') {
        const signo = (op === 'sumar') ? '+' : '-';
        izq += ` ${signo} ${num}`;
        der += ` ${signo} ${num}`;
    } else if (op === 'multiplicar') {
        izq += ` · ${num}`;
        der += ` · ${num}`;
    } else if (op === 'dividir') {
        izq += ` ÷ ${num}`;
        der += ` ÷ ${num}`;
    }
    return `${izq} = ${der}`;
}

// ---------- Iniciar práctica ----------
function iniciarPractica() {
    const eq = generarEcuacionLineal();
    practicaState.eq = eq;
    practicaState.pasos = generarPasos(eq.a, eq.b, eq.c, eq.x);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [
        { texto: formatearEcuacion(eq.a, eq.b, eq.c), tipo: 'original' }
    ];

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
    resetearControles();
    actualizarBoton();
}

function mostrarHistorial() {
    if (!elHistorialPasos) return;
    elHistorialPasos.innerHTML = '';
    practicaState.historialLineas.forEach(linea => {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea paso-confirmado';
        if (linea.tipo === 'operacion') {
            div.style.color = '#f2c94c';
            div.style.fontWeight = 'bold';
        } else if (linea.tipo === 'solucion') {
            div.style.color = '#2e7d32';
            div.style.fontWeight = 'bold';
        }
        div.textContent = linea.texto;
        elHistorialPasos.appendChild(div);
    });
}

function resetearControles() {
    elOperacionBtns.forEach(btn => btn.classList.remove('seleccionado'));
    elNumeroPractica.value = '';
    elBtnAccion.disabled = true;
}

function actualizarBoton() {
    if (practicaState.operacionPendiente) {
        elBtnAccion.textContent = 'Confirmar paso';
        elBtnAccion.disabled = false;
        elOperacionBtns.forEach(btn => btn.disabled = true);
        elNumeroPractica.disabled = true;
    } else {
        const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
        const num = parseInt(elNumeroPractica.value);
        const haySeleccion = opSeleccionada && !isNaN(num) && num > 0;
        elBtnAccion.textContent = 'Operar';
        elBtnAccion.disabled = !haySeleccion;
        elOperacionBtns.forEach(btn => btn.disabled = false);
        elNumeroPractica.disabled = false;
    }
}

function manejarBoton() {
    if (practicaState.operacionPendiente) {
        confirmarPaso();
    } else {
        realizarOperacion();
    }
}

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

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        mostrarFeedbackPractica('Ya has resuelto la ecuación.', 'error');
        return;
    }

    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') {
        mostrarFeedbackPractica('No hay más pasos.', 'error');
        return;
    }

    const ecuacionAplicada = aplicarOperacion(ecuacionActual, operacion, num);
    const textoOperacion = formatearEcuacionConOperacion(ecuacionActual, operacion, num);

    practicaState.operacionPendiente = {
        operacion,
        numero: num,
        ecuacionOriginal: ecuacionActual,
        ecuacionAplicada: ecuacionAplicada,
        textoOperacion: textoOperacion
    };

    practicaState.historialLineas.push({ texto: textoOperacion, tipo: 'operacion' });
    mostrarHistorial();
    actualizarBoton();
}

function confirmarPaso() {
    if (!practicaState.operacionPendiente) return;

    const pendiente = practicaState.operacionPendiente;
    const ecuacionAplicada = pendiente.ecuacionAplicada;
    const textoSimplificado = formatearEcuacion(ecuacionAplicada.a, ecuacionAplicada.b, ecuacionAplicada.c);

    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    let esCorrecto = false;
    if (pasoEsperado && (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir')) {
        esCorrecto = (pendiente.operacion === pasoEsperado.operacion && pendiente.numero === pasoEsperado.valor);
    }

    if (!esCorrecto) {
        practicaState.historialLineas.pop();
        practicaState.operacionPendiente = null;
        mostrarHistorial();
        resetearControles();
        actualizarBoton();
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Revisa la pista.', 'error');
        return;
    }

    practicaState.pasoActual++;
    practicaState.historialLineas.push({ texto: textoSimplificado, tipo: 'simplificacion' });
    practicaState.operacionPendiente = null;

    mostrarHistorial();
    resetearControles();

    if (practicaState.pasoActual + 1 < practicaState.pasos.length &&
        practicaState.pasos[practicaState.pasoActual + 1].tipo === 'solucion') {
        practicaState.pasoActual++;
        practicaState.historialLineas.push({
            texto: practicaState.pasos[practicaState.pasoActual].texto,
            tipo: 'solucion'
        });
        mostrarHistorial();

        if (elControlesPractica) elControlesPractica.style.display = 'none';
        if (elMensajeExito) {
            elMensajeExito.style.display = 'block';
            if (elTextoSolucion) {
                elTextoSolucion.textContent = practicaState.pasos[practicaState.pasoActual].texto;
            }
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        elOperacionBtns.forEach(btn => btn.disabled = true);
        elNumeroPractica.disabled = true;
        elBtnAccion.disabled = true;
        if (elFeedbackPractica) {
            elFeedbackPractica.className = 'feedback hidden';
            elFeedbackPractica.textContent = '';
            if (feedbackTimeout) {
                clearTimeout(feedbackTimeout);
                feedbackTimeout = null;
            }
        }
        return;
    }

    actualizarBoton();
    mostrarFeedbackPractica('✅ ¡Bien hecho!', 'exito');
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

// ---------- Modo Alternativas (con niveles) ----------
let preguntaActualAlt = null;
let letraActual = 'x';

function generarPreguntaAlternativas() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    const letras = ['a', 'b', 'c', 'x', 'y', 'z'];
    const letra = letras[Math.floor(Math.random() * letras.length)];
    letraActual = letra;
    const enunciado = `Encuentra la incógnita ${letra} para la siguiente ecuación:`;
    const ecuacion = formatearEcuacion(a, b, c, letra);
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
        enunciado: enunciado,
        ecuacion: ecuacion,
        respuestaCorrecta: correcta,
        opciones: mezclarArray(Array.from(opciones))
    };
}

function nuevaPreguntaAlternativas() {
    preguntaActualAlt = generarPreguntaAlternativas();
    if (elPreguntaAlt) {
        elPreguntaAlt.innerHTML = `${preguntaActualAlt.enunciado}<br><span style="font-weight:400; font-size:1.8rem;">${preguntaActualAlt.ecuacion}</span>`;
    }
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

    let xpGanada = 0;
    let monedasGanadas = 0;

    if (esCorrecta) {
        racha++;
        const bonusRacha = Math.min(racha, 5) * 2;
        xpGanada = 10 + bonusRacha;
        monedasGanadas = 5 + Math.floor(racha / 3);
        btnElegido.classList.add('opcion-correcta');
        if (elFeedbackAlt) {
            elFeedbackAlt.textContent = `✅ ¡Correcto! ${letraActual} = ${preguntaActualAlt.respuestaCorrecta}`;
            elFeedbackAlt.className = 'feedback feedback-exito';
            elFeedbackAlt.classList.remove('hidden');
        }
    } else {
        racha = 0;
        btnElegido.classList.add('opcion-incorrecta');
        if (elFeedbackAlt) {
            elFeedbackAlt.textContent = `❌ Casi. La respuesta correcta era ${letraActual} = ${preguntaActualAlt.respuestaCorrecta}`;
            elFeedbackAlt.className = 'feedback feedback-error';
            elFeedbackAlt.classList.remove('hidden');
        }
    }

    if (elRachaAlt) elRachaAlt.textContent = racha;

    // Actualizar progreso (nivel, XP, monedas, región)
    if (window.jugador && window.uid) {
        const j = window.jugador;
        const nuevoXp = (j.xp || 0) + xpGanada;
        const nuevoNivel = Math.floor(nuevoXp / XP_POR_NIVEL) + 1;
        const subioNivel = nuevoNivel > (j.nivel || 1);

        j.xp = nuevoXp;
        j.monedas = (j.monedas || 0) + monedasGanadas;
        j.nivel = nuevoNivel;
        j.regionActual = regionParaNivel(nuevoNivel);
        j.estadisticas = j.estadisticas || {};
        j.estadisticas.correctas = (j.estadisticas.correctas || 0) + (esCorrecta ? 1 : 0);
        j.estadisticas.incorrectas = (j.estadisticas.incorrectas || 0) + (esCorrecta ? 0 : 1);

        // Guardar en Firestore
        db.collection('usuarios').doc(window.uid).update({
            xp: j.xp,
            monedas: j.monedas,
            nivel: j.nivel,
            regionActual: j.regionActual,
            estadisticas: j.estadisticas,
            historial: firebase.firestore.FieldValue.arrayUnion({
                pregunta: preguntaActualAlt.enunciado + ' ' + preguntaActualAlt.ecuacion,
                correcta: esCorrecta,
                fecha: new Date().toISOString()
            })
        }).catch(error => {
            console.error('Error al guardar progreso:', error);
            if (elFeedbackAlt) {
                elFeedbackAlt.textContent += ' (Error al guardar el progreso)';
            }
        });

        actualizarUI();
        if (subioNivel && elFeedbackAlt) {
            elFeedbackAlt.textContent += ` ¡Subiste a nivel ${j.nivel}!`;
        }
    }

    setTimeout(nuevaPreguntaAlternativas, 1600);
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

// ---------- Inicialización y UI ----------
function actualizarUI() {
    if (!window.jugador) return;
    const j = window.jugador;
    if (elNombre) elNombre.textContent = j.nombre || "Aventurero";
    if (elNivel) elNivel.textContent = j.nivel || 1;
    if (elMonedas) elMonedas.textContent = j.monedas || 0;
    if (elRegion) elRegion.textContent = j.regionActual || "Aldea de las Ecuaciones";
    if (elXpBarra && elXpTexto) {
        const xpEnNivel = (j.xp || 0) % XP_POR_NIVEL;
        elXpBarra.style.width = `${xpEnNivel}%`;
        elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
    }
}

function iniciarJuego() {
    elNombre = document.getElementById('player-name');
    elNivel = document.getElementById('player-level');
    elMonedas = document.getElementById('player-coins');
    elXpBarra = document.getElementById('xp-bar-fill');
    elXpTexto = document.getElementById('xp-text');
    elRegion = document.getElementById('player-region');
    elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
    elOpcionesAlt = document.getElementById('opciones-container-alt');
    elFeedbackAlt = document.getElementById('feedback-message-alt');
    elRachaAlt = document.getElementById('racha-actual-alt');
    elHistorialPasos = document.getElementById('historial-pasos');
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
            if (practicaState.operacionPendiente) return;
            elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
            actualizarBoton();
        });
    });

    elNumeroPractica.addEventListener('input', () => {
        if (practicaState.operacionPendiente) return;
        actualizarBoton();
    });

    if (window.jugador) {
        actualizarUI();
        // Inicializar racha y puntuación desde el jugador (si existe)
        racha = window.jugador.rachaIncognita || 0;
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
