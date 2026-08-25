// ---------- Configuración ----------
let uid = null;
let jugador = null;
let modoActual = 'alternativas'; // 'alternativas' o 'arrastrar'
let racha = 0;
let preguntaActual = null;
let puntuacion = 0;

// Elementos del DOM
const elNombre = document.getElementById('player-name');
const elPuntuacion = document.getElementById('player-score');

// Modo Alternativas
const elPreguntaAlt = document.getElementById('pregunta-enunciado-alt');
const elOpcionesAlt = document.getElementById('opciones-container-alt');
const elFeedbackAlt = document.getElementById('feedback-message-alt');
const elRachaAlt = document.getElementById('racha-actual-alt');

// Modo Arrastrar
const elEquationDisplay = document.getElementById('equation-display');
const elNumberPool = document.getElementById('number-pool');
const elFeedbackDrag = document.getElementById('feedback-drag');
const elCheckDragBtn = document.getElementById('check-drag-btn');
const elNextDragBtn = document.getElementById('next-drag-btn');

// ---------- Generación de preguntas (ecuaciones lineales) ----------
function generarEcuacionLineal() {
    // Genera una ecuación de la forma ax + b = c
    const a = Math.floor(Math.random() * 4) + 1; // 1-4
    const b = Math.floor(Math.random() * 10) - 5; // -5 a 4
    const x = Math.floor(Math.random() * 10) - 5; // -5 a 4
    const c = a * x + b;
    
    // Asegurar que la solución sea entera
    return { a, b, c, x };
}

function generarPreguntaAlternativas() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    
    let enunciado;
    if (b === 0) {
        enunciado = `${a}x = ${c}`;
    } else if (b > 0) {
        enunciado = `${a}x + ${b} = ${c}`;
    } else {
        enunciado = `${a}x - ${Math.abs(b)} = ${c}`;
    }
    
    // Generar opciones (1 correcta, 3 incorrectas)
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

function generarPreguntaArrastrar() {
    const eq = generarEcuacionLineal();
    const { a, b, c, x } = eq;
    
    // Crear la ecuación con espacios para arrastrar
    // Formato: [a]x + [b] = [c], donde el usuario debe arrastrar a, b, c o x
    // Vamos a pedir que arrastren el valor de x
    
    let enunciado;
    if (b === 0) {
        enunciado = `${a}x = ${c}`;
    } else if (b > 0) {
        enunciado = `${a}x + ${b} = ${c}`;
    } else {
        enunciado = `${a}x - ${Math.abs(b)} = ${c}`;
    }
    
    // Los números que el usuario puede arrastrar: a, b, c, y algunos distractores
    const numerosBase = [a, b, c];
    const distractores = [];
    for (let i = 0; i < 3; i++) {
        let d;
        do {
            d = Math.floor(Math.random() * 12) - 5;
        } while (numerosBase.includes(d) || distractores.includes(d));
        distractores.push(d);
    }
    const pool = mezclarArray([...numerosBase, ...distractores]);
    
    // Determinar qué número falta (el que debe ir en el slot)
    // En este caso, pedimos que arrastren el valor de x
    const slots = [
        { id: 'x', label: 'x = ?', correcto: x }
    ];
    
    return {
        enunciado,
        slots,
        pool,
        respuestaCorrecta: x,
        x: x
    };
}

// ---------- Utilidades ----------
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- Modo Alternativas ----------
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
    
    // Guardar progreso
    guardarProgreso(esCorrecta);
    
    setTimeout(nuevaPreguntaAlternativas, 1600);
}

// ---------- Modo Arrastrar ----------
let dragState = {
    slots: [],
    pool: [],
    colocados: {}
};

function nuevaPreguntaArrastrar() {
    const pregunta = generarPreguntaArrastrar();
    preguntaActual = pregunta;
    dragState.slots = pregunta.slots;
    dragState.pool = pregunta.pool;
    dragState.colocados = {};
    
    elFeedbackDrag.textContent = '';
    elFeedbackDrag.className = 'feedback-drag';
    elNextDragBtn.style.display = 'none';
    elCheckDragBtn.style.display = 'block';
    
    // Renderizar ecuación con slots
    let html = '';
    // Mostrar la ecuación con un slot para x
    const partes = pregunta.enunciado.split('=');
    html += `<span>${partes[0]} = </span>`;
    html += `<span class="slot" id="slot-x" data-slot="x">?</span>`;
    elEquationDisplay.innerHTML = html;
    
    // Renderizar pool de números
    elNumberPool.innerHTML = '';
    dragState.pool.forEach((num, index) => {
        const tile = document.createElement('div');
        tile.className = 'number-tile';
        tile.textContent = num;
        tile.draggable = true;
        tile.dataset.value = num;
        tile.dataset.index = index;
        
        tile.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                value: num,
                index: index
            }));
            tile.classList.add('dragging');
        });
        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
        });
        
        elNumberPool.appendChild(tile);
    });
    
    // Configurar slot para drop
    const slot = document.getElementById('slot-x');
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
        const valor = data.value;
        const index = data.index;
        
        // Verificar si ya hay un número en el slot
        if (dragState.colocados['x']) {
            // Devolver el número anterior al pool
            const anterior = dragState.colocados['x'];
            const tileAnterior = elNumberPool.querySelector(`[data-value="${anterior}"]`);
            if (tileAnterior) {
                tileAnterior.classList.remove('placed');
                tileAnterior.style.display = '';
            }
        }
        
        // Colocar el nuevo número
        const tile = elNumberPool.querySelector(`[data-value="${valor}"]`);
        if (tile) {
            tile.classList.add('placed');
            tile.style.display = 'none';
        }
        
        dragState.colocados['x'] = valor;
        slot.textContent = valor;
        slot.classList.add('filled');
    });
}

function verificarArrastrar() {
    const valorColocado = dragState.colocados['x'];
    if (valorColocado === undefined) {
        elFeedbackDrag.textContent = '⚠️ Arrastra un número al espacio vacío primero.';
        elFeedbackDrag.className = 'feedback-drag error';
        return;
    }
    
    const esCorrecta = valorColocado === preguntaActual.respuestaCorrecta;
    
    if (esCorrecta) {
        racha++;
        puntuacion += 10 + Math.min(racha, 5) * 2;
        elFeedbackDrag.textContent = `✅ ¡Correcto! x = ${preguntaActual.respuestaCorrecta}`;
        elFeedbackDrag.className = 'feedback-drag success';
        elCheckDragBtn.style.display = 'none';
        elNextDragBtn.style.display = 'block';
    } else {
        racha = 0;
        elFeedbackDrag.textContent = `❌ Casi. La respuesta correcta era x = ${preguntaActual.respuestaCorrecta}`;
        elFeedbackDrag.className = 'feedback-drag error';
        // Permitir reintentar
    }
    
    elRachaAlt.textContent = racha;
    elPuntuacion.textContent = puntuacion;
    guardarProgreso(esCorrecta);
}

// ---------- Guardar progreso ----------
async function guardarProgreso(acerto) {
    if (!uid) return;
    try {
        // Guardar en una subcolección o en el documento principal
        const ref = db.collection('usuarios').doc(uid);
        await ref.update({
            [`juegos.incognita.puntuacion`]: puntuacion,
            [`juegos.incognita.racha`]: racha,
            [`juegos.incognita.ultimaJugada`]: new Date().toISOString()
        });
        // También actualizar XP total
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
    document.getElementById('modo-arrastrar').style.display = modo === 'arrastrar' ? 'block' : 'none';
    
    document.getElementById('mode-alternativas').classList.toggle('active', modo === 'alternativas');
    document.getElementById('mode-arrastrar').classList.toggle('active', modo === 'arrastrar');
    
    if (modo === 'alternativas') {
        nuevaPreguntaAlternativas();
    } else {
        nuevaPreguntaArrastrar();
    }
}

// ---------- Event listeners ----------
document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
document.getElementById('mode-arrastrar').addEventListener('click', () => cambiarModo('arrastrar'));
elCheckDragBtn.addEventListener('click', verificarArrastrar);
elNextDragBtn.addEventListener('click', () => {
    nuevaPreguntaArrastrar();
    elNextDragBtn.style.display = 'none';
    elCheckDragBtn.style.display = 'block';
});

// Cerrar sesión
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
    
    // Iniciar con el modo alternativas
    cambiarModo('alternativas');
});
