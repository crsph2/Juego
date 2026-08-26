// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0;

// Elementos del DOM
let elNombre, elPuntuacion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elEcuacionActual, elPasosRealizados, elFeedbackPractica, elNextPracticaBtn;
let elNumeroPractica, elAplicarPasoBtn, elOperacionBtns;

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
    pasoActual: 0,
    eq: null
};

function iniciarPractica() {
    const eq = generarEcuacionLineal();
    practicaState.eq = eq;
    practicaState.pasos = generarPasos(eq.a, eq.b, eq.c, eq.x);
    practicaState.pasoActual = 0;

    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
    }
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';
    if (elOperacionBtns) {
        elOperacionBtns.forEach(btn => btn.disabled = false);
    }
    if (elNumeroPractica) elNumeroPractica.disabled = false;
    if (elAplicarPasoBtn) elAplicarPasoBtn.disabled = false;

    mostrarPasoActual();
    actualizarHistorial();
}

function mostrarPasoActual() {
    if (!elEcuacionActual) return;
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso) return;

    elEcuacionActual.innerHTML = '';

    if (paso.tipo === 'original') {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        div.textContent = paso.texto;
        elEcuacionActual.appendChild(div);
        const hint = document.createElement('div');
        hint.className = 'hint-text';
        hint.textContent = 'Aplica el primer paso para despejar la incógnita.';
        elEcuacionActual.appendChild(hint);
    } else if (paso.tipo === 'mover_constante' || paso.tipo === 'dividir') {
        const pasoAnterior = practicaState.pasos[practicaState.pasoActual - 1];
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        div.textContent = pasoAnterior.texto;
        elEcuacionActual.appendChild(div);
        const pista = document.createElement('div');
        pista.className = 'hint-text';
        let opTexto = '';
        if (paso.tipo === 'mover_constante') {
            opTexto = (paso.operacion === 'restar') ? `restar ${paso.valor}` : `sumar ${paso.valor}`;
        } else if (paso.tipo === 'dividir') {
            opTexto = `dividir entre ${paso.valor}`;
        }
        pista.textContent = `👉 El siguiente paso es ${opTexto} en ambos lados.`;
        elEcuacionActual.appendChild(pista);
    } else if (paso.tipo === 'solucion') {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        div.style.color = '#22c55e';
        div.textContent = paso.texto;
        elEcuacionActual.appendChild(div);
        if (elFeedbackPractica) {
            elFeedbackPractica.textContent = '🎉 ¡Has resuelto la ecuación!';
            elFeedbackPractica.className = 'feedback feedback-exito';
            elFeedbackPractica.classList.remove('hidden');
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        if (elOperacionBtns) {
            elOperacionBtns.forEach(btn => btn.disabled = true);
        }
        if (elNumeroPractica) elNumeroPractica.disabled = true;
        if (elAplicarPasoBtn) elAplicarPasoBtn.disabled = true;
    }
}

function actualizarHistorial() {
    if (!elPasosRealizados) return;
    elPasosRealizados.innerHTML = '';
    for (let i = 1; i < practicaState.pasoActual; i++) {
        const p = practicaState.pasos[i];
        if (p.tipo === 'solucion') continue;
        const div = document.createElement('div');
        div.className = 'paso-realizado';
        div.textContent = p.texto;
        elPasosRealizados.appendChild(div);
    }
}

// ---------- Aplicar paso (con depuración) ----------
function aplicarPaso() {
    console.log('Aplicar paso ejecutado'); // <-- LOG DE DEPURACIÓN

    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso || paso.tipo === 'original' || paso.tipo === 'solucion') {
        console.warn('Paso no válido:', paso);
        return;
    }

    // Obtener operación seleccionada
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) {
        mostrarFeedbackPractica('Selecciona una operación primero.', 'error');
        return;
    }
    const operacion = opSeleccionada.dataset.op;

    // Obtener número
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) {
        mostrarFeedbackPractica('Ingresa un número positivo.', 'error');
        return;
    }

    // Validar
    let esCorrecto = false;
    if (paso.tipo === 'mover_constante') {
        esCorrecto = (operacion === paso.operacion && num === paso.valor);
    } else if (paso.tipo === 'dividir') {
        esCorrecto = (operacion === paso.operacion && num === paso.valor);
    }

    console.log('Validación:', { operacion, num, esperadoOperacion: paso.operacion, esperadoValor: paso.valor, esCorrecto });

    if (esCorrecto) {
        practicaState.pasoActual++;
        actualizarHistorial();
        mostrarPasoActual();
        mostrarFeedbackPractica('✅ ¡Bien hecho!', 'exito');
        document.querySelectorAll('.operacion-btn').forEach(b => b.classList.remove('seleccionado'));
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
    elEcuacionActual = document.getElementById('ecuacion-actual');
    elPasosRealizados = document.getElementById('pasos-realizados');
    elFeedbackPractica = document.getElementById('feedback-practica');
    elNextPracticaBtn = document.getElementById('next-practica-btn');
    elNumeroPractica = document.getElementById('numero-practica');

    // Búsqueda robusta del botón "Aplicar paso"
    elAplicarPasoBtn = document.getElementById('aplicar-paso-btn');
    if (!elAplicarPasoBtn) {
        // Fallback: buscar por querySelector
        elAplicarPasoBtn = document.querySelector('#aplicar-paso-btn, #aplicar-paso, button[text="Aplicar paso"]');
    }
    if (!elAplicarPasoBtn) {
        console.error('❌ No se encontró el botón "Aplicar paso"');
    } else {
        console.log('✅ Botón "Aplicar paso" encontrado');
        elAplicarPasoBtn.addEventListener('click', aplicarPaso);
    }

    elOperacionBtns = document.querySelectorAll('.operacion-btn');

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

    // Selección de operación
    elOperacionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
        });
    });

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
