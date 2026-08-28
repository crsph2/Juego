// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

const XP_POR_NIVEL = 100;

// Regiones por nivel
const REGIONES_INCOGNITA = [
  { minNivel: 1, nombre: "Aldea de las Ecuaciones" },
  { minNivel: 5, nombre: "Villa de los Enteros" },
  { minNivel: 10, nombre: "Fortaleza de las Fracciones" },
  { minNivel: 15, nombre: "Cumbre del Álgebra Racional" },
  { minNivel: 21, nombre: "Abismo de los Coeficientes" },
  { minNivel: 31, nombre: "El Vacío del Infinito Algebraico" }
];

function regionParaNivelIncognita(nivel) {
  let region = REGIONES_INCOGNITA[0].nombre;
  for (const r of REGIONES_INCOGNITA) {
    if (nivel >= r.minNivel) region = r.nombre;
  }
  return region;
}

let modoActual = 'alternativas';
let racha = 0;
let feedbackTimeout = null;

let elNombre, elNivel, elMonedas, elXpBarra, elXpTexto, elRegion;
let elPreguntaAlt, elOpcionesAlt, elFeedbackAlt, elRachaAlt;
let elHistorialPasos, elFeedbackPractica, elNextPracticaBtn;
let elNumeroPractica, elBtnAccion, elOperacionBtns;
let elControlesPractica, elMensajeExito, elTextoSolucion;
let elBtnReiniciar;

// Utilidades para formatear fracciones en HTML
function fraccionHTML(num, den) {
    return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
}

function formatearEcuacionSimple(ecuacion, letra = 'x') {
    let { a, b, c, d } = ecuacion;
    let left = '';

    // Si es fracción (x/d)
    if (d && d !== 1) {
        left = fraccionHTML(letra, d);
    } else {
        if (a === 1) left = letra;
        else left = a + letra;
    }

    if (b > 0) left += ' + ' + b;
    else if (b < 0) left += ' - ' + Math.abs(b);

    return left + ' = ' + c;
}

// Generador de ecuaciones según el nivel
function generarEcuacionLineal() {
    let nivel = window.jugador.incognita.nivel || 1;
    let dificultad;
    if (nivel >= 1 && nivel <= 4) dificultad = 1;
    else if (nivel >= 5 && nivel <= 9) dificultad = 2;
    else if (nivel >= 10 && nivel <= 14) dificultad = 3;
    else if (nivel >= 15 && nivel <= 20) dificultad = 4;
    else dificultad = 5; // ¡Nivel 21+!

    // Dificultad 1: x + b = c
    if (dificultad === 1) {
        let x = Math.floor(Math.random() * 10) - 5;
        let b = Math.floor(Math.random() * 10) - 5;
        let c = x + b;
        return { tipo: 'simple', a: 1, b, c, d: 1, x };
    }
    // Dificultad 2: ax + b = c
    else if (dificultad === 2) {
        let x = Math.floor(Math.random() * 10) - 5;
        let a = Math.floor(Math.random() * 4) + 2;
        let b = Math.floor(Math.random() * 10) - 5;
        let c = a * x + b;
        return { tipo: 'simple', a, b, c, d: 1, x };
    }
    // Dificultad 3: x/d + b = c
    else if (dificultad === 3) {
        let x = Math.floor(Math.random() * 10) - 5;
        let d = Math.floor(Math.random() * 5) + 2; 
        let b = Math.floor(Math.random() * 10) - 5;
        let c = (x / d) + b; 
        return { tipo: 'simple', a: 1, b, c, d, x };
    }
    // Dificultad 4 y 5: (A - x)/B + (C*x)/D = (x - E)/F
    else {
        // Elegir F, B, D para que B y D dividan a F. ¡Esto evita el bucle infinito!
        let F, B, D;
        if (dificultad === 4) {
            F = [4, 6, 8, 12][Math.floor(Math.random() * 4)];
            // Divisores de F (excluyendo 1)
            let divisores = [];
            for (let i = 2; i <= F; i++) {
                if (F % i === 0) divisores.push(i);
            }
            B = divisores[Math.floor(Math.random() * divisores.length)];
            D = divisores[Math.floor(Math.random() * divisores.length)];
        } else {
            F = [8, 12, 16, 20, 24][Math.floor(Math.random() * 5)];
            let divisores = [];
            for (let i = 2; i <= F; i++) {
                if (F % i === 0) divisores.push(i);
            }
            B = divisores[Math.floor(Math.random() * divisores.length)];
            D = divisores[Math.floor(Math.random() * divisores.length)];
        }

        // Elegir x, A, C (pueden ser números más grandes en dificultad 5)
        let x, A, C;
        if (dificultad === 4) {
            x = Math.floor(Math.random() * 15) - 7;
            A = Math.floor(Math.random() * 5) + 1;
            C = Math.floor(Math.random() * 5) + 1;
        } else {
            x = Math.floor(Math.random() * 30) - 15;
            A = Math.floor(Math.random() * 8) + 2;
            C = Math.floor(Math.random() * 8) + 2;
        }

        // Calcular E matemáticamente para garantizar que sea entero
        let F_div_B = F / B;
        let F_div_D = F / D;
        
        // LHS * F = F_div_B * (A - x) + F_div_D * (C * x)
        let LHS_por_F = F_div_B * (A - x) + F_div_D * (C * x);
        
        // E = x - LHS * F
        let E = x - LHS_por_F;

        return { tipo: 'compleja', A, B, C, D, E, F, x };
    }
}

function formatearEcuacionCompleja(eq) {
    return `(${eq.A} - x)/${eq.B} + (${eq.C}x)/${eq.D} = (x - ${eq.E})/${eq.F}`;
}

// Generar pasos para la práctica paso a paso
function generarPasos(ecuacion) {
    const pasos = [];
    const { tipo, a, b, c, d, x } = ecuacion;
    
    // Práctica para fracciones simples (Nivel 10-14)
    if (tipo === 'simple' && d && d !== 1) {
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), a: 1, b, c, d, x });
        pasos.push({ tipo: 'mover_constante', operacion: b > 0 ? 'restar' : 'sumar', valor: Math.abs(b), a: 1, b: 0, c: c - b, d, x, texto: `${fraccionHTML('x', d)} = ${c - b}` });
        pasos.push({ tipo: 'multiplicar', operacion: 'multiplicar', valor: d, a: 1, b: 0, c: (c - b) * d, d: 1, x, texto: `x = ${(c - b) * d}` });
        pasos.push({ tipo: 'solucion', x, texto: `x = ${x}` });
        return pasos;
    }

    // Práctica para enteros (Niveles 1-9)
    pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), a, b, c, x });
    let pasoActual = { a, b, c };

    if (b !== 0) {
        const valor = Math.abs(b);
        const operacion = b > 0 ? 'restar' : 'sumar';
        const nuevoB = 0;
        const nuevoC = c - b;
        pasos.push({ tipo: 'mover_constante', operacion, valor, a: a, b: nuevoB, c: nuevoC, texto: `${a}x = ${nuevoC}` });
        pasoActual = { a, b: nuevoB, c: nuevoC };
    }

    if (a !== 1) {
        const valor = a;
        const operacion = 'dividir';
        const nuevoA = 1;
        const nuevoC = pasoActual.c / a;
        pasos.push({ tipo: 'dividir', operacion, valor, a: nuevoA, b: pasoActual.b, c: nuevoC, texto: `x = ${nuevoC}` });
        pasoActual = { a: nuevoA, b: pasoActual.b, c: nuevoC };
    }

    pasos.push({ tipo: 'solucion', x, texto: `x = ${x}` });
    return pasos;
}

// Aplica la operación elegida por el usuario en práctica
function aplicarOperacion(ecuacion, op, num) {
    let { a, b, c, d } = ecuacion;
    if (d && d !== 1 && d !== undefined) {
        switch (op) {
            case 'sumar': return { ...ecuacion, b: b + num, c: c + num };
            case 'restar': return { ...ecuacion, b: b - num, c: c - num };
            case 'multiplicar': return { ...ecuacion, d: d / num, c: c * num, b: b * num };
            case 'dividir': return { ...ecuacion, d: d * num, c: c / num, b: b / num };
        }
    }
    switch (op) {
        case 'sumar': return { ...ecuacion, b: b + num, c: c + num };
        case 'restar': return { ...ecuacion, b: b - num, c: c - num };
        case 'multiplicar': return { ...ecuacion, a: a * num, b: b * num, c: c * num };
        case 'dividir': return { ...ecuacion, a: a / num, b: b / num, c: c / num };
        default: return { ...ecuacion };
    }
}

// ... (El resto de la lógica de UI y renderizado se mantiene igual, solo cambia la generación de preguntas) ...

function formatearEcuacionConOperacion(original, op, num) {
    const textoOriginal = formatearEcuacionSimple(original);
    const partes = textoOriginal.split('=');
    if (partes.length !== 2) return textoOriginal;
    let izq = partes[0].trim();
    let der = partes[1].trim();
    if (op === 'sumar' || op === 'restar') {
        const signo = (op === 'sumar') ? '+' : '-';
        izq += ` ${signo} ${num}`;
        der += ` ${signo} ${num}`;
    } else if (op === 'multiplicar') {
        izq += ` · ${num}`; der += ` · ${num}`;
    } else if (op === 'dividir') {
        izq += ` ÷ ${num}`; der += ` ÷ ${num}`;
    }
    return `${izq} = ${der}`;
}

// ---------- Modo Alternativas ----------
let preguntaActualAlt = null;
let letraActual = 'x';

function generarPreguntaAlternativas() {
    const eq = generarEcuacionLineal();
    const letras = ['a', 'b', 'c', 'x', 'y', 'z'];
    const letra = letras[Math.floor(Math.random() * letras.length)];
    letraActual = letra;
    const enunciado = `Encuentra la incógnita ${letra}:`;
    const ecuacion = eq.tipo === 'simple' ? formatearEcuacionSimple(eq, letra) : formatearEcuacionCompleja(eq).replace(/x/g, letra);
    const correcta = eq.x;
    const opciones = new Set();
    opciones.add(correcta);
    let intentos = 0;
    while (opciones.size < 4 && intentos < 100) {
        intentos++;
        let distractora = correcta + Math.floor(Math.random() * 10) - 5;
        if (distractora !== correcta) opciones.add(distractora);
    }
    return { enunciado, ecuacion, respuestaCorrecta: correcta, opciones: mezclarArray(Array.from(opciones)) };
}

function nuevaPreguntaAlternativas() {
    preguntaActualAlt = generarPreguntaAlternativas();
    if (elPreguntaAlt) {
        elPreguntaAlt.innerHTML = `
            <div style="font-size:1.4rem; font-weight:500; color:var(--text-main); margin-bottom:0.5rem;">
                ${preguntaActualAlt.enunciado}
            </div>
            <div style="font-size:2rem; font-weight:700; color:var(--text-main);">
                ${preguntaActualAlt.ecuacion}
            </div>
        `;
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
    if (elFeedbackAlt) { elFeedbackAlt.classList.add('hidden'); elFeedbackAlt.classList.remove('feedback-exito', 'feedback-error'); }
}

function responderAlternativa(opcionElegida, btnElegido) {
    if (!elOpcionesAlt) return;
    [...elOpcionesAlt.children].forEach(b => b.disabled = true);
    const esCorrecta = opcionElegida === preguntaActualAlt.respuestaCorrecta;

    let xpGanada = 0; let monedasGanadas = 0;
    if (esCorrecta) {
        racha++;
        const bonusRacha = Math.min(racha, 5) * 2;
        xpGanada = 10 + bonusRacha; monedasGanadas = 5 + Math.floor(racha / 3);
        btnElegido.classList.add('opcion-correcta');
        if (elFeedbackAlt) { elFeedbackAlt.textContent = '✅ ¡Correcto!, sigue así 😊'; elFeedbackAlt.className = 'feedback feedback-exito'; elFeedbackAlt.classList.remove('hidden'); }
    } else {
        racha = 0;
        btnElegido.classList.add('opcion-incorrecta');
        if (elFeedbackAlt) { elFeedbackAlt.textContent = `❌ Casi. La respuesta correcta era ${letraActual} = ${preguntaActualAlt.respuestaCorrecta}`; elFeedbackAlt.className = 'feedback feedback-error'; elFeedbackAlt.classList.remove('hidden'); }
    }

    if (elRachaAlt) elRachaAlt.textContent = racha;

    if (window.jugador && window.uid) {
        const j = window.jugador;
        if (!j.incognita) j.incognita = { xp: 0, nivel: 1, region: REGIONES_INCOGNITA[0].nombre };
        const inc = j.incognita;
        const nuevoXp = (inc.xp || 0) + xpGanada;
        const nuevoNivel = Math.floor(nuevoXp / XP_POR_NIVEL) + 1;
        inc.xp = nuevoXp; inc.nivel = nuevoNivel; inc.region = regionParaNivelIncognita(nuevoNivel); inc.racha = racha;
        j.monedas = (j.monedas || 0) + monedasGanadas;

        db.collection('usuarios').doc(window.uid).update({
            monedas: j.monedas,
            'incognita.xp': inc.xp, 'incognita.nivel': inc.nivel, 'incognita.region': inc.region, 'incognita.racha': racha,
            historial: firebase.firestore.FieldValue.arrayUnion({ juego: 'incognita', pregunta: preguntaActualAlt.ecuacion, correcta: esCorrecta, fecha: new Date().toISOString() })
        }).catch(error => { console.error('Error al guardar progreso:', error); });

        actualizarUI();
    }
    setTimeout(nuevaPreguntaAlternativas, 1600);
}

function mezclarArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ---------- Práctica Paso a Paso (ahora con fracciones) ----------
let practicaState = {
    pasos: [], pasoActual: 0, historialLineas: [], operacionPendiente: null, eq: null
};

function iniciarPractica() {
    const eq = generarEcuacionLineal(); // Usa el mismo generador para que tenga fracciones si es nivel alto
    practicaState.eq = eq;
    practicaState.pasos = generarPasos(eq);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [{ texto: formatearEcuacionSimple(eq), tipo: 'original' }];

    if (elControlesPractica) elControlesPractica.style.display = 'block';
    if (elMensajeExito) elMensajeExito.style.display = 'none';
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';
    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
        if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    }

    mostrarHistorial();
    resetearControles();
    actualizarBoton();
    mostrarControles(true);
}

// (Las funciones mostrarHistorial, resetearControles, etc. se mantienen igual que tu código original, solo cambia la validación de pasos)
function mostrarHistorial() {
    if (!elHistorialPasos) return;
    elHistorialPasos.innerHTML = '';
    practicaState.historialLineas.forEach(linea => {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        if (linea.tipo === 'operacion') { div.classList.add('linea-paso'); }
        else if (linea.tipo === 'solucion') { div.classList.add('linea-solucion'); }
        div.innerHTML = linea.texto;
        elHistorialPasos.appendChild(div);
    });
}

function confirmarPaso() {
    if (!practicaState.operacionPendiente) return;
    const pendiente = practicaState.operacionPendiente;
    const ecuacionAplicada = pendiente.ecuacionAplicada;
    const textoSimplificado = formatearEcuacionSimple(ecuacionAplicada);

    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    let esCorrecto = false;
    if (pasoEsperado && (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir' || pasoEsperado.tipo === 'multiplicar')) {
        esCorrecto = (pendiente.operacion === pasoEsperado.operacion && pendiente.numero === pasoEsperado.valor);
    }

    if (!esCorrecto) {
        practicaState.historialLineas.pop();
        practicaState.operacionPendiente = null;
        mostrarHistorial(); resetearControles(); actualizarBoton();
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Revisa la pista.', 'error');
        return;
    }

    practicaState.pasoActual++;
    practicaState.historialLineas.push({ texto: textoSimplificado, tipo: 'simplificacion' });
    practicaState.operacionPendiente = null;

    mostrarHistorial(); resetearControles();

    if (practicaState.pasoActual + 1 < practicaState.pasos.length && practicaState.pasos[practicaState.pasoActual + 1].tipo === 'solucion') {
        practicaState.pasoActual++;
        practicaState.historialLineas.push({ texto: practicaState.pasos[practicaState.pasoActual].texto, tipo: 'solucion' });
        mostrarHistorial();

        // OTORGAR RECOMPENSAS (Igual que tu código)
        racha++;
        const bonusRacha = Math.min(racha, 5) * 2;
        const xpGanada = 10 + bonusRacha;
        const monedasGanadas = 5 + Math.floor(racha / 3);

        if (window.jugador && window.uid) {
            const j = window.jugador;
            if (!j.incognita) j.incognita = { xp: 0, nivel: 1, region: REGIONES_INCOGNITA[0].nombre };
            const inc = j.incognita;
            const nuevoXp = (inc.xp || 0) + xpGanada;
            const nuevoNivel = Math.floor(nuevoXp / XP_POR_NIVEL) + 1;
            inc.xp = nuevoXp; inc.nivel = nuevoNivel; inc.region = regionParaNivelIncognita(nuevoNivel); inc.racha = racha;
            j.monedas = (j.monedas || 0) + monedasGanadas;
            db.collection('usuarios').doc(window.uid).update({
                monedas: j.monedas,
                'incognita.xp': inc.xp, 'incognita.nivel': inc.nivel, 'incognita.region': inc.region, 'incognita.racha': racha,
                historial: firebase.firestore.FieldValue.arrayUnion({ juego: 'incognita', pregunta: practicaState.eq ? formatearEcuacionSimple(practicaState.eq) : 'Practica', correcta: true, fecha: new Date().toISOString() })
            }).catch(error => console.error('Error al guardar progreso:', error));
            actualizarUI();
        }

        if (elControlesPractica) elControlesPractica.style.display = 'none';
        if (elMensajeExito) { elMensajeExito.style.display = 'block'; if (elTextoSolucion) elTextoSolucion.textContent = `x = ${practicaState.eq.x}`; }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        mostrarControles(false); elBtnAccion.disabled = true;
        return;
    }

    actualizarBoton();
    mostrarFeedbackPractica('✅ ¡Bien hecho! 😊', 'exito');
}

function actualizarUI() {
    if (!window.jugador) return;
    const j = window.jugador;
    const inc = j.incognita || { nivel: 1, xp: 0, region: REGIONES_INCOGNITA[0].nombre };
    if (elNombre) elNombre.textContent = j.nombre || "Aventurero";
    if (elNivel) elNivel.textContent = inc.nivel || 1;
    if (elMonedas) elMonedas.textContent = j.monedas || 0;
    if (elRegion) elRegion.textContent = inc.region || REGIONES_INCOGNITA[0].nombre;
    if (elXpBarra && elXpTexto) { const xpEnNivel = (inc.xp || 0) % XP_POR_NIVEL; elXpBarra.style.width = `${xpEnNivel}%`; elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`; }
}

// (El resto de funciones como iniciarJuego, reiniciarNivel y event listeners se mantienen igual que tu archivo original)
function cambiarModo(modo) { /* (Mantener igual que tu código original) */ modoActual = modo; /* ... */ }
function mostrarFeedback(mensaje, tipo) { /* (Igual que tu código) */ }
function resetearControles() { /* (Igual que tu código) */ }
function actualizarBoton() { /* (Igual que tu código) */ }
function mostrarControles(visible) { /* (Igual que tu código) */ }
function manejarBoton() { /* (Igual que tu código) */ }
function realizarOperacion() { /* (Igual que tu código) */ }
function mostrarFeedbackPractica(mensaje, tipo) { /* (Igual que tu código) */ }
function esperarJugador() { if (window.jugador) iniciarJuego(); else setTimeout(esperarJugador, 100); }
// Incluir la lógica de iniciarJuego original:
function iniciarJuego() {
    elNombre = document.getElementById('player-name'); elNivel = document.getElementById('player-level'); elMonedas = document.getElementById('player-coins');
    elXpBarra = document.getElementById('xp-bar-fill'); elXpTexto = document.getElementById('xp-text'); elRegion = document.getElementById('player-region');
    elPreguntaAlt = document.getElementById('pregunta-enunciado-alt'); elOpcionesAlt = document.getElementById('opciones-container-alt');
    elFeedbackAlt = document.getElementById('feedback-message-alt'); elRachaAlt = document.getElementById('racha-actual-alt');
    elHistorialPasos = document.getElementById('historial-pasos'); elFeedbackPractica = document.getElementById('feedback-practica');
    elNextPracticaBtn = document.getElementById('next-practica-btn'); elNumeroPractica = document.getElementById('numero-practica');
    elBtnAccion = document.getElementById('btn-accion'); elControlesPractica = document.getElementById('controles-practica');
    elMensajeExito = document.getElementById('mensaje-exito'); elTextoSolucion = document.getElementById('texto-solucion');
    elBtnReiniciar = document.getElementById('btn-reiniciar');

    if (elBtnAccion) elBtnAccion.addEventListener('click', manejarBoton);
    elOperacionBtns = document.querySelectorAll('.operacion-btn');
    elOperacionBtns.forEach(btn => btn.addEventListener('click', () => {
        if (practicaState.operacionPendiente) return;
        elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
        btn.classList.add('seleccionado'); actualizarBoton();
    }));
    elNumeroPractica.addEventListener('input', () => { if (practicaState.operacionPendiente) return; actualizarBoton(); });

    if (window.jugador) { const inc = window.jugador.incognita || {}; racha = inc.racha || 0; if (elRachaAlt) elRachaAlt.textContent = racha; actualizarUI(); }

    document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
    document.getElementById('mode-practica').addEventListener('click', () => cambiarModo('practica'));
    if (elNextPracticaBtn) elNextPracticaBtn.addEventListener('click', iniciarPractica);
    document.getElementById('btn-logout').addEventListener('click', async () => { await firebase.auth().signOut(); sessionStorage.clear(); window.location.href = 'index.html'; });
    if (elBtnReiniciar) elBtnReiniciar.addEventListener('click', reiniciarNivel);

    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', () => { mostrarFeedback('¡Progreso guardado!', 'exito'); });

    cambiarModo('alternativas');
}

document.addEventListener('DOMContentLoaded', () => { if (window.jugador) iniciarJuego(); else esperarJugador(); });
