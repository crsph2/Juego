// ============================================================
// sistemas.js – "Operación: Sistema" (VERSIÓN COMPLETA Y FUNCIONAL)
// ============================================================

const XP_POR_NIVEL = 100;
const MONEDAS_REWARDS = 200;
const MAX_PISTAS = 5;
const MAX_INTENTOS_GLOBAL = 5;

let graphZoom = 1;
let graphPanX = 0;
let graphPanY = 0;

// ========== GENERADORES DE SISTEMAS ==========
function generarSistemaSustitucion() {
    let x, y, m, b, a, c;
    let intentos = 0;
    do {
        x = Math.floor(Math.random() * 11) - 5;
        y = Math.floor(Math.random() * 11) - 5;
        m = Math.floor(Math.random() * 5) + 1;
        b = y - m * x;
        a = Math.floor(Math.random() * 5) + 1;
        c = a * x + y;
        intentos++;
    } while ((x === 0 && y === 0) || intentos < 3 || Math.abs(b) > 10 || Math.abs(c) > 20);

    let mStr = (m === 1) ? '' : (m === -1 ? '-' : m);
    let aStr = (a === 1) ? '' : (a === -1 ? '-' : a);
    const eq1 = `y = ${mStr}x + ${b}`;
    const eq2 = `${aStr}x + y = ${c}`;
    const pistas = [
        'Busca una ecuación donde una variable ya esté despejada.',
        `Sustituye y = ${mStr}x + ${b} en la segunda ecuación.`,
        `Obtendrás una ecuación con una sola variable: ${aStr}x + (${mStr}x + ${b}) = ${c}. Resuelve y luego encuentra y.`
    ];
    return { method: 'sustitucion', eq1, eq2, solX: x, solY: y, pistas };
}

function generarSistemaReduccion() {
    let x, y, a, b, c, d, e, f;
    let intentos = 0;
    do {
        x = Math.floor(Math.random() * 11) - 5;
        y = Math.floor(Math.random() * 11) - 5;
        let p = Math.floor(Math.random() * 5) + 1;
        b = p;
        e = -p;
        a = Math.floor(Math.random() * 5) + 1;
        d = Math.floor(Math.random() * 5) + 1;
        c = a * x + b * y;
        f = d * x + e * y;
        intentos++;
    } while ((x === 0 && y === 0) || Math.abs(c) > 30 || Math.abs(f) > 30 || intentos < 3);

    let aStr = (a === 1) ? '' : (a === -1 ? '-' : a);
    let bStr = (b === 1) ? '' : (b === -1 ? '-' : b);
    let dStr = (d === 1) ? '' : (d === -1 ? '-' : d);
    let eStr = (e === 1) ? '' : (e === -1 ? '-' : e);
    const eq1 = `${aStr}x + ${bStr}y = ${c}`;
    const eq2 = `${dStr}x + ${eStr}y = ${f}`;
    const pistas = [
        'Observa que los coeficientes de y son opuestos (suma las ecuaciones).',
        'Suma ambas ecuaciones para eliminar y.',
        `Obtendrás ${a+d}x = ${c+f}, luego x = ${x}. Sustituye para hallar y.`
    ];
    return { method: 'reduccion', eq1, eq2, solX: x, solY: y, pistas };
}

function generarSistemaIgualacion() {
    let x, y, m1, b1, m2, b2;
    let intentos = 0;
    do {
        x = Math.floor(Math.random() * 11) - 5;
        y = Math.floor(Math.random() * 11) - 5;
        m1 = Math.floor(Math.random() * 5) + 1;
        m2 = Math.floor(Math.random() * 5) + 1;
        if (m1 === m2) m2 = (m2 + 1) % 5 + 1;
        b1 = y - m1 * x;
        b2 = y - m2 * x;
        intentos++;
    } while ((x === 0 && y === 0) || Math.abs(b1) > 15 || Math.abs(b2) > 15 || intentos < 3);

    let m1Str = (m1 === 1) ? '' : (m1 === -1 ? '-' : m1);
    let m2Str = (m2 === 1) ? '' : (m2 === -1 ? '-' : m2);
    const eq1 = `y = ${m1Str}x + ${b1}`;
    const eq2 = `y = ${m2Str}x + ${b2}`;
    const pistas = [
        'Despeja y en ambas ecuaciones (ya lo están).',
        `Iguala las expresiones: ${m1Str}x + ${b1} = ${m2Str}x + ${b2}.`,
        `Resuelve: ${m1-m2}x = ${b2-b1}, x = ${x}. Sustituye para y.`
    ];
    return { method: 'igualacion', eq1, eq2, solX: x, solY: y, pistas };
}

function generarSistemaGrafico() {
    let x, y, m1, b1, m2, b2;
    let intentos = 0;
    do {
        x = Math.floor(Math.random() * 11) - 5;
        y = Math.floor(Math.random() * 11) - 5;
        m1 = Math.floor(Math.random() * 5) + 1;
        m2 = Math.floor(Math.random() * 5) + 1;
        if (m1 === m2) m2 = (m2 + 1) % 5 + 1;
        b1 = y - m1 * x;
        b2 = y - m2 * x;
        intentos++;
    } while ((x === 0 && y === 0) || Math.abs(b1) > 15 || Math.abs(b2) > 15 || intentos < 3);

    let m1Str = (m1 === 1) ? '' : (m1 === -1 ? '-' : m1);
    let m2Str = (m2 === 1) ? '' : (m2 === -1 ? '-' : m2);
    const eq1 = `y = ${m1Str}x + ${b1}`;
    const eq2 = `y = ${m2Str}x + ${b2}`;
    const correctPoint = { x, y };

    const distractors = [];
    const posibles = [
        { x: x + 1, y: y }, { x: x - 1, y: y }, { x, y: y + 1 }, { x, y: y - 1 },
        { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
        { x: y, y: x }
    ];
    const shuffled = posibles.sort(() => Math.random() - 0.5);
    for (let p of shuffled) {
        if (distractors.length >= 3) break;
        if (p.x !== correctPoint.x || p.y !== correctPoint.y) {
            if (!distractors.some(d => d.x === p.x && d.y === p.y)) {
                distractors.push(p);
            }
        }
    }
    while (distractors.length < 3) {
        let dx = Math.floor(Math.random() * 7) - 3;
        let dy = Math.floor(Math.random() * 7) - 3;
        if (dx !== 0 || dy !== 0) {
            if (!distractors.some(d => d.x === correctPoint.x + dx && d.y === correctPoint.y + dy)) {
                distractors.push({ x: correctPoint.x + dx, y: correctPoint.y + dy });
            }
        }
    }

    return { eq1, eq2, correctPoint, distractors };
}

function generarSistemaEstrategia() {
    let x, y, a, b, c, d, e, f;
    let intentos = 0;
    const metodos = ['sustitucion', 'reduccion', 'igualacion'];
    const metodoOptimo = metodos[Math.floor(Math.random() * metodos.length)];
    switch (metodoOptimo) {
        case 'sustitucion':
            do {
                x = Math.floor(Math.random() * 11) - 5;
                y = Math.floor(Math.random() * 11) - 5;
                let m = Math.floor(Math.random() * 5) + 1;
                let b1 = y - m * x;
                let a1 = Math.floor(Math.random() * 5) + 1;
                let c1 = a1 * x + y;
                if (Math.abs(b1) < 15 && Math.abs(c1) < 30) {
                    let mStr = (m === 1) ? '' : (m === -1 ? '-' : m);
                    let aStr = (a1 === 1) ? '' : (a1 === -1 ? '-' : a1);
                    const eq1 = `y = ${mStr}x + ${b1}`;
                    const eq2 = `${aStr}x + y = ${c1}`;
                    return { eq1, eq2, solX: x, solY: y, metodoOptimo: 'sustitucion', pistas: [] };
                }
                intentos++;
            } while (intentos < 20);
            break;
        case 'reduccion':
            do {
                x = Math.floor(Math.random() * 11) - 5;
                y = Math.floor(Math.random() * 11) - 5;
                let p = Math.floor(Math.random() * 5) + 1;
                let a1 = Math.floor(Math.random() * 5) + 1;
                let d1 = Math.floor(Math.random() * 5) + 1;
                let b1 = p;
                let e1 = -p;
                let c1 = a1 * x + b1 * y;
                let f1 = d1 * x + e1 * y;
                if (Math.abs(c1) < 30 && Math.abs(f1) < 30) {
                    let aStr = (a1 === 1) ? '' : (a1 === -1 ? '-' : a1);
                    let bStr = (b1 === 1) ? '' : (b1 === -1 ? '-' : b1);
                    let dStr = (d1 === 1) ? '' : (d1 === -1 ? '-' : d1);
                    let eStr = (e1 === 1) ? '' : (e1 === -1 ? '-' : e1);
                    const eq1 = `${aStr}x + ${bStr}y = ${c1}`;
                    const eq2 = `${dStr}x + ${eStr}y = ${f1}`;
                    return { eq1, eq2, solX: x, solY: y, metodoOptimo: 'reduccion', pistas: [] };
                }
                intentos++;
            } while (intentos < 20);
            break;
        case 'igualacion':
            do {
                x = Math.floor(Math.random() * 11) - 5;
                y = Math.floor(Math.random() * 11) - 5;
                let m1 = Math.floor(Math.random() * 5) + 1;
                let m2 = Math.floor(Math.random() * 5) + 1;
                if (m1 === m2) m2 = (m2 + 1) % 5 + 1;
                let b1 = y - m1 * x;
                let b2 = y - m2 * x;
                if (Math.abs(b1) < 15 && Math.abs(b2) < 15) {
                    let m1Str = (m1 === 1) ? '' : (m1 === -1 ? '-' : m1);
                    let m2Str = (m2 === 1) ? '' : (m2 === -1 ? '-' : m2);
                    const eq1 = `y = ${m1Str}x + ${b1}`;
                    const eq2 = `y = ${m2Str}x + ${b2}`;
                    return { eq1, eq2, solX: x, solY: y, metodoOptimo: 'igualacion', pistas: [] };
                }
                intentos++;
            } while (intentos < 20);
            break;
    }
    return {
        eq1: '2x + 3y = 8',
        eq2: '3x - y = 1',
        solX: 1,
        solY: 2,
        metodoOptimo: 'reduccion',
        pistas: []
    };
}

// ========== FUNCIONES AUXILIARES ==========
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function validarNumero(val) {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

function sonIguales(a, b) {
    if (a === undefined || b === undefined) return false;
    return Math.abs(a - b) < 1e-9;
}

function calcularEstrellas(errores, pistas) {
    if (errores === 0 && pistas === 0) return 3;
    if (errores <= 2 && pistas <= 1) return 2;
    return 1;
}

function formatearTiempo(segundos) {
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ========== ESTADO DEL JUEGO ==========
let gameState = {};
let elGameScreen = null;

function reiniciarEstado() {
    const misionesGuardadas = parseInt(localStorage.getItem('mathquest_misiones')) || 0;

    gameState = {
        currentScreen: 'START',
        bombas: {
            1: { completada: false, pistasUsadas: 0 },
            2: { completada: false, pistasUsadas: 0 },
            3: { completada: false, pistasUsadas: 0 }
        },
        grafico: { completada: false, intentos: 0 },
        estrategia: { completada: false, intentos: 0, metodoElegido: null },
        puntuacion: 0,
        erroresTotales: 0,
        aciertosTotales: 0,
        misionesCompletadas: misionesGuardadas,
        pistasDisponibles: MAX_PISTAS,
        pistasTotalesUsadas: 0,
        inicioTiempo: null,
        tiempoTotal: 0,
        ejercicios: {
            bomba1: null,
            bomba2: null,
            bomba3: null,
            grafico: null,
            estrategia: null
        },
        esperandoContinuar: false,
        faseEstrategia: 'metodo',
        metodoElegido: null,
        gameOver: false
    };
    gameState.ejercicios.bomba1 = generarSistemaSustitucion();
    gameState.ejercicios.bomba2 = generarSistemaReduccion();
    gameState.ejercicios.bomba3 = generarSistemaIgualacion();
    const grafico = generarSistemaGrafico();
    gameState.ejercicios.grafico = grafico;
    gameState.ejercicios.grafico.distractors = mezclarArray([...grafico.distractors]);
    gameState.ejercicios.estrategia = generarSistemaEstrategia();

    graphZoom = 1;
    graphPanX = 0;
    graphPanY = 0;
    actualizarContadorAciertos();
    actualizarContadorMisiones();
}

function actualizarContadorAciertos() {
    const el = document.getElementById('aciertos-contador');
    if (el) el.textContent = gameState.aciertosTotales || 0;
}

function actualizarContadorMisiones() {
    const el = document.getElementById('misiones-contador');
    if (el) el.textContent = gameState.misionesCompletadas || 0;
}

// ========== RENDERIZADO DE PANTALLAS ==========

function renderStart() {
    return `
        <div class="start-screen">
            <div class="title">💣 OPERACIÓN: SISTEMA</div>
            <div class="subtitle">Tu misión: desactivar el sistema antes de que sea demasiado tarde.</div>
            <button class="btn-start" id="btn-start-mission">COMENZAR MISIÓN</button>
            <div style="margin-top:1rem; display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
                <button class="rpg-button btn-secondary" id="btn-instructions">📖 Instrucciones</button>
                <button class="rpg-button btn-secondary" id="btn-sound-toggle">🔊 Sonido</button>
            </div>
        </div>
    `;
}

function renderIntro() {
    return `
        <div class="mission-intro">
            <p>🚨 Se ha activado el sistema de seguridad.</p>
            <p>💥 Hay 3 dispositivos que deben ser desactivados.</p>
            <p>🔐 Cada dispositivo está protegido por un sistema matemático.</p>
            <p>🧠 Encuentra la solución y utiliza el código para avanzar.</p>
            <button class="rpg-button btn-primary btn-mission" id="btn-start-mission">INICIAR</button>
        </div>
    `;
}

function renderBomba(num) {
    const ejercicio = gameState.ejercicios[`bomba${num}`];
    if (!ejercicio) return '<p>Error: ejercicio no encontrado</p>';
    const completada = gameState.bombas[num].completada;
    const methodNames = {
        sustitucion: 'SUSTITUCIÓN',
        reduccion: 'REDUCCIÓN',
        igualacion: 'IGUALACIÓN'
    };
    const methodLabel = methodNames[ejercicio.method] || 'MÉTODO';

    let feedbackHtml = '';
    let disabledAttr = completada ? 'disabled' : '';
    let inputDisabled = completada ? 'disabled' : '';
    let buttonText = completada ? '✅ Desactivada' : '💥 DESACTIVAR';

    if (completada) {
        feedbackHtml = `<div class="bomb-feedback success">✅ ¡Bomba desactivada! Solución: x = ${ejercicio.solX}, y = ${ejercicio.solY}</div>`;
    } else {
        const fb = gameState.bombas[num].feedback || '';
        if (fb) {
            const type = gameState.bombas[num].feedbackType || 'error';
            feedbackHtml = `<div class="bomb-feedback ${type}">${fb}</div>`;
        }
    }

    const fallosRestantes = MAX_INTENTOS_GLOBAL - gameState.erroresTotales;

    return `
        <div class="bomb-card">
            <div class="bomb-header">
                <span class="bomb-title">💣 BOMBA 0${num}</span>
                <span class="bomb-method">${methodLabel}</span>
                <span style="font-size:0.8rem; background:#333; color:#fff; padding:0.2rem 0.8rem; border-radius:10px;">Pistas restantes: ${gameState.pistasDisponibles}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin:5px 0;">
                <span style="background: #ff6b6b; color: #fff; padding: 0.2rem 0.8rem; border-radius: 20px; font-weight: bold;">
                    ⚠️ Fallos restantes: ${fallosRestantes}
                </span>
                <span style="background: #2e7d32; color: #fff; padding: 0.2rem 0.8rem; border-radius: 20px; font-weight: bold;">
                    ✅ Aciertos: ${gameState.aciertosTotales}
                </span>
            </div>
            <div class="bomb-system">
                <span class="eq">${ejercicio.eq1}</span>
                <span class="eq">${ejercicio.eq2}</span>
            </div>
            <div class="bomb-inputs">
                <label>x = <input type="number" id="input-x-${num}" step="any" ${inputDisabled}></label>
                <label>y = <input type="number" id="input-y-${num}" step="any" ${inputDisabled}></label>
            </div>
            ${feedbackHtml}
            <div class="bomb-actions">
                <button class="btn-disarm" id="btn-disarm-${num}" ${disabledAttr}>${buttonText}</button>
                ${!completada ? `<button class="btn-hint" id="btn-hint-${num}">💡 Pista (${gameState.pistasDisponibles})</button>` : ''}
                ${completada ? `<button class="rpg-button btn-secondary" id="btn-continue-${num}">CONTINUAR →</button>` : ''}
            </div>
        </div>
    `;
}

function renderGrafico() {
    const ejercicio = gameState.ejercicios.grafico;
    if (!ejercicio) return '<p>Error</p>';
    const completada = gameState.grafico.completada;

    let feedbackHtml = '';
    let optionsHtml = '';
    if (completada) {
        feedbackHtml = `<div class="bomb-feedback success">✅ ¡Correcto! El punto de intersección es (${ejercicio.correctPoint.x}, ${ejercicio.correctPoint.y}).</div>`;
        optionsHtml = `<div class="graph-options">
            ${ejercicio.distractors.map((d, i) => {
                const isCorrect = (d.x === ejercicio.correctPoint.x && d.y === ejercicio.correctPoint.y);
                return `<button class="${isCorrect ? 'correct' : ''}" disabled>${i+1}. (${d.x}, ${d.y})</button>`;
            }).join('')}
        </div>`;
    } else {
        const allOptions = [...ejercicio.distractors, ejercicio.correctPoint];
        const shuffled = mezclarArray([...allOptions]);
        optionsHtml = `<div class="graph-options" id="graph-options">
            ${shuffled.map((p, idx) => `
                <button data-x="${p.x}" data-y="${p.y}" data-idx="${idx}">(${p.x}, ${p.y})</button>
            `).join('')}
        </div>`;
        const fb = gameState.grafico.feedback || '';
        if (fb) {
            const type = gameState.grafico.feedbackType || 'error';
            feedbackHtml = `<div class="bomb-feedback ${type}">${fb}</div>`;
        }
    }

    return `
        <div class="graph-challenge">
            <h2 style="text-align:center;">📈 INTERCEPCIÓN</h2>
            <p style="text-align:center;">¿En qué punto se intersectan las dos funciones?</p>
            <div style="display:flex; justify-content:center; gap:0.5rem; margin:0.5rem 0; flex-wrap:wrap;">
                <button class="rpg-button btn-secondary" id="zoom-in" style="padding:0.2rem 0.8rem; font-size:1.2rem;">➕</button>
                <button class="rpg-button btn-secondary" id="zoom-out" style="padding:0.2rem 0.8rem; font-size:1.2rem;">➖</button>
                <button class="rpg-button btn-secondary" id="zoom-reset" style="padding:0.2rem 0.8rem; font-size:0.9rem;">⟲ Restablecer</button>
            </div>
            <div class="graph-container" id="graph-container" style="touch-action: none; overflow: auto; max-width: 100%; width:100%; position:relative; border:2px solid var(--card-border); border-radius:16px; background:var(--card-bg);">
                <canvas id="graph-canvas" width="1200" height="1200" style="width:100%; height:auto; display:block; image-rendering:auto; touch-action:none;"></canvas>
            </div>
            ${optionsHtml}
            ${feedbackHtml}
            ${completada ? `<div style="text-align:center; margin-top:1rem;"><button class="rpg-button btn-secondary" id="btn-continue-grafico">CONTINUAR →</button></div>` : ''}
        </div>
    `;
}

function renderEstrategia() {
    const ejercicio = gameState.ejercicios.estrategia;
    if (!ejercicio) return '<p>Error</p>';
    const fase = gameState.faseEstrategia;
    const completada = gameState.estrategia.completada;

    let html = `<div class="bomb-card"><h2 style="text-align:center;">🎯 DESAFÍO FINAL</h2>`;
    html += `<div class="bomb-system"><span class="eq">${ejercicio.eq1}</span><span class="eq">${ejercicio.eq2}</span></div>`;

    if (fase === 'metodo' && !completada) {
        html += `
            <p style="text-align:center; font-weight:500;">¿Qué estrategia utilizarías para resolver este sistema?</p>
            <div class="strategy-options" id="strategy-options">
                <button data-metodo="sustitucion">A. Sustitución</button>
                <button data-metodo="reduccion">B. Adición</button>
                <button data-metodo="igualacion">C. Igualación</button>
                <button data-metodo="grafico">D. Método gráfico</button>
            </div>
            <div id="feedback-estrategia" class="bomb-feedback"></div>
        `;
    } else if (fase === 'resolucion' && !completada) {
        html += `
            <p style="text-align:center;">Resuelve el sistema y escribe la solución:</p>
            <div class="bomb-inputs">
                <label>x = <input type="number" id="input-x-estrategia" step="any"></label>
                <label>y = <input type="number" id="input-y-estrategia" step="any"></label>
            </div>
            <div id="feedback-estrategia-res" class="bomb-feedback"></div>
            <div class="bomb-actions">
                <button class="btn-disarm" id="btn-resolver-estrategia">💥 RESOLVER</button>
            </div>
        `;
    } else if (completada) {
        html += `
            <div class="bomb-feedback success">✅ ¡Misión completada! Solución: x = ${ejercicio.solX}, y = ${ejercicio.solY}</div>
            <div style="text-align:center; margin-top:1rem;"><button class="rpg-button btn-secondary" id="btn-continue-estrategia">VER RESULTADOS</button></div>
        `;
    }

    html += `</div>`;
    return html;
}

function renderFinish() {
    const puntos = gameState.puntuacion;
    const errores = gameState.erroresTotales;
    const pistas = gameState.pistasTotalesUsadas;
    const tiempo = gameState.tiempoTotal;
    const estrellas = calcularEstrellas(errores, pistas);
    const starStr = '⭐'.repeat(estrellas) + '☆'.repeat(3 - estrellas);

    return `
        <div class="final-screen">
            <div class="big-icon">🎉</div>
            <h1 style="font-size:2.5rem; color:var(--btn-primary);">¡MISIÓN COMPLETADA!</h1>
            <div class="stars">${starStr}</div>
            <div class="score">🏆 Puntaje: ${puntos}</div>
            <div class="stats">
                <div class="stats-item">💣 Bombas desactivadas: <span>3/3</span></div>
                <div class="stats-item">✅ Aciertos totales: <span>${gameState.aciertosTotales}</span></div>
                <div class="stats-item">❌ Errores totales: <span>${errores}</span></div>
                <div class="stats-item">💡 Pistas utilizadas: <span>${pistas}</span></div>
                <div class="stats-item">💡 Pistas restantes: <span>${gameState.pistasDisponibles}</span></div>
                <div class="stats-item">🏆 Misiones completadas: <span>${gameState.misionesCompletadas}</span></div>
                <div class="stats-item">⏱️ Tiempo: <span>${formatearTiempo(tiempo)}</span></div>
            </div>
            <div style="margin:1rem 0; font-size:1.2rem; color:var(--btn-gold);">
                🪙 ¡Has ganado ${MONEDAS_REWARDS} monedas!
            </div>
            <div class="final-actions">
                <button class="rpg-button btn-primary" id="btn-replay">JUGAR NUEVAMENTE</button>
                <button class="rpg-button btn-secondary" id="btn-retry">REINTENTAR DESAFÍO</button>
                <button class="rpg-button btn-secondary" id="btn-back-lobby">VOLVER AL LOBBY</button>
            </div>
        </div>
    `;
}

function renderGameOver() {
    return `
        <div class="final-screen" style="background: #2d0000; border: 3px solid #ff0000; border-radius: 20px; padding: 2rem;">
            <div class="big-icon">💥</div>
            <h1 style="color: #ff4444; font-size: 2.5rem;">¡BOMBA EXPLOTADA!</h1>
            <p style="color: #ffaaaa; font-size: 1.3rem;">Has fallado en desactivar la bomba.</p>
            <p style="color: #ffaaaa;">La misión ha fracasado. Inténtalo de nuevo.</p>
            <div class="final-actions" style="margin-top: 1.5rem;">
                <button class="rpg-button btn-primary" id="btn-retry-gameover">REINTENTAR MISIÓN</button>
                <button class="rpg-button btn-secondary" id="btn-back-lobby-gameover">VOLVER AL LOBBY</button>
            </div>
        </div>
    `;
}

// ========== RENDERIZAR Y POST-RENDER ==========

function renderizar() {
    if (!elGameScreen) return;
    const screen = gameState.currentScreen;
    let html = '';

    switch (screen) {
        case 'START':
            html = renderStart();
            break;
        case 'INTRO':
            html = renderIntro();
            break;
        case 'BOMBA1':
        case 'BOMBA2':
        case 'BOMBA3':
            const num = parseInt(screen.replace('BOMBA', ''));
            html = renderBomba(num);
            break;
        case 'GRAFICO':
            html = renderGrafico();
            break;
        case 'ESTRATEGIA':
            html = renderEstrategia();
            break;
        case 'FINISH':
            html = renderFinish();
            break;
        case 'GAME_OVER':
            html = renderGameOver();
            break;
        default:
            html = '<p>Error: pantalla desconocida</p>';
    }

    elGameScreen.innerHTML = html;
    afterRender();
}

function afterRender() {
    const screen = gameState.currentScreen;

    // Botón de reinicio global
    document.getElementById('btn-reset-game')?.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres reiniciar la misión? Se perderá el progreso actual.')) {
            reiniciarEstado();
            gameState.currentScreen = 'START';
            renderizar();
            actualizarContadorAciertos();
            actualizarContadorMisiones();
        }
    });

    if (screen === 'GAME_OVER') {
        document.getElementById('btn-retry-gameover')?.addEventListener('click', () => {
            reiniciarEstado();
            gameState.currentScreen = 'START';
            renderizar();
        });
        document.getElementById('btn-back-lobby-gameover')?.addEventListener('click', () => {
            window.location.href = 'lobby.html';
        });
        return;
    }

    if (screen === 'START') {
        const btnStart = document.getElementById('btn-start-mission');
        if (btnStart) btnStart.addEventListener('click', () => {
            gameState.currentScreen = 'INTRO';
            renderizar();
        });
        const btnInst = document.getElementById('btn-instructions');
        if (btnInst) {
            btnInst.addEventListener('click', () => {
                alert('📖 Instrucciones:\n\nResuelve los sistemas de ecuaciones para desactivar las bombas.\nUsa los métodos de sustitución, reducción e igualación.\n¡Cuidado con los errores! Tienes 5 pistas en total.');
            });
        }
        const btnSound = document.getElementById('btn-sound-toggle');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const soundOn = localStorage.getItem('soundOn') !== 'false';
                localStorage.setItem('soundOn', String(!soundOn));
                btnSound.textContent = soundOn ? '🔇 Sonido' : '🔊 Sonido';
            });
        }
    }

    if (screen === 'INTRO') {
        const btnStart = document.getElementById('btn-start-mission');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                gameState.currentScreen = 'BOMBA1';
                gameState.inicioTiempo = Date.now();
                renderizar();
            });
        }
    }

    for (let i = 1; i <= 3; i++) {
        if (screen === `BOMBA${i}`) {
            const btnDisarm = document.getElementById(`btn-disarm-${i}`);
            if (btnDisarm) {
                btnDisarm.addEventListener('click', () => manejarBomba(i));
            }
            const btnHint = document.getElementById(`btn-hint-${i}`);
            if (btnHint) {
                btnHint.addEventListener('click', () => manejarPista(i));
            }
            const btnContinue = document.getElementById(`btn-continue-${i}`);
            if (btnContinue) {
                btnContinue.addEventListener('click', () => {
                    if (i === 1) gameState.currentScreen = 'BOMBA2';
                    else if (i === 2) gameState.currentScreen = 'GRAFICO';
                    else if (i === 3) gameState.currentScreen = 'ESTRATEGIA';
                    renderizar();
                });
            }
        }
    }

    if (screen === 'GRAFICO') {
        dibujarGrafico();

        document.getElementById('zoom-in')?.addEventListener('click', () => {
            graphZoom = Math.min(graphZoom * 1.4, 10);
            dibujarGrafico();
        });
        document.getElementById('zoom-out')?.addEventListener('click', () => {
            graphZoom = Math.max(graphZoom / 1.4, 0.2);
            dibujarGrafico();
        });
        document.getElementById('zoom-reset')?.addEventListener('click', () => {
            graphZoom = 1;
            graphPanX = 0;
            graphPanY = 0;
            dibujarGrafico();
        });

        const container = document.getElementById('graph-container');
        if (container) {
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                    graphZoom = Math.min(graphZoom * 1.2, 10);
                } else {
                    graphZoom = Math.max(graphZoom / 1.2, 0.2);
                }
                dibujarGrafico();
            }, { passive: false });
        }

        let isDragging = false;
        let startX, startY;
        const canvas = document.getElementById('graph-canvas');
        if (canvas) {
            // Mouse drag (pan)
            canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                canvas.style.cursor = 'grabbing';
            });
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = (e.clientX - startX) * 0.02 / graphZoom;
                    const dy = (e.clientY - startY) * 0.02 / graphZoom;
                    graphPanX += dx;
                    graphPanY -= dy;
                    startX = e.clientX;
                    startY = e.clientY;
                    dibujarGrafico();
                }
            });
            window.addEventListener('mouseup', () => {
                isDragging = false;
                if (canvas) canvas.style.cursor = 'grab';
            });

            // Touch events: zoom y pan con dedos
            let lastTouchDist = 0;
            let lastTouchX = 0;
            let lastTouchY = 0;
            let isTouchDragging = false;

            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (e.touches.length === 1) {
                    isTouchDragging = true;
                    lastTouchX = e.touches[0].clientX;
                    lastTouchY = e.touches[0].clientY;
                } else if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    lastTouchDist = Math.sqrt(dx*dx + dy*dy);
                }
            }, { passive: false });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length === 1 && isTouchDragging) {
                    const dx = (e.touches[0].clientX - lastTouchX) * 0.03 / graphZoom;
                    const dy = (e.touches[0].clientY - lastTouchY) * 0.03 / graphZoom;
                    graphPanX += dx;
                    graphPanY -= dy;
                    lastTouchX = e.touches[0].clientX;
                    lastTouchY = e.touches[0].clientY;
                    dibujarGrafico();
                } else if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (lastTouchDist > 0) {
                        const scale = dist / lastTouchDist;
                        const newZoom = graphZoom * scale;
                        graphZoom = Math.min(Math.max(newZoom, 0.1), 15);
                        dibujarGrafico();
                    }
                    lastTouchDist = dist;
                }
            }, { passive: false });

            canvas.addEventListener('touchend', (e) => {
                isTouchDragging = false;
                lastTouchDist = 0;
            });
        }

        if (!gameState.grafico.completada) {
            const options = document.querySelectorAll('#graph-options button');
            options.forEach(btn => {
                btn.addEventListener('click', () => manejarGrafico(btn));
            });
        } else {
            const btnCont = document.getElementById('btn-continue-grafico');
            if (btnCont) {
                btnCont.addEventListener('click', () => {
                    gameState.currentScreen = 'BOMBA3';
                    renderizar();
                });
            }
        }
    }

    if (screen === 'ESTRATEGIA') {
        if (gameState.faseEstrategia === 'metodo' && !gameState.estrategia.completada) {
            const opts = document.querySelectorAll('#strategy-options button');
            opts.forEach(btn => {
                btn.addEventListener('click', () => manejarEstrategiaMetodo(btn));
            });
        } else if (gameState.faseEstrategia === 'resolucion' && !gameState.estrategia.completada) {
            const btnRes = document.getElementById('btn-resolver-estrategia');
            if (btnRes) {
                btnRes.addEventListener('click', () => manejarEstrategiaResolucion());
            }
        } else if (gameState.estrategia.completada) {
            const btnCont = document.getElementById('btn-continue-estrategia');
            if (btnCont) {
                btnCont.addEventListener('click', () => {
                    finalizarMision();
                });
            }
        }
    }

    if (screen === 'FINISH') {
        document.getElementById('btn-replay')?.addEventListener('click', () => {
            reiniciarEstado();
            gameState.currentScreen = 'START';
            renderizar();
        });
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            reiniciarEstado();
            gameState.currentScreen = 'BOMBA1';
            renderizar();
        });
        document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
            window.location.href = 'lobby.html';
        });
    }
}

// ========== MANEJADORES DE ACCIONES ==========

function manejarBomba(num) {
    if (gameState.bombas[num].completada) return;
    if (gameState.gameOver) return;
    if (gameState.erroresTotales >= MAX_INTENTOS_GLOBAL) {
        gameState.gameOver = true;
        playSound('explosion');
        gameState.currentScreen = 'GAME_OVER';
        renderizar();
        return;
    }

    const ejercicio = gameState.ejercicios[`bomba${num}`];
    const inputX = document.getElementById(`input-x-${num}`);
    const inputY = document.getElementById(`input-y-${num}`);
    if (!inputX || !inputY) return;

    const xVal = validarNumero(inputX.value);
    const yVal = validarNumero(inputY.value);
    if (xVal === null || yVal === null) {
        gameState.bombas[num].feedback = '⚠️ Ingresa valores numéricos válidos.';
        gameState.bombas[num].feedbackType = 'error';
        renderizar();
        return;
    }

    const okX = sonIguales(xVal, ejercicio.solX);
    const okY = sonIguales(yVal, ejercicio.solY);

    if (okX && okY) {
        gameState.bombas[num].completada = true;
        gameState.bombas[num].feedback = '';
        const pistasUsadas = gameState.bombas[num].pistasUsadas;
        let puntos = 100;
        if (pistasUsadas === 1) puntos = 75;
        else if (pistasUsadas >= 2) puntos = 50;
        gameState.puntuacion += puntos;
        gameState.bombas[num].feedbackType = 'success';
        gameState.aciertosTotales++;
        actualizarContadorAciertos();
        playSound('success');
        renderizar();
    } else {
        gameState.erroresTotales++;
        let mensaje = '❌ Revisa tus cálculos.';
        if (sonIguales(xVal, ejercicio.solY) && sonIguales(yVal, ejercicio.solX)) {
            mensaje = '⚠️ Parece que has intercambiado x e y.';
        } else if (!okX && okY) {
            mensaje = '⚠️ Revisa el valor de x.';
        } else if (okX && !okY) {
            mensaje = '⚠️ Revisa el valor de y.';
        }
        if (gameState.erroresTotales >= 3 && gameState.pistasDisponibles > 0) {
            mensaje += ' ¿Necesitas una pista?';
        }
        gameState.bombas[num].feedback = mensaje;
        gameState.bombas[num].feedbackType = 'error';
        playSound('error');

        if (gameState.erroresTotales >= MAX_INTENTOS_GLOBAL) {
            gameState.gameOver = true;
            playSound('explosion');
            gameState.currentScreen = 'GAME_OVER';
            renderizar();
            return;
        }
        renderizar();
    }
}

function manejarPista(num) {
    if (gameState.bombas[num].completada) return;
    if (gameState.pistasDisponibles <= 0) {
        gameState.bombas[num].feedback = '⚠️ No te quedan más pistas.';
        gameState.bombas[num].feedbackType = 'error';
        renderizar();
        return;
    }
    const ejercicio = gameState.ejercicios[`bomba${num}`];
    const pistasUsadas = gameState.bombas[num].pistasUsadas;
    if (pistasUsadas >= ejercicio.pistas.length) {
        gameState.bombas[num].feedback = 'Ya no quedan más pistas para esta bomba.';
        gameState.bombas[num].feedbackType = 'error';
        renderizar();
        return;
    }
    const pista = ejercicio.pistas[pistasUsadas];
    gameState.bombas[num].pistasUsadas++;
    gameState.pistasDisponibles--;
    gameState.pistasTotalesUsadas++;
    gameState.bombas[num].feedback = `💡 Pista: ${pista}`;
    gameState.bombas[num].feedbackType = 'hint';
    renderizar();
}

function manejarGrafico(btn) {
    if (gameState.grafico.completada) return;
    const x = parseFloat(btn.dataset.x);
    const y = parseFloat(btn.dataset.y);
    const correct = gameState.ejercicios.grafico.correctPoint;
    if (sonIguales(x, correct.x) && sonIguales(y, correct.y)) {
        gameState.grafico.completada = true;
        gameState.grafico.feedback = '✅ ¡Correcto! La solución del sistema corresponde al punto de intersección.';
        gameState.grafico.feedbackType = 'success';
        gameState.puntuacion += 100;
        gameState.aciertosTotales++;
        actualizarContadorAciertos();
        playSound('success');
        renderizar();
    } else {
        gameState.grafico.intentos++;
        gameState.erroresTotales++;
        if (gameState.erroresTotales >= MAX_INTENTOS_GLOBAL) {
            gameState.gameOver = true;
            playSound('explosion');
            gameState.currentScreen = 'GAME_OVER';
            renderizar();
            return;
        }
        gameState.grafico.feedback = '❌ No es el punto correcto. Vuelve a intentarlo.';
        gameState.grafico.feedbackType = 'error';
        playSound('error');
        renderizar();
    }
}

function manejarEstrategiaMetodo(btn) {
    const metodo = btn.dataset.metodo;
    const ejercicio = gameState.ejercicios.estrategia;
    const feedback = document.getElementById('feedback-estrategia');
    if (!feedback) return;

    if (metodo === ejercicio.metodoOptimo) {
        feedback.textContent = '✅ ¡Excelente! Este es el método más conveniente. Ahora resuelve el sistema.';
        feedback.className = 'bomb-feedback success';
        gameState.faseEstrategia = 'resolucion';
        gameState.metodoElegido = metodo;
        gameState.puntuacion += 50;
        renderizar();
    } else {
        feedback.textContent = '⚠️ Esa estrategia también puede funcionar, pero no es la más eficiente. Intenta con otro método.';
        feedback.className = 'bomb-feedback error';
    }
}

function manejarEstrategiaResolucion() {
    const ejercicio = gameState.ejercicios.estrategia;
    const inputX = document.getElementById('input-x-estrategia');
    const inputY = document.getElementById('input-y-estrategia');
    const feedback = document.getElementById('feedback-estrategia-res');
    if (!inputX || !inputY || !feedback) return;

    const xVal = validarNumero(inputX.value);
    const yVal = validarNumero(inputY.value);
    if (xVal === null || yVal === null) {
        feedback.textContent = '⚠️ Ingresa valores numéricos válidos.';
        feedback.className = 'bomb-feedback error';
        return;
    }

    if (sonIguales(xVal, ejercicio.solX) && sonIguales(yVal, ejercicio.solY)) {
        gameState.estrategia.completada = true;
        gameState.puntuacion += 100;
        feedback.textContent = '✅ ¡Correcto! Has completado la misión.';
        feedback.className = 'bomb-feedback success';
        gameState.aciertosTotales++;
        actualizarContadorAciertos();
        playSound('success');
        renderizar();
    } else {
        gameState.erroresTotales++;
        if (gameState.erroresTotales >= MAX_INTENTOS_GLOBAL) {
            gameState.gameOver = true;
            playSound('explosion');
            gameState.currentScreen = 'GAME_OVER';
            renderizar();
            return;
        }
        let mensaje = '❌ Revisa tus cálculos.';
        if (sonIguales(xVal, ejercicio.solY) && sonIguales(yVal, ejercicio.solX)) {
            mensaje = '⚠️ Parece que has intercambiado x e y.';
        }
        feedback.textContent = mensaje;
        feedback.className = 'bomb-feedback error';
        playSound('error');
    }
}

function finalizarMision() {
    if (gameState.inicioTiempo) {
        gameState.tiempoTotal = (Date.now() - gameState.inicioTiempo) / 1000;
    }

    gameState.misionesCompletadas++;
    localStorage.setItem('mathquest_misiones', gameState.misionesCompletadas);
    actualizarContadorMisiones();

    guardarProgresoFirebase();
    gameState.currentScreen = 'FINISH';
    renderizar();
}

async function guardarProgresoFirebase() {
    if (!window.uid || !window.jugador) return;
    try {
        const estrellas = calcularEstrellas(gameState.erroresTotales, gameState.pistasTotalesUsadas);
        const nuevasMonedas = (window.jugador.monedas || 0) + MONEDAS_REWARDS;
        await db.collection('usuarios').doc(window.uid).update({
            monedas: nuevasMonedas,
            'sistemas.completado': true,
            'sistemas.puntuacion': gameState.puntuacion,
            'sistemas.estrellas': estrellas,
            'sistemas.bombasDesactivadas': 3,
            'sistemas.errores': gameState.erroresTotales,
            'sistemas.pistasUsadas': gameState.pistasTotalesUsadas,
            'sistemas.tiempo': gameState.tiempoTotal,
            historial: firebase.firestore.FieldValue.arrayUnion({
                juego: 'sistemas',
                puntuacion: gameState.puntuacion,
                estrellas: estrellas,
                errores: gameState.erroresTotales,
                pistas: gameState.pistasTotalesUsadas,
                fecha: new Date().toISOString()
            })
        });
        window.jugador.monedas = nuevasMonedas;
        window.jugador.sistemas = {
            completado: true,
            puntuacion: gameState.puntuacion,
            estrellas: estrellas,
            bombasDesactivadas: 3,
            errores: gameState.erroresTotales,
            pistasUsadas: gameState.pistasTotalesUsadas,
            tiempo: gameState.tiempoTotal
        };
        actualizarUICompleta();
        mostrarFeedback('🎉 ¡Misión completada! Has ganado 200 monedas.', 'exito');
    } catch (error) {
        console.error('Error al guardar progreso:', error);
    }
}

// ========== DIBUJAR GRÁFICO ==========

function dibujarGrafico() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const padding = 70;

    ctx.clearRect(0, 0, w, h);

    const ejercicio = gameState.ejercicios.grafico;
    const eq1 = ejercicio.eq1;
    const eq2 = ejercicio.eq2;

    function parseRecta(eq) {
        const parts = eq.split('=');
        if (parts.length !== 2) return { m: 1, b: 0 };
        const right = parts[1].trim();
        let m = 1, b = 0;
        const xIndex = right.indexOf('x');
        if (xIndex === -1) {
            b = parseFloat(right) || 0;
            m = 0;
        } else {
            const coef = right.substring(0, xIndex).trim();
            if (coef === '' || coef === '+') m = 1;
            else if (coef === '-') m = -1;
            else m = parseFloat(coef) || 1;
            const rest = right.substring(xIndex + 1).trim();
            if (rest.startsWith('+')) b = parseFloat(rest.substring(1)) || 0;
            else if (rest.startsWith('-')) b = parseFloat(rest) || 0;
            else b = parseFloat(rest) || 0;
        }
        return { m, b };
    }

    const rect1 = parseRecta(eq1);
    const rect2 = parseRecta(eq2);

    let xMin = -10, xMax = 10;
    const yMin = Math.min(rect1.m * xMin + rect1.b, rect2.m * xMin + rect2.b, -6);
    const yMax = Math.max(rect1.m * xMax + rect1.b, rect2.m * xMax + rect2.b, 6);

    const zoomFactor = 1 / graphZoom;
    const centerX = (xMin + xMax) / 2 + graphPanX;
    const centerY = (yMin + yMax) / 2 + graphPanY;
    const rangeX = (xMax - xMin) * zoomFactor;
    const rangeY = (yMax - yMin) * zoomFactor;
    const xMinZ = centerX - rangeX / 2;
    const xMaxZ = centerX + rangeX / 2;
    const yMinZ = centerY - rangeY / 2;
    const yMaxZ = centerY + rangeY / 2;

    const escala = Math.min((w - 2 * padding) / (xMaxZ - xMinZ), (h - 2 * padding) / (yMaxZ - yMinZ)) * 0.9;
    const midX = (xMinZ + xMaxZ) / 2;
    const midY = (yMinZ + yMaxZ) / 2;

    function toCanvas(px, py) {
        const xCanvas = padding + (w - 2 * padding) / 2 + (px - midX) * escala;
        const yCanvas = padding + (h - 2 * padding) / 2 - (py - midY) * escala;
        return { x: xCanvas, y: yCanvas };
    }

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    const origen = toCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(padding, origen.y);
    ctx.lineTo(w - padding, origen.y);
    ctx.moveTo(origen.x, padding);
    ctx.lineTo(origen.x, h - padding);
    ctx.stroke();

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const step = 1;
    for (let i = -20; i <= 20; i += step) {
        if (i === 0) continue;
        const px = toCanvas(i, 0).x;
        if (px > padding && px < w - padding) {
            ctx.beginPath();
            ctx.moveTo(px, padding);
            ctx.lineTo(px, h - padding);
            ctx.stroke();
        }
        const py = toCanvas(0, i).y;
        if (py > padding && py < h - padding) {
            ctx.beginPath();
            ctx.moveTo(padding, py);
            ctx.lineTo(w - padding, py);
            ctx.stroke();
        }
    }

    function dibujarRecta(m, b, color) {
        const x1 = xMinZ;
        const x2 = xMaxZ;
        const y1 = m * x1 + b;
        const y2 = m * x2 + b;
        const p1 = toCanvas(x1, y1);
        const p2 = toCanvas(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    dibujarRecta(rect1.m, rect1.b, '#e74c3c');
    dibujarRecta(rect2.m, rect2.b, '#3498db');

    ctx.fillStyle = '#333';
    ctx.font = '18px sans-serif';
    ctx.fillText('x', w - padding + 15, origen.y + 8);
    ctx.fillText('y', origen.x + 8, padding - 15);

    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    for (let i = -10; i <= 10; i++) {
        if (i === 0) continue;
        const px = toCanvas(i, 0).x;
        if (px > padding && px < w - padding) {
            ctx.fillText(i, px - 8, origen.y + 25);
        }
        const py = toCanvas(0, i).y;
        if (py > padding && py < h - padding) {
            ctx.fillText(i, origen.x + 10, py + 5);
        }
    }
}

// ========== SONIDO ==========

function playSound(type) {
    if (localStorage.getItem('soundOn') === 'false') return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'success') {
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.value = 1100;
                gain2.gain.value = 0.3;
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.15);
            }, 150);
        } else if (type === 'error') {
            osc.frequency.value = 300;
            gain.gain.value = 0.2;
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'explosion') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        } else {
            osc.frequency.value = 600;
            gain.gain.value = 0.2;
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    } catch (e) { /* Silenciar errores de audio */ }
}

// ========== INICIALIZACIÓN ==========

function cargarEstadoDesdeFirebase() {
    reiniciarEstado();
}

function iniciarJuego() {
    elGameScreen = document.getElementById('game-screen');
    if (!elGameScreen) {
        console.error('No se encontró #game-screen');
        return;
    }

    const regionEl = document.getElementById('player-region');
    if (regionEl) {
        regionEl.textContent = '🚀 Misión: Sistemas';
    }

    if (!window.jugador) {
        document.addEventListener('jugador-cargado', () => {
            cargarEstadoDesdeFirebase();
            renderizar();
        });
    } else {
        cargarEstadoDesdeFirebase();
        renderizar();
    }

    const btnEdit = document.getElementById('btn-edit-name');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            if (window.jugador) {
                const nuevo = prompt('Nuevo nombre:', window.jugador.nombre);
                if (nuevo && nuevo.trim()) {
                    db.collection('usuarios').doc(window.uid).update({ nombre: nuevo.trim() })
                        .then(() => {
                            window.jugador.nombre = nuevo.trim();
                            sessionStorage.setItem('mathquest_nombre', nuevo.trim());
                            actualizarUICompleta();
                            mostrarFeedback('Nombre actualizado', 'exito');
                        });
                }
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm('¿Cerrar sesión?')) {
                await firebase.auth().signOut();
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.jugador) {
        iniciarJuego();
    } else {
        document.addEventListener('jugador-cargado', iniciarJuego);
    }
});

setTimeout(() => {
    if (!window.jugador) {
        console.warn('Recargando jugador...');
        cargarJugador();
    }
}, 2000);
