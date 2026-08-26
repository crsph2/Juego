// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

// ---------- Configuración ----------
let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0;

// ---------- Elementos del DOM (se asignan al iniciar) ----------
let elNombre, elPuntuacion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elEcuacionActual, elPasosRealizados, elNumberPoolPractica, elFeedbackPractica, elNextPracticaBtn;

// ---------- Generación de ecuaciones lineales ----------
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

// ---------- Generación de pasos para práctica ----------
function generarPasos(a, b, c, x) {
    const pasos = [];
    pasos.push({ tipo: 'original', texto: formatearEcuacion(a, b, c) });

    if (b !== 0) {
        const op = b > 0 ? 'restar' : 'sumar';
        const valor = Math.abs(b);
        const nuevoB = 0;
        const nuevoC = c - b;
        pasos.push({
            tipo: 'mover_constante',
            operacion: op,
            valor: valor,
            a: a,
            b: nuevoB,
            c: nuevoC,
            texto: formatearEcuacion(a, nuevoB, nuevoC)
        });
        b = nuevoB;
        c = nuevoC;
    }

    if (a !== 1) {
        const valor = a;
        const nuevoA = 1;
        const nuevoC = c / a;
        pasos.push({
            tipo: 'dividir',
            valor: valor,
            a: nuevoA,
            b: b,
            c: nuevoC,
            texto: formatearEcuacion(nuevoA, b, nuevoC)
        });
        a = nuevoA;
        c = nuevoC;
    }

    pasos.push({ tipo: 'solucion', x: x, texto: 'x = ' + x });
    return pasos;
}

// ---------- Estado de práctica ----------
let practicaState = {
    pasos: [],
    pasoActual: 0,
    ecuacionOriginal: '',
    numerosUsados: [],
    intentos: 0,
    eq: null
};

function iniciarPractica() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    practicaState.pasos = generarPasos(a, b, c, x);
    practicaState.pasoActual = 0;
    practicaState.numerosUsados = [];
    practicaState.intentos = 0;
    practicaState.eq = eq;

    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
    }
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';

    mostrarPasoActual();
    generarPoolNumeros();
}

function mostrarPasoActual() {
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso) return;

    if (elEcuacionActual) elEcuacionActual.innerHTML = '';
    if (elPasosRealizados) elPasosRealizados.innerHTML = '';

    if (paso.tipo === 'original') {
        if (elEcuacionActual) {
            elEcuacionActual.innerHTML = `<div class="ecuacion-linea">${paso.texto}</div>`;
            const hint = document.createElement('div');
            hint.className = 'hint-text';
            hint.textContent = 'Resuelve la ecuación paso a paso. Arrastra el número correcto.';
            elEcuacionActual.appendChild(hint);
        }
    } else if (paso.tipo === 'mover_constante' || paso.tipo === 'dividir') {
        const linea = document.createElement('div');
        linea.className = 'ecuacion-linea';
        const pasoAnterior = practicaState.pasos[practicaState.pasoActual - 1];
        let html = `<span>${pasoAnterior.texto}</span>`;
        let opTexto = '';
        if (paso.tipo === 'mover_constante') {
            opTexto = (paso.operacion === 'restar') ? ` - ${paso.valor}` : ` + ${paso.valor}`;
        } else if (paso.tipo === 'dividir') {
            opTexto = ` ÷ ${paso.valor}`;
        }
        html += `<span style="color: #fbbf24; margin: 0 10px;">→</span>`;
        html += `<span class="slot-practica" id="slot-practica" data-paso="${practicaState.pasoActual}">?</span>`;
        html += `<span style="color: #94a3b8; font-size: 0.8rem; margin-left: 5px;">(${opTexto})</span>`;
        linea.innerHTML = html;
        if (elEcuacionActual) elEcuacionActual.appendChild(linea);

        const slot = document.getElementById('slot-practica');
        if (slot) {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                verificarNumeroArrastrado(data.valor, paso);
            });
        }
    } else if (paso.tipo === 'solucion') {
        if (elEcuacionActual) {
            elEcuacionActual.innerHTML = `<div class="ecuacion-linea" style="color: #22c55e;">${paso.texto}</div>`;
        }
        if (elFeedbackPractica) {
            elFeedbackPractica.textContent = '🎉 ¡Has resuelto la ecuación!';
            elFeedbackPractica.className = 'feedback feedback-exito';
            elFeedbackPractica.classList.remove('hidden');
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
    }

    // Mostrar pasos ya realizados
    for (let i = 0; i < practicaState.pasoActual; i++) {
        const p = practicaState.pasos[i];
        if (p.tipo === 'original') continue;
        const div = document.createElement('div');
        div.className = 'paso-realizado';
        div.textContent = p.texto;
        if (elPasosRealizados) elPasosRealizados.appendChild(div);
    }
}

function generarPoolNumeros() {
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso || paso.tipo === 'original' || paso.tipo === 'solucion') {
        if (elNumberPoolPractica) elNumberPoolPractica.innerHTML = '';
        return;
    }

    let correcto;
    if (paso.tipo === 'mover_constante') correcto = paso.valor;
    else if (paso.tipo === 'dividir') correcto = paso.valor;

    const eq = practicaState.eq;
    const posibles = [eq.a, eq.b, eq.c, eq.x, Math.abs(eq.a), Math.abs(eq.b), Math.abs(eq.c), Math.abs(eq.x)];
    const distractores = new Set();
    for (let i = 0; i < 4; i++) {
        let num = Math.floor(Math.random() * 8) + 1;
        if (num !== correcto && !distractores.has(num) && !posibles.includes(num)) {
            distractores.add(num);
        }
    }
    while (distractores.size < 3) {
        let num = Math.floor(Math.random() * 8) + 1;
        if (num !== correcto && !distractores.has(num)) {
            distractores.add(num);
        }
    }

    const pool = mezclarArray([correcto, ...Array.from(distractores)]);
    if (elNumberPoolPractica) {
        elNumberPoolPractica.innerHTML = '';
        pool.forEach((num) => {
            const tile = document.createElement('div');
            tile.className = 'number-tile';
            tile.textContent = num;
            tile.draggable = true;
            tile.dataset.value = num;
            tile.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ valor: num }));
            });
            elNumberPoolPractica.appendChild(tile);
        });
    }
}

function verificarNumeroArrastrado(numero, paso) {
    let correcto;
    if (paso.tipo === 'mover_constante') correcto = paso.valor;
    else if (paso.tipo === 'dividir') correcto = paso.valor;

    const slot = document.getElementById('slot-practica');
    if (numero === correcto) {
        practicaState.pasoActual++;
        if (slot) {
            slot.textContent = numero;
            slot.classList.add('filled');
        }
        if (elFeedbackPractica) {
            elFeedbackPractica.textContent = '✅ ¡Correcto!';
            elFeedbackPractica.className = 'feedback feedback-exito';
            elFeedbackPractica.classList.remove('hidden');
        }
        setTimeout(() => {
            mostrarPasoActual();
            generarPoolNumeros();
            if (elFeedbackPractica) elFeedbackPractica.classList.add('hidden');
        }, 800);
    } else {
        if (elFeedbackPractica) {
            elFeedbackPractica.textContent = '❌ Número incorrecto. Intenta de nuevo.';
            elFeedbackPractica.className = 'feedback feedback-error';
            elFeedbackPractica.classList.remove('hidden');
        }
        if (slot) {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
        setTimeout(() => {
            if (elFeedbackPractica) elFeedbackPractica.classList.add('hidden');
        }, 1500);
    }
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

// ---------- Guardar progreso ----------
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

// ---------- Utilidades ----------
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

// ---------- Inicialización del juego ----------
function iniciarJuego() {
    // Asignar referencias a elementos del DOM
    elNombre = document.getElementById('player-name');
    elPuntuacion = document.getElementById('player-score');
    elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
    elOpcionesAlt = document.getElementById('opciones-container-alt');
    elFeedbackAlt = document.getElementById('feedback-message-alt');
    elRachaAlt = document.getElementById('racha-actual-alt');
    elEcuacionActual = document.getElementById('ecuacion-actual');
    elPasosRealizados = document.getElementById('pasos-realizados');
    elNumberPoolPractica = document.getElementById('number-pool-practica');
    elFeedbackPractica = document.getElementById('feedback-practica');
    elNextPracticaBtn = document.getElementById('next-practica-btn');

    // Cargar datos del jugador desde window.jugador
    if (window.jugador) {
        elNombre.textContent = window.jugador.nombre || 'Jugador';
        puntuacion = window.jugador.juegos?.incognita?.puntuacion || 0;
        racha = window.jugador.juegos?.incognita?.racha || 0;
        if (elPuntuacion) elPuntuacion.textContent = puntuacion;
        if (elRachaAlt) elRachaAlt.textContent = racha;
    }

    // Configurar eventos de los botones de modo
    const btnAlt = document.getElementById('mode-alternativas');
    const btnPract = document.getElementById('mode-practica');
    if (btnAlt) btnAlt.addEventListener('click', () => cambiarModo('alternativas'));
    if (btnPract) btnPract.addEventListener('click', () => cambiarModo('practica'));

    if (elNextPracticaBtn) {
        elNextPracticaBtn.addEventListener('click', () => {
            iniciarPractica();
        });
    }

    // Botón de salir (ya existe en el HTML)
    const btnSalir = document.getElementById('btn-logout');
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            if (confirm('¿Seguro que quieres cerrar sesión?')) {
                await firebase.auth().signOut();
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }

    // Iniciar en modo alternativas por defecto
    cambiarModo('alternativas');
}

// ---------- Esperar a que common.js cargue el jugador ----------
function esperarJugador() {
    if (window.jugador) {
        iniciarJuego();
    } else {
        setTimeout(esperarJugador, 100);
    }
}

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.jugador) {
        iniciarJuego();
    } else {
        esperarJugador();
    }
});
