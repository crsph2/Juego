// ---------- Configuración ----------
let uid = null;
let jugador = null;
let modoActual = 'alternativas';
let racha = 0;
let puntuacion = 0;

// ---------- Elementos del DOM ----------
const elNombre = document.getElementById('player-name');
const elPuntuacion = document.getElementById('player-score');

// Modo Alternativas
const elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
const elOpcionesAlt = document.getElementById('opciones-container-alt');
const elFeedbackAlt = document.getElementById('feedback-message-alt');
const elRachaAlt = document.getElementById('racha-actual-alt');

// Modo Práctica paso a paso
const elEcuacionActual = document.getElementById('ecuacion-actual');
const elPasosRealizados = document.getElementById('pasos-realizados');
const elNumberPoolPractica = document.getElementById('number-pool-practica');
const elFeedbackPractica = document.getElementById('feedback-practica');
const elNextPracticaBtn = document.getElementById('next-practica-btn');

// ---------- Generación de ecuaciones lineales ----------
function generarEcuacionLineal() {
    // Genera una ecuación de la forma ax + b = c, con solución entera
    const a = Math.floor(Math.random() * 4) + 1; // 1-4
    const b = Math.floor(Math.random() * 10) - 5; // -5 a 4
    const x = Math.floor(Math.random() * 10) - 5; // -5 a 4
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

// ---------- Generación de pasos para la práctica ----------
function generarPasos(a, b, c, x) {
    const pasos = [];
    // Paso 0: ecuación original
    pasos.push({
        tipo: 'original',
        texto: formatearEcuacion(a, b, c)
    });

    // Paso 1: mover constante (restar o sumar b)
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
        // Actualizar para el siguiente paso
        b = nuevoB;
        c = nuevoC;
    }

    // Paso 2: dividir por a (si a !== 1)
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

    // Paso 3: solución final
    pasos.push({
        tipo: 'solucion',
        x: x,
        texto: 'x = ' + x
    });

    return pasos;
}

// ---------- Estado de la práctica ----------
let practicaState = {
    pasos: [],
    pasoActual: 0,        // índice del paso en el que estamos
    ecuacionOriginal: '', 
    numerosUsados: [],
    intentos: 0
};

function iniciarPractica() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    practicaState.pasos = generarPasos(a, b, c, x);
    practicaState.pasoActual = 0;
    practicaState.numerosUsados = [];
    practicaState.intentos = 0;
    practicaState.eq = eq;

    elFeedbackPractica.className = 'feedback hidden';
    elFeedbackPractica.textContent = '';
    elNextPracticaBtn.style.display = 'none';

    // Mostrar el primer paso (la ecuación original)
    mostrarPasoActual();
    generarPoolNumeros();
}

function mostrarPasoActual() {
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso) return;

    // Limpiar
    elEcuacionActual.innerHTML = '';
    elPasosRealizados.innerHTML = '';

    // Mostrar la ecuación actual con un slot si se necesita arrastrar
    if (paso.tipo === 'original') {
        // Mostrar ecuación original sin slots
        elEcuacionActual.innerHTML = `<div class="ecuacion-linea">${paso.texto}</div>`;
        // Mostrar mensaje de instrucción
        const hint = document.createElement('div');
        hint.className = 'hint-text';
        hint.textContent = 'Resuelve la ecuación paso a paso. Arrastra el número correcto.';
        elEcuacionActual.appendChild(hint);
        // Si no hay siguiente paso? (no debería)
    } else if (paso.tipo === 'mover_constante' || paso.tipo === 'dividir') {
        // Mostrar la ecuación con un slot para el número a arrastrar
        const linea = document.createElement('div');
        linea.className = 'ecuacion-linea';
        
        // Construir la ecuación con un slot
        let html = '';
        const { a, b, c, operacion, valor } = paso;
        // Mostrar la ecuación actual antes de aplicar la operación
        // Obtener la ecuación del paso anterior
        const pasoAnterior = practicaState.pasos[practicaState.pasoActual - 1];
        html += `<span>${pasoAnterior.texto}</span>`;
        // Flecha y operación
        let opTexto = '';
        if (paso.tipo === 'mover_constante') {
            opTexto = (operacion === 'restar') ? ` - ${valor}` : ` + ${valor}`;
        } else if (paso.tipo === 'dividir') {
            opTexto = ` ÷ ${valor}`;
        }
        html += `<span style="color: #fbbf24; margin: 0 10px;">→</span>`;
        // Slot para arrastrar el número (se llenará con drag and drop)
        html += `<span class="slot-practica" id="slot-practica" data-paso="${practicaState.pasoActual}">?</span>`;
        html += `<span style="color: #94a3b8; font-size: 0.8rem; margin-left: 5px;">(${opTexto})</span>`;
        
        linea.innerHTML = html;
        elEcuacionActual.appendChild(linea);

        // Configurar el slot para drag and drop
        const slot = document.getElementById('slot-practica');
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
            const numeroArrastrado = data.valor;
            // Verificar si es el número correcto
            verificarNumeroArrastrado(numeroArrastrado, paso);
        });
    } else if (paso.tipo === 'solucion') {
        // Mostrar solución final
        elEcuacionActual.innerHTML = `<div class="ecuacion-linea" style="color: #22c55e;">${paso.texto}</div>`;
        elFeedbackPractica.textContent = '🎉 ¡Has resuelto la ecuación!';
        elFeedbackPractica.className = 'feedback feedback-exito';
        elFeedbackPractica.classList.remove('hidden');
        elNextPracticaBtn.style.display = 'block';
    }

    // Mostrar los pasos ya realizados (historial)
    for (let i = 0; i < practicaState.pasoActual; i++) {
        const p = practicaState.pasos[i];
        if (p.tipo === 'original') continue;
        const div = document.createElement('div');
        div.className = 'paso-realizado';
        div.textContent = p.texto;
        elPasosRealizados.appendChild(div);
    }
}

function generarPoolNumeros() {
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso || paso.tipo === 'original' || paso.tipo === 'solucion') {
        elNumberPoolPractica.innerHTML = '';
        return;
    }

    // Determinar el número correcto a arrastrar
    let correcto;
    if (paso.tipo === 'mover_constante') {
        correcto = paso.valor;
    } else if (paso.tipo === 'dividir') {
        correcto = paso.valor;
    }

    // Generar distractores (números que no son el correcto)
    const distractores = new Set();
    const eq = practicaState.eq;
    const posibles = [eq.a, eq.b, eq.c, eq.x, Math.abs(eq.a), Math.abs(eq.b), Math.abs(eq.c), Math.abs(eq.x)];
    // Añadir algunos números aleatorios
    for (let i = 0; i < 4; i++) {
        let num = Math.floor(Math.random() * 8) + 1;
        if (num !== correcto && !distractores.has(num) && !posibles.includes(num)) {
            distractores.add(num);
        }
    }
    // Si no hay suficientes distractores, añadir algunos fijos
    while (distractores.size < 3) {
        let num = Math.floor(Math.random() * 8) + 1;
        if (num !== correcto && !distractores.has(num)) {
            distractores.add(num);
        }
    }

    const pool = mezclarArray([correcto, ...Array.from(distractores)]);
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

function verificarNumeroArrastrado(numero, paso) {
    // Verificar si es el número correcto
    let correcto;
    if (paso.tipo === 'mover_constante') {
        correcto = paso.valor;
    } else if (paso.tipo === 'dividir') {
        correcto = paso.valor;
    }

    if (numero === correcto) {
        // Correcto: avanzar al siguiente paso
        practicaState.pasoActual++;
        // Marcar el número como usado (opcional)
        const slot = document.getElementById('slot-practica');
        if (slot) {
            slot.textContent = numero;
            slot.classList.add('filled');
        }
        // Mostrar feedback positivo
        elFeedbackPractica.textContent = '✅ ¡Correcto!';
        elFeedbackPractica.className = 'feedback feedback-exito';
        elFeedbackPractica.classList.remove('hidden');
        // Después de un breve delay, mostrar el siguiente paso
        setTimeout(() => {
            mostrarPasoActual();
            generarPoolNumeros();
            elFeedbackPractica.classList.add('hidden');
        }, 800);
    } else {
        // Incorrecto
        elFeedbackPractica.textContent = '❌ Número incorrecto. Intenta de nuevo.';
        elFeedbackPractica.className = 'feedback feedback-error';
        elFeedbackPractica.classList.remove('hidden');
        // Limpiar el slot
        const slot = document.getElementById('slot-practica');
        if (slot) {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
        // Después de 1.5 segundos, ocultar el error y permitir reintentar
        setTimeout(() => {
            elFeedbackPractica.classList.add('hidden');
        }, 1500);
    }
}

// ---------- Modo Alternativas (sin cambios) ----------
function generarPreguntaAlternativas() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    let enunciado = formatearEcuacion(a, b, c);
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
    preguntaActual = generarPreguntaAlternativas();
    elPreguntaAlt.textContent = preguntaActual.enunciado + ' → x = ?';
    elOpcionesAlt.innerHTML = '';
    elFeedbackAlt.classList.add('hidden');
    elFeedbackAlt.classList.remove('feedback-exito', 'feedback-error');
    preguntaActual.opciones.forEach((opcion) => {
        const btn = document.createElement('button');
        btn.className = 'rpg-button btn-opcion';
        btn.textContent = opcion;
        btn.addEventListener('click', () => responderAlternativa(opcion, btn));
        elOpcionesAlt.appendChild(btn);
    });
}

function responderAlternativa(opcionElegida, btnElegido) {
    [...elOpcionesAlt.children].forEach(b => b.disabled = true);
    const esCorrecta = opcionElegida === preguntaActual.respuestaCorrecta;
    if (esCorrecta) {
        racha++;
        puntuacion += 10 + Math.min(racha, 5) * 2;
        btnElegido.classList.add('opcion-correcta');
        elFeedbackAlt.textContent = '✅ ¡Correcto! x = ' + preguntaActual.respuestaCorrecta;
        elFeedbackAlt.classList.remove('feedback-error');
        elFeedbackAlt.classList.add('feedback-exito');
    } else {
        racha = 0;
        btnElegido.classList.add('opcion-incorrecta');
        elFeedbackAlt.textContent = `❌ Casi. La respuesta correcta era x = ${preguntaActual.respuestaCorrecta}`;
        elFeedbackAlt.classList.remove('feedback-exito');
        elFeedbackAlt.classList.add('feedback-error');
    }
    elFeedbackAlt.classList.remove('hidden');
    elRachaAlt.textContent = racha;
    elPuntuacion.textContent = puntuacion;
    guardarProgreso(esCorrecta);
    setTimeout(nuevaPreguntaAlternativas, 1600);
}

// ---------- Utilidades ----------
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- Guardar progreso ----------
async function guardarProgreso(acerto) {
    if (!uid) return;
    try {
        const ref = db.collection('usuarios').doc(uid);
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

// ---------- Cambio de modo ----------
function cambiarModo(modo) {
    modoActual = modo;
    document.getElementById('modo-alternativas').style.display = modo === 'alternativas' ? 'block' : 'none';
    document.getElementById('modo-practica').style.display = modo === 'practica' ? 'block' : 'none';
    document.getElementById('mode-alternativas').classList.toggle('active', modo === 'alternativas');
    document.getElementById('mode-practica').classList.toggle('active', modo === 'practica');
    if (modo === 'alternativas') {
        nuevaPreguntaAlternativas();
    } else {
        iniciarPractica();
    }
}

// ---------- Event listeners ----------
document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
document.getElementById('mode-practica').addEventListener('click', () => cambiarModo('practica'));
elNextPracticaBtn.addEventListener('click', () => {
    iniciarPractica();
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        await firebase.auth().signOut();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
});

// ---------- Autenticación ----------
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    uid = user.uid;
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) {
        window.location.href = 'index.html';
        return;
    }
    jugador = snap.data();
    elNombre.textContent = jugador.nombre;
    puntuacion = jugador.juegos?.incognita?.puntuacion || 0;
    racha = jugador.juegos?.incognita?.racha || 0;
    elPuntuacion.textContent = puntuacion;
    elRachaAlt.textContent = racha;
    cambiarModo('alternativas');
});
