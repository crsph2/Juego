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
    // Si el objeto no tiene tipo pero tiene a,b,c, lo tratamos como 'simple'
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
            x: x
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
                x: nuevoC   // ← CORRECCIÓN: añadir x
            });
        }
        return pasos;
    }

    pasos.push({ tipo: 'error', texto: 'Ecuación no reconocida', ...ecuacion });
    return pasos;
}

// ========== GENERAR PASOS GUIADA ==========
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

// ========== MODO ALTERNATIVAS (sin cambios) ==========
// ... (resto del código de alternativas, responder, etc. se mantiene igual)
// Por brevedad, no copio todo el resto, pero debe incluir las funciones:
// generarPreguntaAlternativas, nuevaPreguntaAlternativas, responderAlternativa, mezclarArray
// y el resto de funciones (iniciarPracticaInteractiva, iniciarPracticaGuiada, avanzarPasoGuiada, etc.)
// que ya están corregidas en las partes mencionadas.

// ========== AVANZAR PASO GUIADA (ya corregida) ==========
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

    const ultimo = practicaState.historialLineas[practicaState.historialLineas.length - 1];
    if (!ultimo || ultimo.texto !== textoMostrar) {
        practicaState.historialLineas.push({ texto: textoMostrar, tipo: paso.tipo || 'paso' });
        console.log(`✅ Paso agregado (${paso.tipo}):`, textoMostrar);
    } else {
        console.warn('⚠️ Paso duplicado omitido:', textoMostrar);
    }

    mostrarHistorial();

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

// ========== RESTO DEL CÓDIGO (sin cambios, pero asegurar que existe) ==========
// ... (incluir todas las demás funciones como mostrarPista, mostrarFeedbackPractica, 
//      cambiarModo, iniciarJuego, etc., que ya están en tu archivo)
