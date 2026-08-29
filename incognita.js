// ============================================================
// incognita.js – Lógica del juego "¿Dónde está la incógnita?"
// ============================================================

const XP_POR_NIVEL = 100;

// Regiones por nivel
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

// Utilidades para formatear fracciones en HTML
function fraccionHTML(num, den) {
    return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
}

// Formateador inteligente
function formatearEcuacionSimple(ecuacion, letra = 'x') {
    let left = '';

    // CASO COMPLEJO (A - x)/B + (C*x)/D = (x - E)/F
    if (ecuacion.tipo === 'compleja') {
        let { A, B, C, D, E, F } = ecuacion;
        
        let term1 = (A === 0) ? '0' : `${A} - ${letra}`;
        let term2 = (C === 0) ? '0' : `${C}${letra}`;
        let term3 = `${letra} - ${E}`;
        
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

// Generador de ecuaciones con límite de dificultad opcional
function generarEcuacionLineal(maxDificultad = 5) {
    let nivel = window.jugador.incognita.nivel || 1;
    let dificultad;
    if (nivel === 1) dificultad = 1;
    else if (nivel >= 2 && nivel <= 3) dificultad = 2;
    else if (nivel >= 4 && nivel <= 5) dificultad = 3;
    else if (nivel >= 6 && nivel <= 9) dificultad = 4;
    else dificultad = 5;

    // Forzar dificultad máxima si se pasa parámetro
    if (dificultad > maxDificultad) dificultad = maxDificultad;

    // Dificultad 1: x + b = c
    if (dificultad === 1) {
        let x = Math.floor(Math.random() * 10) - 5;
        let b = Math.floor(Math.random() * 9) - 4;
        if (b === 0) b = 1;
        let c = x + b;
        return { tipo: 'simple', a: 1, b, c, d: 1, x };
    }
    // Dificultad 2: ax + b = c
    else if (dificultad === 2) {
        let x = Math.floor(Math.random() * 10) - 5;
        let a = Math.floor(Math.random() * 4) + 2;
        let b = Math.floor(Math.random() * 10) - 5;
        if (b === 0) b = 1;
        let c = a * x + b;
        return { tipo: 'simple', a, b, c, d: 1, x };
    }
    // Dificultad 3: x/d + b = c
    else if (dificultad === 3) {
        let d = Math.floor(Math.random() * 5) + 2;
        let k = Math.floor(Math.random() * 10) - 5;
        let b = Math.floor(Math.random() * 10) - 5;
        if (b === 0) b = 1;
        let x = d * k;
        let c = k + b;
        return { tipo: 'simple', a: 1, b, c, d, x };
    }
    // Dificultad 4 y 5: (A - x)/B + (C*x)/D = (x - E)/F
    else {
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

// ========== GENERACIÓN DE PASOS PARA PRÁCTICA INTERACTIVA (solo simple) ==========
function generarPasosInteractiva(ecuacion) {
    const pasos = [];
    const { tipo, a, b, c, d, x } = ecuacion;

    if (tipo === 'simple' && d && d !== 1) {
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), ...ecuacion });
        let constante = c - b;
        pasos.push({ tipo: 'mover_constante', operacion: b > 0 ? 'restar' : 'sumar', valor: Math.abs(b), ...ecuacion, texto: `${fraccionHTML('x', d)} = ${constante}` });
        pasos.push({ tipo: 'multiplicar', operacion: 'multiplicar', valor: d, ...ecuacion, texto: `x = ${constante * d}` });
        pasos.push({ tipo: 'solucion', x, texto: `x = ${x}` });
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
            pasos.push({ tipo: 'mover_constante', operacion, valor, a, b: nuevoB, c: nuevoC, texto: `${a}x = ${nuevoC}` });
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

    // Fallback
    pasos.push({ tipo: 'original', texto: 'Ecuación no reconocida', ...ecuacion });
    return pasos;
}

// ========== GENERACIÓN DE PASOS PARA PRÁCTICA GUIADA (compleja) ==========
function generarPasosGuiada(ecuacion) {
    const pasos = [];
    const { tipo, a, b, c, d, x } = ecuacion;

    // Para ecuaciones simples también se puede usar, pero la guiada está pensada para complejas
    // Pero si es simple, usamos la misma lógica que interactiva
    if (tipo === 'simple') {
        return generarPasosInteractiva(ecuacion);
    }

    // --- Caso complejo (con fracciones) ---
    if (tipo === 'compleja') {
        let { A, B, C, D, E, F, x } = ecuacion;

        // 1. Ecuación original
        pasos.push({ tipo: 'original', texto: formatearEcuacionSimple(ecuacion), ...ecuacion });

        // 2. Calcular MCM de B, D, F
        const mcm = (a, b) => {
            const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
            return Math.abs(a * b) / gcd(a, b);
        };
        let M = mcm(B, D);
        M = mcm(M, F);

        // 3. Multiplicar ambos lados por M
        let nuevaEq = aplicarOperacion(ecuacion, 'multiplicar', M);
        let textoMul = `Multiplicar ambos lados por ${M}:`;
        pasos.push({
            tipo: 'multiplicar',
            operacion: 'multiplicar',
            valor: M,
            texto: textoMul,
            resultado: formatearEcuacionSimple(nuevaEq),
            ...nuevaEq
        });
        let eqActual = nuevaEq;

        // 4. Distribuir y combinar términos semejantes
        let newA = A * (M / B);
        let newC = C * (M / D);
        let newE = E * (M / F);
        let coefX = newC - (M / B);
        let a_simple = coefX - (M / F);
        let c_simple = -newE - newA;
        if (a_simple === 0) a_simple = 1;

        let textoDist = `Distribuir y combinar términos semejantes:`;
        pasos.push({
            tipo: 'distribuir',
            operacion: 'distribuir',
            valor: 0,
            texto: textoDist,
            resultado: `${a_simple}x = ${c_simple}`,
            a: a_simple,
            b: 0,
            c: c_simple,
            x: x
        });

        // 5. Dividir por el coeficiente
        let eqSimple = { tipo: 'simple', a: a_simple, b: 0, c: c_simple, d: 1, x: x };
        let valorDiv = a_simple;
        let nuevaEqDiv = aplicarOperacion(eqSimple, 'dividir', valorDiv);
        pasos.push({
            tipo: 'dividir',
            operacion: 'dividir',
            valor: valorDiv,
            texto: `Dividir ambos lados por ${valorDiv}:`,
            resultado: formatearEcuacionSimple(nuevaEqDiv),
            ...nuevaEqDiv
        });

        // Solución final
        pasos.push({ tipo: 'solucion', x: x, texto: `x = ${x}` });

        return pasos;
    }

    // Fallback
    pasos.push({ tipo: 'original', texto: 'Ecuación no reconocida', ...ecuacion });
    return pasos;
}

// Aplica la operación elegida por el usuario en práctica (con lógica matemática exacta)
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

// ========== PRÁCTICA INTERACTIVA (original, solo dificultades 1-3) ==========
let practicaState = {
    pasos: [],
    pasoActual: 0,
    historialLineas: [],
    operacionPendiente: null,
    eq: null,
    tipo: 'interactiva' // o 'guiada'
};

function iniciarPracticaInteractiva() {
    // Forzar dificultad máxima 3
    const eq = generarEcuacionLineal(3);
    practicaState.eq = eq;
    practicaState.pasos = generarPasosInteractiva(eq);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [{ texto: formatearEcuacionSimple(eq), tipo: 'original' }];
    practicaState.tipo = 'interactiva';

    // Mostrar controles de operación y número
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

// ========== PRÁCTICA GUIADA (demostrativa, sin recompensas) ==========
function iniciarPracticaGuiada() {
    const eq = generarEcuacionLineal(); // sin límite
    practicaState.eq = eq;
    practicaState.pasos = generarPasosGuiada(eq);
    practicaState.pasoActual = 0;
    practicaState.operacionPendiente = null;
    practicaState.historialLineas = [];
    practicaState.tipo = 'guiada';

    // Mostrar solo el primer paso
    if (practicaState.pasos.length > 0) {
        practicaState.historialLineas.push({ texto: practicaState.pasos[0].texto || formatearEcuacionSimple(eq), tipo: 'original' });
    }

    // Ocultar controles de operación y número
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

    mostrarHistorial();
    // Si ya estamos en el último paso (solución), deshabilitar botón
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        if (elBtnAccion) elBtnAccion.disabled = true;
    }
    mostrarControles(false);
}

function mostrarHistorial() {
    if (!elHistorialPasos) return;
    elHistorialPasos.innerHTML = '';
    practicaState.historialLineas.forEach(linea => {
        const div = document.createElement('div');
        div.className = 'ecuacion-linea';
        if (linea.tipo === 'operacion' || linea.tipo === 'multiplicar' || linea.tipo === 'dividir' || linea.tipo === 'distribuir' || linea.tipo === 'mover_constante') {
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

// Funciones para el modo interactivo (confirmar paso, etc.)
function confirmarPaso() {
    if (!practicaState.operacionPendiente) return;
    const pendiente = practicaState.operacionPendiente;
    const ecuacionAplicada = pendiente.ecuacionAplicada;
    const textoSimplificado = formatearEcuacionSimple(ecuacionAplicada);

    const pasoEsperado = practicaState.pasos[practicaState.pasoActual + 1];
    let esCorrecto = false;
    if (pasoEsperado && (pasoEsperado.tipo === 'mover_constante' || pasoEsperado.tipo === 'dividir' || pasoEsperado.tipo === 'multiplicar' || pasoEsperado.tipo === 'restar')) {
        esCorrecto = (pendiente.operacion === pasoEsperado.operacion && pendiente.numero === pasoEsperado.valor);
    }

    if (!esCorrecto) {
        practicaState.historialLineas.pop();
        practicaState.operacionPendiente = null;
        mostrarHistorial(); resetearControles(); actualizarBoton();
        mostrarFeedbackPractica('❌ Ese paso no es correcto. Intenta de nuevo.', 'error');
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

        // Recompensas solo en modo interactivo
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
        if (elBtnAccion) elBtnAccion.style.display = 'none';
        mostrarControles(false); elBtnAccion.disabled = true;
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

    const ecuacionActual = practicaState.pasos[practicaState.pasoActual];
    if (!ecuacionActual || ecuacionActual.tipo === 'solucion') { mostrarFeedbackPractica('No hay más pasos.', 'error'); return; }

    const ecuacionAplicada = aplicarOperacion(ecuacionActual, operacion, num);
    const textoOperacion = formatearEcuacionConOperacion(ecuacionActual, operacion, num);

    practicaState.operacionPendiente = { operacion, numero: num, ecuacionOriginal: ecuacionActual, ecuacionAplicada: ecuacionAplicada, textoOperacion: textoOperacion };
    practicaState.historialLineas.push({ texto: textoOperacion, tipo: 'operacion' });
    mostrarHistorial();
    actualizarBoton();
}

// ---------- Funciones de UI y controles ----------
function mostrarFeedbackPractica(mensaje, tipo) {
    if (!elFeedbackPractica) return;
    if (feedbackTimeout) { clearTimeout(feedbackTimeout); feedbackTimeout = null; }
    elFeedbackPractica.textContent = mensaje;
    elFeedbackPractica.className = 'feedback';
    if (tipo === 'exito') elFeedbackPractica.classList.add('feedback-exito');
    else if (tipo === 'error') elFeedbackPractica.classList.add('feedback-error');
    elFeedbackPractica.classList.remove('hidden');
    feedbackTimeout = setTimeout(() => { elFeedbackPractica.classList.add('hidden'); feedbackTimeout = null; }, 3000);
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
        // En modo guiada, el botón siempre está habilitado si hay pasos restantes
        if (elBtnAccion) {
            if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
                elBtnAccion.disabled = true;
            } else {
                elBtnAccion.disabled = false;
            }
        }
        return;
    }

    // Modo interactivo
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
    if (practicaState.tipo === 'guiada') {
        avanzarPasoGuiada();
    } else {
        if (practicaState.operacionPendiente) confirmarPaso();
        else realizarOperacion();
    }
}

// Función para avanzar en modo guiada
function avanzarPasoGuiada() {
    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        mostrarFeedbackPractica('Ya has completado todos los pasos.', 'exito');
        if (elBtnAccion) elBtnAccion.disabled = true;
        return;
    }

    practicaState.pasoActual++;
    const paso = practicaState.pasos[practicaState.pasoActual];
    if (!paso) return;

    let textoMostrar = paso.texto || '';
    if (paso.resultado) {
        textoMostrar += `<br><span style="font-weight:bold;">${paso.resultado}</span>`;
    }
    practicaState.historialLineas.push({ texto: textoMostrar, tipo: paso.tipo || 'paso' });
    mostrarHistorial();

    if (practicaState.pasoActual >= practicaState.pasos.length - 1) {
        if (elBtnAccion) elBtnAccion.disabled = true;
        // No hay recompensas en modo guiada
        if (elMensajeExito) {
            elMensajeExito.style.display = 'block';
            if (elTextoSolucion) elTextoSolucion.textContent = `x = ${practicaState.eq.x}`;
        }
        if (elNextPracticaBtn) elNextPracticaBtn.style.display = 'block';
        mostrarFeedbackPractica('🎉 ¡Ecuación resuelta! (Práctica guiada)', 'exito');
    } else {
        mostrarFeedbackPractica('✅ Paso completado.', 'exito');
    }
}

// Cambiar entre modos
function cambiarModo(modo) {
    modoActual = modo;
    const modoAlt = document.getElementById('modo-alternativas');
    const modoPract = document.getElementById('modo-practica');
    const modoGuiada = document.getElementById('mode-guiada');
    const btnAlt = document.getElementById('mode-alternativas');
    const btnPract = document.getElementById('mode-practica');
    const btnGuiada = document.getElementById('mode-guiada');

    // Ocultar/mostrar secciones
    const seccionAlt = document.getElementById('modo-alternativas');
    const seccionPract = document.getElementById('modo-practica');
    // La sección de práctica es la misma para ambos modos, pero cambia el comportamiento
    // Usamos el mismo contenedor, pero cambiamos la lógica interna

    if (seccionAlt) seccionAlt.style.display = modo === 'alternativas' ? 'block' : 'none';
    if (seccionPract) seccionPract.style.display = (modo === 'practica' || modo === 'guiada') ? 'block' : 'none';

    if (btnAlt) btnAlt.classList.toggle('active', modo === 'alternativas');
    if (btnPract) btnPract.classList.toggle('active', modo === 'practica');
    if (btnGuiada) btnGuiada.classList.toggle('active', modo === 'guiada');

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

    // Crear botón de modo guiada si no existe en el HTML
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

    // Eventos de los botones de operación (para modo interactivo)
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

    // Listeners de los botones de modo
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
