// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

const XP_POR_NIVEL = 100;

const REGIONES_INCOGNITA = [
  { minNivel: 1, nombre: "Aldea de las Ecuaciones" },
  { minNivel: 2, nombre: "Villa de los Enteros" },
  { minNivel: 4, nombre: "Fortaleza de las Fracciones" },
  { minNivel: 6, nombre: "Cumbre del Álgebra Racional" },
  { minNivel: 10, nombre: "Abismo de los Coeficientes" },
  { minNivel: 15, nombre: "El Vacío del Infinito Algebraico" }
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
let elBtnPista;

// ========== UTILIDADES ==========
function fraccionHTML(num, den) {
    return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
}

function formatearLadoIzquierdo(ecuacion, letra = 'x') {
    let { a, b, d } = ecuacion;
    let left = '';
    if (d && d !== 1) {
        left = fraccionHTML(letra, d);
    } else {
        if (a === 1) left = letra;
        else left = a + letra;
    }
    if (b > 0) left += ' + ' + b;
    else if (b < 0) left += ' - ' + Math.abs(b);
    return left;
}

function formatearLadoDerecho(ecuacion) {
    return ecuacion.c;
}

function formatearEcuacionSimple(ecuacion, letra = 'x') {
    if (!ecuacion) return 'Ecuación no disponible';
    if (ecuacion.tipo === 'compleja') {
        let { A, B, C, D, E, F } = ecuacion;
        let term1 = (A === 0) ? '0' : `${A} - ${letra}`;
        let term2 = (C === 0) ? '0' : `${C}${letra}`;
        let term3 = `${letra} - ${E}`;
        let left = '';
        if (B === 1 && A !== 0) left = term1;
        else if (B !== 1) left = fraccionHTML(term1, B);
        else left = '0';
        if (C !== 0) {
            if (D === 1) left += ' + ' + term2;
            else left += ' + ' + fraccionHTML(term2, D);
        }
        let right = '';
        if (F === 1) right = term3;
        else right = fraccionHTML(term3, F);
        return left + ' = ' + right;
    }
    return formatearLadoIzquierdo(ecuacion, letra) + ' = ' + ecuacion.c;
}

function formatearEcuacionConOperacion(original, op, num, letra = 'x') {
    // CORRECCIÓN: Si el objeto no tiene tipo pero tiene a,b,c, lo tratamos como 'simple'
    if (!original.tipo && original.a !== undefined && original.c !== undefined) {
        original = { ...original, tipo: 'simple' };
    }
    if (original.tipo !== 'simple') {
        const eqStr = formatearEcuacionSimple(original, letra);
        return `${op} ${num} → ${eqStr}`;
    }
    const izqOriginal = formatearLadoIzquierdo(original, letra);
    const derOriginal = original.c;
    let nuevaIzq, nuevaDer;
    if (op === 'sumar') {
        nuevaIzq = `${izqOriginal} + ${num}`;
        nuevaDer = `${derOriginal} + ${num}`;
    } else if (op === 'restar') {
        nuevaIzq = `${izqOriginal} - ${num}`;
        nuevaDer = `${derOriginal} - ${num}`;
    } else if (op === 'multiplicar') {
        const izqParent = /[+-]/.test(izqOriginal) ? `(${izqOriginal})` : izqOriginal;
        const derParent = /[+-]/.test(String(derOriginal)) ? `(${derOriginal})` : derOriginal;
        nuevaIzq = `${num} · ${izqParent}`;
        nuevaDer = `${num} · ${derParent}`;
    } else if (op === 'dividir') {
        const izqParent = /[+-]/.test(izqOriginal) ? `(${izqOriginal})` : izqOriginal;
        const derParent = /[+-]/.test(String(derOriginal)) ? `(${derOriginal})` : derOriginal;
        nuevaIzq = `${izqParent} ÷ ${num}`;
        nuevaDer = `${derParent} ÷ ${num}`;
    } else {
        return formatearEcuacionSimple(original, letra);
    }
    return `${nuevaIzq} = ${nuevaDer}`;
}

// ========== EXPLICACIONES PEDAGÓGICAS ==========
function obtenerExplicacionPaso(paso, ecuacion) {
    if (!paso) return '';
    const tipo = paso.tipo;
    const op = paso.operacion || '';
    const valor = paso.valor || '';
    switch (tipo) {
        case 'mover_constante':
            const signo = op === 'sumar' ? 'sumamos' : 'restamos';
            return `Para aislar el término con la incógnita, ${signo} ${Math.abs(valor)} a ambos lados de la ecuación.`;
        case 'dividir':
            return `Para obtener el valor de la incógnita, dividimos ambos lados por ${valor}.`;
        case 'multiplicar':
            return `Para eliminar el denominador, multiplicamos ambos lados por ${valor}.`;
        case 'distribuir':
            return 'Distribuimos y combinamos términos semejantes para simplificar la ecuación.';
        case 'operacion':
            return `Aplicamos la operación correcta para avanzar en la resolución.`;
        case 'solucion':
            return `¡Hemos despejado la incógnita! El valor es ${paso.x}.`;
        default:
            return 'Seguimos con el siguiente paso.';
    }
}

// ========== GENERADOR DE ECUACIONES ==========
function generarEcuacionLineal(maxDificultad = 5) {
    let nivel = window.jugador.incognita.nivel || 1;
    let dificultad;
    if (nivel === 1) dificultad = 1;
    else if (nivel >= 2 && nivel <= 3) dificultad = 2;
    else if (nivel >= 4 && nivel <= 5) dificultad = 3;
    else if (nivel >= 6 && nivel <= 9) dificultad = 4;
    else dificultad = 5;
    if (dificultad > maxDificultad) dificultad = maxDificultad;

    if (dificultad === 1) {
        let x = Math.floor(Math.random() * 10) - 5;
        let b = Math.floor(Math.random() * 9) - 4;
        if (b === 0) b = 1;
        let c = x + b;
        return { tipo: 'simple', a: 1, b, c, d: 1, x };
    } else if (dificultad === 2) {
        let x = Math.floor(Math.random() * 10) - 5;
        let a = Math.floor(Math.random() * 4) + 2;
        let b = Math.floor(Math.random() * 10) - 5;
        if (b === 0) b = 1;
        let c = a * x + b;
        return { tipo: 'simple', a, b, c, d: 1, x };
    } else if (dificultad === 3) {
        let d = Math.floor(Math.random() * 5) + 2;
        let k = Math.floor(Math.random() * 10) - 5;
        let b = Math.floor(Math.random() * 10) - 5;
        if (b === 0) b = 1;
        let x = d * k;
        let c = k + b;
        return { tipo: 'simple', a: 1, b, c, d, x };
    } else {
        let F, B, D;
        if (dificultad === 4) {
            F = [4, 6, 8, 12][Math.floor(Math.random() * 4)];
        } else {
            F = [8, 12, 16, 20, 24][Math.floor(Math.random() * 5)];
        }
        let divisores = [];
        for (let i = 2; i <= F; i++) {
            if (F % i === 0) divisores.push(i);
        }
        if (divisores.length === 0) divisores = [2];
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

// ========== APLICAR OPERACIÓN ==========
function aplicarOperacion(ecuacion, op, num) {
    if (ecuacion.tipo === 'compleja') {
        let { A, B, C, D, E, F } = ecuacion;
        if (op === 'multiplicar') {
            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            let gA = gcd(num, B);
            let nuevoA = A * (num / gA);
            let nuevoB = B / gA;
            let gC = gcd(num, D);
            let nuevoC = C * (num / gC);
            let nuevoD = D / gC;
            let gE = gcd(num, F);
            let nuevoE = E * (num / gE);
            let nuevoF = F / gE;
            return { ...ecuacion, A: nuevoA, B: nuevoB, C: nuevoC, D: nuevoD, E: nuevoE, F: nuevoF };
        }
        if (op === 'sumar' || op === 'restar') {
            let signo = op === 'sumar' ? 1 : -1;
            return { ...ecuacion, A: A + signo * num * B, E: E + signo * num * F };
        }
        if (op === 'dividir') {
            return { ...ecuacion, A: A / num, C: C / num, E: E / num };
        }
    }
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

// ========== GENERACIÓN DE PASOS ==========
function generarPasosInteractiva(ecuacion) {
    const pasos = [];
    const { tipo, a, b, c, d, x } = ecuacion;

    if (tipo === 'simple' && d && d !== 1) {
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), ...ecuacion });
        let constante = c - b;
        const opMover = b > 0 ? 'restar' : 'sumar';
        const valorMover = Math.abs(b);
        pasos.push({
            tipo: 'mover_constante',
            operacion: opMover,
            valor: valorMover,
            texto: `${fraccionHTML('x', d)} = ${constante}`,
            a: 1,
            b: 0,
            c: constante,
            d: d,
            x: x
        });
        pasos.push({
            tipo: 'multiplicar',
            operacion: 'multiplicar',
            valor: d,
            texto: `x = ${constante * d}`,
            a: 1,
            b: 0,
            c: constante * d,
            d: 1,
            x: constante * d  // CORRECCIÓN: añadir x
        });
        return pasos;
    }

    if (tipo === 'simple' && (!d || d === 1)) {
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), ...ecuacion });
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
                texto: `${a}x = ${nuevoC}`,
                a, b: nuevoB, c: nuevoC,
                x: x
            });
            pasoActual = { a, b: nuevoB, c: nuevoC };
        }

        if (a !== 1) {
            const valor = a;
            const operacion = 'dividir';
            const nuevoC = pasoActual.c / a;
            pasos.push({
                tipo: 'dividir',
                operacion,
                valor,
                texto: `x = ${nuevoC}`,
                a: 1,
                b: pasoActual.b,
                c: nuevoC,
                x: nuevoC   // CORRECCIÓN: añadir x
            });
        }
        return pasos;
    }

    pasos.push({ tipo: 'error', texto: 'Ecuación no reconocida', ...ecuacion });
    return pasos;
}

// ========== GENERAR PASOS GUIADA (CORREGIDA) ==========
function generarPasosGuiada(ecuacion) {
    const pasos = [];

    if (ecuacion.tipo === 'simple') {
        const base = generarPasosInteractiva(ecuacion);
        if (base.length > 1) {
            const original = base[0];
            const mover = base[1];
            if (mover && mover.tipo === 'mover_constante') {
                const op = mover.operacion;
                const val = mover.valor;
                const ecuacionOriginal = { ...ecuacion };
                const textoOperacion = formatearEcuacionConOperacion(ecuacionOriginal, op, val);
                pasos.push(original);
                pasos.push({
                    tipo: 'operacion',
                    texto: textoOperacion,
                    ...mover,
                    explicacion: `Para aislar el término con la incógnita, ${op === 'sumar' ? 'sumamos' : 'restamos'} ${Math.abs(val)} a ambos lados.`
                });
                pasos.push({
                    tipo: 'simplificacion',
                    texto: mover.texto,
                    ...mover,
                    explicacion: `Simplificamos: ${mover.texto}`
                });
                for (let i = 2; i < base.length; i++) {
                    const paso = base[i];
                    if (paso.tipo === 'multiplicar' || paso.tipo === 'dividir') {
                        const op = paso.operacion;
                        const val = paso.valor;
                        // CORRECCIÓN: usar el paso actual como ecuación previa
                        const ecuacionPrevia = { ...paso, tipo: 'simple' };
                        const textoOp = formatearEcuacionConOperacion(ecuacionPrevia, op, val);
                        const explicacion = op === 'multiplicar' 
                            ? `Multiplicamos ambos lados por ${val} para eliminar el denominador.`
                            : `Dividimos ambos lados entre ${val} para obtener x = ${paso.c}.`;
                        pasos.push({
                            tipo: 'operacion',
                            texto: textoOp,
                            ...paso,
                            explicacion
                        });
                        pasos.push({
                            tipo: 'simplificacion',
                            texto: paso.texto,
                            ...paso,
                            explicacion: `Simplificamos: ${paso.texto}`
                        });
                    } else {
                        pasos.push(paso);
                    }
                }
                return pasos;
            }
        }
        return base;
    }

    // Caso complejo
    if (ecuacion.tipo === 'compleja') {
        let { A, B, C, D, E, F, x } = ecuacion;
        pasos.push({ 
            tipo: 'original', 
            texto: formatearEcuacionSimple(ecuacion), 
            ...ecuacion,
            explicacion: 'Ecuación original con fracciones.'
        });
        const mcm = (a, b) => {
            const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
            return Math.abs(a * b) / gcd(a, b);
        };
        let M = mcm(B, D);
        M = mcm(M, F);
        const textoMul = formatearEcuacionConOperacion(ecuacion, 'multiplicar', M);
        pasos.push({
            tipo: 'operacion',
            texto: textoMul,
            ...ecuacion,
            explicacion: `Multiplicamos ambos lados por el MCM (${M}) para eliminar denominadores.`
        });
        let nuevaEq = aplicarOperacion(ecuacion, 'multiplicar', M);
        let newA = A * (M / B);
        let newC = C * (M / D);
        let newE = E * (M / F);
        let coefX = newC - (M / B);
        let a_simple = coefX - (M / F);
        let c_simple = -newE - newA;
        if (a_simple === 0) a_simple = 1;
        let eqDistribuida = { tipo: 'simple', a: a_simple, b: 0, c: c_simple, d: 1, x: x };
        pasos.push({
            tipo: 'distribuir',
            texto: 'Distribuir y combinar términos semejantes:',
            resultado: formatearEcuacionSimple(eqDistribuida),
            ...eqDistribuida,
            explicacion: 'Distribuimos y combinamos términos semejantes para obtener una ecuación más simple.'
        });
        let valorDiv = a_simple;
        let eqDiv = aplicarOperacion(eqDistribuida, 'dividir', valorDiv);
        const textoDiv = formatearEcuacionConOperacion(eqDistribuida, 'dividir', valorDiv);
        pasos.push({
            tipo: 'operacion',
            texto: textoDiv,
            ...eqDiv,
            explicacion: `Dividimos ambos lados entre ${valorDiv} para despejar x.`
        });
        pasos.push({
            tipo: 'simplificacion',
            texto: formatearEcuacionSimple(eqDiv),
            ...eqDiv,
            explicacion: `Simplificamos: ${formatearEcuacionSimple(eqDiv)}`
        });
        pasos.push({ 
            tipo: 'solucion', 
            x: x, 
            texto: `x = ${x}`,
            explicacion: `¡Solución encontrada! x = ${x}`
        });
        return pasos;
    }

    pasos.push({ tipo: 'error', texto: 'Ecuación no reconocida', ...ecuacion });
    return pasos;
}

// ========== MODO ALTERNATIVAS ==========
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

// ========== ESTADOS DE PRÁCTICA ==========
let practicaState = {
    pasos: [],
    pasoActual: 0,
    historialLineas: [],
    operacionPendiente: null,
    eq: null,
    eqActual: null,
    tipo: 'interactiva'
};

// ========== INICIALIZAR PRÁCTICA INTERACTIVA ==========
function iniciarPracticaInteractiva() {
    const eq = generarEcuacionLineal(3);
    practicaState.eq = eq;
    practicaState.eqActual = eq;
    practicaState.pasos = generarPasosInteractiva(eq);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [{ texto: formatearEcuacionSimple(eq), tipo: 'original' }];
    practicaState.tipo = 'interactiva';

    if (elControlesPractica) elControlesPractica.style.display = 'block';
    if (elMensajeExito) elMensajeExito.style.display = 'none';
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';
    if (elBtnAccion) {
        elBtnAccion.style.display = 'inline-flex';
        elBtnAccion.textContent = 'Aplicar';
        elBtnAccion.disabled = true;
    }
    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
        if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    }
    mostrarControles(true);
    mostrarHistorial();
    resetearControles();
    actualizarBoton();
}

// ========== INICIALIZAR PRÁCTICA GUIADA ==========
function iniciarPracticaGuiada() {
    const eq = generarEcuacionLineal();
    practicaState.eq = eq;
    practicaState.eqActual = eq;
    practicaState.pasos = generarPasosGuiada(eq);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [];
    practicaState.tipo = 'guiada';

    if (practicaState.pasos.length > 0) {
        practicaState.historialLineas.push({ texto: practicaState.pasos[0].texto || formatearEcuacionSimple(eq), tipo: 'original' });
    }

    if (elControlesPractica) elControlesPractica.style.display = 'none';
    if (elMensajeExito) elMensajeExito.style.display = 'none';
    if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'none';
    if (elBtnAccion) {
        elBtnAccion.style.display = 'inline-flex';
        elBtnAccion.textContent = 'Siguiente paso →';
        elBtnAccion.disabled = false;
    }
    if (elFeedbackPractica) {
        elFeedbackPractica.className = 'feedback hidden';
        elFeedbackPractica.textContent = '';
        if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    }
    if (elBtnPista) elBtnPista.style.display = 'inline-flex';

    mostrarHistorial();
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        if (elBtnAccion) elBtnAccion.disabled = true;
    }
    mostrarControles(false);
}

// ========== MOSTRAR HISTORIAL ==========
function mostrarHistorial() {
    if (!elHistorialPasos) return;
    elHistorialPasos.innerHTML = '';
    practicaState.historialLineas.forEach(linea => {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        if (linea.tipo === 'operacion' || linea.tipo === 'multiplicar' || linea.tipo === 'dividir' || 
            linea.tipo === 'distribuir' || linea.tipo === 'mover_constante') {
            div.classList.add('linea-paso');
        } else if (linea.tipo === 'solucion') {
            div.classList.add('linea-solucion');
        }
        let contenido = linea.texto || '';
        if (linea.resultado) {
            contenido += `<br><span style="font-weight:bold;">${linea.resultado}</span>`;
        }
        div.innerHTML = contenido || 'Línea vacía';
        elHistorialPasos.appendChild(div);
    });
}

// ========== FUNCIONES DEL MODO INTERACTIVO ==========
function confirmarPaso() {
    if (!practicaState.operacionPendiente) return;
    const pendiente = practicaState.operacionPendiente;
    const ecuacionAplicada = pendiente.ecuacionAplicada;
    const textoSimplificado = formatearEcuacionSimple(ecuacionAplicada);

    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    let esCorrecto = false;

    if (pasoEsperado && (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir' || pasoEsperado.tipo === 'multiplicar')) {
        esCorrecto = (pendiente.operacion === pasoEsperado.operacion && pendiente.numero == pasoEsperado.valor);
    }

    if (!esCorrecto) {
        if (practicaState.historialLineas.length > 0 && practicaState.historialLineas[practicaState.historialLineas.length - 1].tipo === 'operacion') {
            practicaState.historialLineas.pop();
        }
        practicaState.operacionPendiente = null;
        mostrarHistorial();
        resetearControles();
        actualizarBoton();
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Intenta de nuevo.', 'error');
        return;
    }

    practicaState.eqActual = ecuacionAplicada;
    practicaState.pasoActual++;
    const ultimaLinea = practicaState.historialLineas[practicaState.historialLineas.length - 1];
    if (!ultimaLinea || ultimaLinea.texto !== textoSimplificado) {
        practicaState.historialLineas.push({ texto: textoSimplificado, tipo: 'simplificacion' });
    }
    practicaState.operacionPendiente = null;

    mostrarHistorial();
    resetearControles();

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
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
        if (elMensajeExito) { 
            elMensajeExito.style.display = 'block'; 
            if (elTextoSolucion) elTextoSolucion.textContent = `x = ${practicaState.eqActual.x}`; 
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        if (elBtnAccion) elBtnAccion.style.display = 'none';
        mostrarControles(false);
        elBtnAccion.disabled = true;
        return;
    }

    actualizarBoton();
    mostrarFeedbackPractica('✅ ¡Bien hecho!', 'exito');
}

function realizarOperacion() {
    const opSeleccionada = document.querySelector('.operacion-btn.seleccionado');
    if (!opSeleccionada) { mostrarFeedbackPractica('Selecciona una operación.', 'error'); return; }
    const operacion = opSeleccionada.dataset.op;
    const num = parseInt(elNumeroPractica.value);
    if (isNaN(num) || num <= 0) { mostrarFeedbackPractica('Ingresa un número positivo.', 'error'); return; }

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) { mostrarFeedbackPractica('Ya has resuelto la ecuación.', 'error'); return; }

    const ecuacionActual = practicaState.eqActual;
    if (!ecuacionActual) { mostrarFeedbackPractica('No hay ecuación actual.', 'error'); return; }

    const ecuacionAplicada = aplicarOperacion(ecuacionActual, operacion, num);
    const textoOperacion = formatearEcuacionConOperacion(ecuacionActual, operacion, num);

    const yaExiste = practicaState.historialLineas.some(linea => linea.texto === textoOperacion && linea.tipo === 'operacion');
    if (!yaExiste) {
        practicaState.historialLineas.push({ texto: textoOperacion, tipo: 'operacion' });
    }

    practicaState.operacionPendiente = { 
        operacion, 
        numero: num, 
        ecuacionOriginal: ecuacionActual, 
        ecuacionAplicada: ecuacionAplicada, 
        textoOperacion: textoOperacion 
    };
    mostrarHistorial();
    actualizarBoton();
}

// ========== AVANZAR PASO GUIADA (CORREGIDA) ==========
function avanzarPasoGuiada() {
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        mostrarFeedbackPractica('Ya has completado todos los pasos.', 'exito');
        if (elBtnAccion) elBtnAccion.disabled = true;
        return;
    }

    practicaState.pasoActual++;
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso) return;

    if (paso.a !== undefined && paso.c !== undefined) {
        practicaState.eqActual = { ...paso };
    }

    let textoMostrar = paso.texto || '';
    if (paso.resultado) {
        textoMostrar += `<br><span style="font-weight:bold;">${paso.resultado}</span>`;
    }

    // Evitar duplicados consecutivos
    const ultimo = practicaState.historialLineas[practicaState.historialLineas.length - 1];
    if (!ultimo || ultimo.texto !== textoMostrar) {
        practicaState.historialLineas.push({ texto: textoMostrar, tipo: paso.tipo || 'paso' });
        console.log(`✅ Paso agregado (${paso.tipo}):`, textoMostrar);
    } else {
        console.warn('⚠️ Paso duplicado omitido:', textoMostrar);
    }

    mostrarHistorial();

    // Mostrar explicación pedagógica
    const explicacion = paso.explicacion || obtenerExplicacionPaso(paso, practicaState.eqActual);
    if (explicacion) {
        mostrarFeedbackPractica(`💡 ${explicacion}`, 'info');
    }

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        if (elBtnAccion) elBtnAccion.disabled = true;
        if (elMensajeExito) {
            elMensajeExito.style.display = 'block';
            if (elTextoSolucion) elTextoSolucion.textContent = `x = ${practicaState.eqActual.x}`;
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        mostrarFeedbackPractica('🎉 ¡Ecuación resuelta! (Práctica guiada)', 'exito');
        if (elBtnPista) elBtnPista.style.display = 'none';
    } else {
        if (elBtnPista) elBtnPista.style.display = 'inline-flex';
    }
}

// ========== PISTA PARA PRÁCTICA GUIADA ==========
function mostrarPista() {
    const siguiente = practicaState.pasos[practicaState.pasoActual + 1];
    if (!siguiente) {
        mostrarFeedbackPractica('No hay más pasos.', 'info');
        return;
    }
    if (siguiente.operacion) {
        const op = siguiente.operacion;
        const val = siguiente.valor || '?';
        let mensaje = `Pista: prueba a `;
        if (op === 'sumar') mensaje += `sumar ${val}`;
        else if (op === 'restar') mensaje += `restar ${val}`;
        else if (op === 'multiplicar') mensaje += `multiplicar por ${val}`;
        else if (op === 'dividir') mensaje += `dividir entre ${val}`;
        mensaje += ` en ambos lados.`;
        mostrarFeedbackPractica(mensaje, 'info');
    } else {
        mostrarFeedbackPractica('La siguiente acción no es una operación aritmética, revisa los pasos.', 'info');
    }
}

// ========== FUNCIONES DE UI ==========
function mostrarFeedbackPractica(mensaje, tipo) {
    if (!elFeedbackPractica) return;
    if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    elFeedbackPractica.textContent = mensaje;
    elFeedbackPractica.className = 'feedback';
    if (tipo === 'exito') elFeedbackPractica.classList.add('feedback-exito');
    else if (tipo === 'error') elFeedbackPractica.classList.add('feedback-error');
    else if (tipo === 'info') elFeedbackPractica.classList.add('feedback-info');
    elFeedbackPractica.classList.remove('hidden');
    feedbackTimeout = setTimeout(() => { elFeedbackPractica.classList.add('hidden'); feedbackTimeout = null; }, 4000);
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
    if (practicaState.tipo === 'guiada') {
        if (elBtnAccion) {
            if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
                elBtnAccion.disabled = true;
            } else {
                elBtnAccion.disabled = false;
            }
        }
        return;
    }

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
    const hintText = document.querySelector('.hint-text');
    if (operaciones) operaciones.style.display = visible ? 'flex' : 'none';
    if (numeroDiv) numeroDiv.style.display = visible ? 'flex' : 'none';
    if (hintText) hintText.style.display = visible ? 'block' : 'none';
}

function manejarBoton() {
    if (practicaState.tipo === 'guiada') {
        avanzarPasoGuiada();
    } else {
        if (practicaState.operacionPendiente) confirmarPaso();
        else realizarOperacion();
    }
}

// ========== CAMBIAR MODO ==========
function cambiarModo(modo) {
    modoActual = modo;
    const modoAlt = document.getElementById('mode-alternativas');
    const modoPract = document.getElementById('mode-practica');
    const modoGuiada = document.getElementById('mode-guiada');
    const seccionAlt = document.getElementById('modo-alternativas');
    const seccionPract = document.getElementById('modo-practica');

    if (seccionAlt) seccionAlt.style.display = modo === 'alternativas' ? 'block' : 'none';
    if (seccionPract) seccionPract.style.display = (modo === 'practica' || modo === 'guiada') ? 'block' : 'none';

    if (modoAlt) modoAlt.classList.toggle('active', modo === 'alternativas');
    if (modoPract) modoPract.classList.toggle('active', modo === 'practica');
    if (modoGuiada) modoGuiada.classList.toggle('active', modo === 'guiada');

    if (modo === 'alternativas') {
        nuevaPreguntaAlternativas();
    } else if (modo === 'practica') {
        iniciarPracticaInteractiva();
    } else if (modo === 'guiada') {
        iniciarPracticaGuiada();
    }
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
    if (!confirm('¿Seguro que quieres reiniciar tu nivel en Incógnita?')) return;
    await db.collection('usuarios').doc(window.uid).update({ 'incognita.nivel': 1, 'incognita.xp': 0, 'incognita.racha': 0, 'incognita.region': "Aldea de las Ecuaciones" });
    if (window.jugador) { window.jugador.incognita = { nivel: 1, xp: 0, racha: 0, region: "Aldea de las Ecuaciones" }; racha = 0; if (elRachaAlt) elRachaAlt.textContent = '0'; }
    actualizarUI();
    if (modoActual === 'alternativas') nuevaPreguntaAlternativas(); else if (modoActual === 'practica') iniciarPracticaInteractiva(); else iniciarPracticaGuiada();
    mostrarFeedback('¡Nivel reiniciado!', 'exito');
}

function esperarJugador() { if (window.jugador) iniciarJuego(); else setTimeout(esperarJugador, 100); }

// ========== INICIALIZACIÓN ==========
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
    elBtnPista = document.getElementById('btn-pista');

    let btnGuiada = document.getElementById('mode-guiada');
    if (!btnGuiada) {
        const modeSelector = document.querySelector('.mode-selector');
        if (modeSelector) {
            btnGuiada = document.createElement('button');
            btnGuiada.id = 'mode-guiada';
            btnGuiada.textContent = '👣 Guiada';
            modeSelector.appendChild(btnGuiada);
        }
    }

    if (elBtnAccion) {
        elBtnAccion.addEventListener('click', manejarBoton);
    }

    if (elBtnPista) {
        elBtnPista.addEventListener('click', mostrarPista);
    }

    elOperacionBtns = document.querySelectorAll('.operacion-btn');
    elOperacionBtns.forEach(btn => btn.addEventListener('click', () => {
        if (practicaState.tipo !== 'interactiva') return;
        if (practicaState.operacionPendiente) return;
        elOperacionBtns.forEach(b => b.classList.remove('seleccionado'));
        btn.classList.add('seleccionado');
        actualizarBoton();
    }));
    if (elNumeroPractica) {
        elNumeroPractica.addEventListener('input', () => {
            if (practicaState.tipo !== 'interactiva') return;
            if (practicaState.operacionPendiente) return;
            actualizarBoton();
        });
    }

    if (window.jugador) { const inc = window.jugador.incognita || {}; racha = inc.racha || 0; if (elRachaAlt) elRachaAlt.textContent = racha; actualizarUI(); }

    document.getElementById('mode-alternativas').addEventListener('click', () => cambiarModo('alternativas'));
    document.getElementById('mode-practica').addEventListener('click', () => cambiarModo('practica'));
    if (btnGuiada) btnGuiada.addEventListener('click', () => cambiarModo('guiada'));

    if (elNextPracticaBtn) elNextPracticaBtn.addEventListener('click', () => {
        if (practicaState.tipo === 'guiada') iniciarPracticaGuiada();
        else iniciarPracticaInteractiva();
    });

    document.getElementById('btn-logout').addEventListener('click', async () => { await firebase.auth().signOut(); sessionStorage.clear(); window.location.href = 'index.html'; });
    if (elBtnReiniciar) elBtnReiniciar.addEventListener('click', reiniciarNivel);

    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', () => { mostrarFeedback('¡Progreso guardado!', 'exito'); });

    cambiarModo('alternativas');
}

document.addEventListener('DOMContentLoaded', () => { if (window.jugador) iniciarJuego(); else esperarJugador(); });
