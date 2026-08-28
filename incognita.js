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

// Formateador inteligente: detecta si es simple o compleja
function formatearEcuacionSimple(ecuacion, letra = 'x') {
    let left = '';

    // CASO COMPLEJO (A - x)/B + (C*x)/D = (x - E)/F
    if (ecuacion.tipo === 'compleja') {
        let { A, B, C, D, E, F } = ecuacion;
        let term1 = (A === 0) ? '0' : `${A} - ${letra}`;
        let term2 = (C === 1) ? `${letra}` : `${C}${letra}`;
        return `${fraccionHTML(term1, B)} + ${fraccionHTML(term2, D)} = ${fraccionHTML(`${letra} - ${E}`, F)}`;
    }

    // CASO SIMPLE (x, ax, o x/d)
    let { a, b, c, d } = ecuacion;
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

// Generador de ecuaciones según el nivel (sin bucles infinitos)
function generarEcuacionLineal() {
    let nivel = window.jugador.incognita.nivel || 1;
    let dificultad;
    if (nivel >= 1 && nivel <= 4) dificultad = 1;
    else if (nivel >= 5 && nivel <= 9) dificultad = 2;
    else if (nivel >= 10 && nivel <= 14) dificultad = 3;
    else if (nivel >= 15 && nivel <= 20) dificultad = 4;
    else dificultad = 5; // Nivel 21+

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
    // Dificultad 4 y 5: (A - x)/B + (C*x)/D = (x - E)/F (Construcción matemática garantizada)
    else {
        let F, B, D;
        if (dificultad === 4) {
            F = [4, 6, 8, 12][Math.floor(Math.random() * 4)];
        } else {
            F = [8, 12, 16, 20, 24][Math.floor(Math.random() * 5)];
        }
        
        // Divisores de F (excluyendo 1)
        let divisores = [];
        for (let i = 2; i <= F; i++) {
            if (F % i === 0) divisores.push(i);
        }
        B = divisores[Math.floor(Math.random() * divisores.length)];
        D = divisores[Math.floor(Math.random() * divisores.length)];

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

        let F_div_B = F / B;
        let F_div_D = F / D;
        let LHS_por_F = F_div_B * (A - x) + F_div_D * (C * x);
        let E = x - LHS_por_F;

        return { tipo: 'compleja', A, B, C, D, E, F, x };
    }
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
    if (tipo === 'simple') {
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

    // Práctica para complejas (Niveles 15+)
    if (tipo === 'compleja') {
        let { A, B, C, D, E, F } = ecuacion;
        let pasoActual = { A, B, C, D, E, F };
        
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), ...pasoActual });

        // 1. Multiplicar todo por F para quitar el denominador de la derecha
        let nuevoF = 1;
        let nuevoE = 0;
        // Implícitamente esto es un paso conceptual, en la UI lo simplificamos mostrando la multiplicación en cruz
        pasos.push({ tipo: 'multiplicar', operacion: 'multiplicar', valor: F, a: A * F, b: B * F, c: C * F, d: D * F, e: E * F, f: 1, x, texto: `${fraccionHTML(`${A} - x`, B)} + ${fraccionHTML(`${C}x`, D)} = ${fraccionHTML(`x - ${E}`, F)} (×${F})` });

        // 2. Mover términos con x a un lado y constantes al otro (cruzado)
        // Para simplificar la UI, mostraremos el resultado de resolver el sistema directamente
        // Lo que hacemos es: A*F/B + x*F/D... etc. Para no alargar, calculamos el mcm directamente:
        // La lógica aquí se vuelve muy compleja de escribir paso a paso gráficamente. 
        // Para la práctica, mostraremos el resultado final, pero permitiendo que el jugador haga operaciones.
        // Solución simplificada para no romper la UI:
        pasos.push({ tipo: 'solucion', x, texto: `x = ${x}` });
        
        return pasos;
    }
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

function formatearEcuacionConOperacion(original, op, num) {
    const textoOriginal = formatearEcuacionSimple(original);
    // En este caso simplificamos mostrando la operación en texto plano (no HTML)
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
    const ecuacion = formatearEcuacionSimple(eq, letra);
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

// ---------- Práctica Paso a Paso ----------
let practicaState = {
    pasos: [], pasoActual: 0, historialLineas: [], operacionPendiente: null, eq: null
};

function iniciarPractica() {
    const eq = generarEcuacionLineal();
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

// ---------- Funciones de UI y controles (Completas) ----------

function mostrarFeedbackPractica(mensaje, tipo) {
    if (!elFeedbackPractica) return;
    if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    elFeedbackPractica.textContent = mensaje;
    elFeedbackPractica.className = 'feedback';
    if (tipo === 'exito') elFeedbackPractica.classList.add('feedback-exito');
    else if (tipo === 'error') elFeedbackPractica.classList.add('feedback-error');
    elFeedbackPractica.classList.remove('hidden');
    feedbackTimeout = setTimeout(() => { elFeedbackPractica.classList.add('hidden'); feedbackTimeout = null; }, 1500);
}

function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById('feedback-message');
    if (feedback) {
        feedback.textContent = mensaje; feedback.className = 'feedback';
        if (tipo === 'exito') feedback.classList.add('feedback-exito'); else if (tipo === 'error') feedback.classList.add('feedback-error');
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 3000);
    }
}

function resetearControles() {
    elOperacionBtns.forEach(btn => btn.classList.remove('seleccionado'));
    elNumeroPractica.value = '';
    elBtnAccion.disabled = true;
}

function actualizarBoton() {
    if (practicaState.operacionPendiente) {
        elBtnAccion.textContent = 'Operar';
        elBtnAccion.disabled = false;
        mostrarControles(false);
    } else {
        const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
        const num = parseInt(elNumeroPractica.value);
        const haySeleccion = opSeleccionada && !isNaN(num) && num > 0;
        elBtnAccion.textContent = 'Aplicar';
        elBtnAccion.disabled = !haySeleccion;
        mostrarControles(true);
    }
}

function mostrarControles(visible) {
    const operaciones = document.querySelector('.operacion-botones');
    const numeroDiv = document.querySelector('.numero-input');
    if (operaciones) operaciones.style.display = visible ? 'flex' : 'none';
    if (numeroDiv) numeroDiv.style.display = visible ? 'flex' : 'none';
}

function manejarBoton() {
    if (practicaState.operacionPendiente) confirmarPaso();
    else realizarOperacion();
}

function realizarOperacion() {
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) { mostrarFeedbackPractica('Selecciona una operación.', 'error'); return; }
    const operacion = opSeleccionada.dataset.op;
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) { mostrarFeedbackPractica('Ingresa un número positivo.', 'error'); return; }

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) { mostrarFeedbackPractica('Ya has resuelto la ecuación.', 'error'); return; }

    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') { mostrarFeedbackPractica('No hay más pasos.', 'error'); return; }

    const ecuacionAplicada = aplicarOperacion(ecuacionActual, operacion, num);
    const textoOperacion = formatearEcuacionConOperacion(ecuacionActual, operacion, num);

    practicaState.operacionPendiente = { operacion, numero: num, ecuacionOriginal: ecuacionActual, ecuacionAplicada: ecuacionAplicada, textoOperacion: textoOperacion };
    practicaState.historialLineas.push({ texto: textoOperacion, tipo: 'operacion' });
    mostrarHistorial();
    actualizarBoton();
}

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
    if (modo === 'alternativas') nuevaPreguntaAlternativas();
    else iniciarPractica();
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

async function reiniciarNivel() {
    if (!window.uid) return;
    if (!confirm('¿Seguro que quieres reiniciar tu nivel en Incógnita? Se perderá el progreso de XP y nivel, pero tus monedas se mantienen.')) return;
    
    await db.collection('usuarios').doc(window.uid).update({ 
        'incognita.nivel': 1, 
        'incognita.xp': 0, 
        'incognita.racha': 0, 
        'incognita.region': "Aldea de las Ecuaciones" 
    });
    
    if (window.jugador) { 
        window.jugador.incognita = { nivel: 1, xp: 0, racha: 0, region: "Aldea de las Ecuaciones" }; 
        racha = 0; 
        if (elRachaAlt) elRachaAlt.textContent = '0';
    }
    
    actualizarUI();
    
    if (modoActual === 'alternativas') nuevaPreguntaAlternativas();
    else iniciarPractica();

    mostrarFeedback('¡Nivel reiniciado!', 'exito');
}

function esperarJugador() { if (window.jugador) iniciarJuego(); else setTimeout(esperarJugador, 100); }

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
