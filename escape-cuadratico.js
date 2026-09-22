// ============================================================
// escape-cuadratico.js – "Escape Room Cuadrático"
// 5 niveles. Cada nivel tiene 3 puzzles. Cada puzzle revela
// un dígito del código que abre la puerta al siguiente nivel.
// ============================================================

const XP_POR_NIVEL = 100;
const XP_POR_PUZZLE = 25;
const MONEDAS_POR_PUZZLE = 15;
const MONEDAS_POR_NIVEL = 100;
const TOTAL_NIVELES = 5;
const PUZZLES_POR_NIVEL = 3;

const NIVELES_CONFIG = [
  {
    id: 1,
    nombre: "El aula abandonada",
    icono: "🏫",
    narrativa: "Despiertas en un aula polvorienta. La única puerta está cerrada con un candado de 3 dígitos. En la pizarra hay tres ecuaciones. Cada solución correcta revelará un dígito del código.",
    tipo: "factorizacion_simple"
  },
  {
    id: 2,
    nombre: "La caja fuerte",
    icono: "🔐",
    narrativa: "Entras al despacho del profesor. Sobre el escritorio hay una caja fuerte que necesita un código de 3 dígitos. Las ecuaciones requieren la fórmula general.",
    tipo: "formula_general"
  },
  {
    id: 3,
    nombre: "La azotea",
    icono: "🏙️",
    narrativa: "Subes a la azotea. Un dron deja caer paquetes siguiendo trayectorias parabólicas. ¿En qué momento tocan el suelo? Resuélvelo para desbloquear la siguiente puerta.",
    tipo: "tiro_parabolico"
  },
  {
    id: 4,
    nombre: "El espejo roto",
    icono: "🪞",
    narrativa: "Un espejo roto refleja ecuaciones distorsionadas. Algunas tienen solución doble, otras carecen de solución real. ¡Clasifícalas para romper el hechizo!",
    tipo: "discriminante_especial"
  },
  {
    id: 5,
    nombre: "La puerta final",
    icono: "🚪",
    narrativa: "Estás ante la puerta de salida. Un último desafío: tres ecuaciones que combinan todo lo aprendido. ¡Resuélvelas y escapa!",
    tipo: "integrador"
  }
];

// ====== ESTADO GLOBAL ======
let gameState = {};
let elGameScreen = null;
let elNombre, elNivel, elMonedas, elXpBarra, elXpTexto, elRegion, elFeedback;

// ====== UTILIDADES ======
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatPolinomio(a, b, c, letra = 'x') {
  let s = '';
  if (a === 1) s = `${letra}²`;
  else if (a === -1) s = `-${letra}²`;
  else s = `${a}${letra}²`;

  if (b !== 0) {
    if (b === 1) s += ` + ${letra}`;
    else if (b === -1) s += ` - ${letra}`;
    else if (b > 0) s += ` + ${b}${letra}`;
    else s += ` - ${Math.abs(b)}${letra}`;
  }

  if (c !== 0) {
    if (c > 0) s += ` + ${c}`;
    else s += ` - ${Math.abs(c)}`;
  }
  return s;
}

function formatEcuacion(a, b, c, letra = 'x') {
  return formatPolinomio(a, b, c, letra) + ' = 0';
}

function sonIguales(a, b) {
  if (isNaN(a) || isNaN(b)) return false;
  return Math.abs(a - b) < 1e-9;
}

function regionParaNivel(nivel) {
  if (nivel <= 2) return "Ala Este del Edificio";
  if (nivel <= 4) return "Ala Central";
  return "Ala Final";
}

// ====== GENERADORES DE PUZZLES ======

// Nivel 1: Factorización simple (a=1, raíces enteras no nulas)
function generarPuzzleFactorizacionSimple() {
  let r1, r2;
  do {
    r1 = randInt(-6, 6);
    r2 = randInt(-6, 6);
  } while (r1 === r2 || r1 === 0 || r2 === 0);
  const a = 1, b = -(r1 + r2), c = r1 * r2;
  return {
    tipoRespuesta: 'raices',
    enunciado: formatEcuacion(a, b, c),
    instruccion: 'Encuentra las dos raíces de la ecuación:',
    raices: [r1, r2],
    pista: `Busca dos números que sumados den ${-b} y multiplicados den ${c}.`
  };
}

// Nivel 2: Fórmula general
function generarPuzzleFormulaGeneral() {
  const variante = randChoice([1, 2]);
  let a, r1, r2;
  if (variante === 1) {
    a = 1;
    do {
      r1 = randInt(-9, 9);
      r2 = randInt(-9, 9);
    } while (r1 === r2 || r1 === 0 || r2 === 0);
  } else {
    a = randChoice([2, 3]);
    do {
      r1 = randInt(-5, 5);
      r2 = randInt(-5, 5);
    } while (r1 === r2 || r1 === 0 || r2 === 0);
  }
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  return {
    tipoRespuesta: 'raices',
    enunciado: formatEcuacion(a, b, c),
    instruccion: 'Aplica la fórmula general para encontrar las raíces:',
    raices: [r1, r2],
    pista: `a=${a}, b=${b}, c=${c}. Discriminante Δ = ${b*b - 4*a*c}.`
  };
}

// Nivel 3: Tiro parabólico
function generarPuzzleTiroParabolico() {
  let t, v, h0, intentos = 0;
  do {
    t = randInt(2, 6);
    v = randInt(5, 25);
    h0 = t * (5 * t - v);
    intentos++;
  } while ((h0 <= 0 || h0 > 100) && intentos < 50);
  if (h0 <= 0) { t = 3; v = 10; h0 = 15; }
  return {
    tipoRespuesta: 'tiempo',
    enunciado: `Un objeto se lanza desde ${h0} m de altura con velocidad inicial ${v} m/s.\nSu altura es h(t) = -5t² + ${v}t + ${h0}.`,
    instruccion: '¿En qué momento (en segundos) toca el suelo? (Introduce la raíz positiva)',
    respuesta: t,
    pista: `Resuelve -5t² + ${v}t + ${h0} = 0. Puedes reescribir como 5t² - ${v}t - ${h0} = 0.`
  };
}

// Nivel 4: Discriminante especial
function generarPuzzleDiscriminanteEspecial() {
  const variante = randChoice(['positivo', 'cero', 'negativo']);
  if (variante === 'positivo') {
    let r1, r2;
    do {
      r1 = randInt(-5, 5);
      r2 = randInt(-5, 5);
    } while (r1 === r2 || r1 === 0 || r2 === 0);
    const a = 1, b = -(r1 + r2), c = r1 * r2;
    return {
      tipoRespuesta: 'raices_con_especial',
      enunciado: formatEcuacion(a, b, c),
      instruccion: 'Encuentra las raíces. Si no tiene solución real, márcala como tal.',
      raices: [r1, r2],
      tieneSolucion: true,
      tipoSolucion: 'dos_soluciones',
      pista: `Δ = b² - 4ac = ${b*b - 4*a*c} > 0 → dos soluciones.`
    };
  } else if (variante === 'cero') {
    const r = randInt(-6, 6);
    const a = 1, b = -2 * r, c = r * r;
    return {
      tipoRespuesta: 'raices_con_especial',
      enunciado: formatEcuacion(a, b, c),
      instruccion: 'Encuentra las raíces. Si no tiene solución real, márcala como tal.',
      raices: [r, r],
      tieneSolucion: true,
      tipoSolucion: 'una_solucion',
      pista: `Δ = b² - 4ac = ${b*b - 4*a*c} = 0 → una solución doble (x₁ = x₂).`
    };
  } else {
    let a, b, c, disc, intentos = 0;
    do {
      a = 1;
      b = randInt(-8, 8);
      c = randInt(1, 10);
      disc = b * b - 4 * a * c;
      intentos++;
    } while (disc >= 0 && intentos < 50);
    if (disc >= 0) { a = 1; b = 0; c = 1; disc = -4; }
    return {
      tipoRespuesta: 'raices_con_especial',
      enunciado: formatEcuacion(a, b, c),
      instruccion: 'Encuentra las raíces. Si no tiene solución real, márcala como tal.',
      tieneSolucion: false,
      tipoSolucion: 'sin_solucion',
      pista: `Δ = b² - 4ac = ${disc} < 0 → no hay solución real.`
    };
  }
}

// Nivel 5: Integrador
function generarPuzzleIntegrador() {
  const tipo = randChoice(['fac_hard', 'formula_hard', 'tiro_hard', 'disc_hard']);
  switch (tipo) {
    case 'fac_hard': {
      const a = randChoice([2, 3, 4]);
      let r1, r2;
      do {
        r1 = randInt(-5, 5);
        r2 = randInt(-5, 5);
      } while (r1 === r2 || r1 === 0 || r2 === 0);
      const b = -a * (r1 + r2), c = a * r1 * r2;
      return {
        tipoRespuesta: 'raices',
        enunciado: formatEcuacion(a, b, c),
        instruccion: 'Resuelve la ecuación:',
        raices: [r1, r2],
        pista: `a=${a}, b=${b}, c=${c}. Factoriza o usa la fórmula general.`
      };
    }
    case 'formula_hard': {
      const a = randChoice([2, 3]);
      let r1, r2;
      do {
        r1 = randInt(-8, 8);
        r2 = randInt(-8, 8);
      } while (r1 === r2 || r1 === 0 || r2 === 0);
      const b = -a * (r1 + r2), c = a * r1 * r2;
      return {
        tipoRespuesta: 'raices',
        enunciado: formatEcuacion(a, b, c),
        instruccion: 'Resuelve la ecuación:',
        raices: [r1, r2],
        pista: `Usa la fórmula general con a=${a}, b=${b}, c=${c}. Δ = ${b*b - 4*a*c}.`
      };
    }
    case 'tiro_hard': {
      let t, v, h0, intentos = 0;
      do {
        t = randInt(3, 8);
        v = randInt(5, 30);
        h0 = t * (5 * t - v);
        intentos++;
      } while ((h0 <= 0 || h0 > 150) && intentos < 50);
      if (h0 <= 0) { t = 4; v = 15; h0 = 20; }
      return {
        tipoRespuesta: 'tiempo',
        enunciado: `Un objeto se lanza desde ${h0} m con velocidad ${v} m/s.\nAltura: h(t) = -5t² + ${v}t + ${h0}.`,
        instruccion: '¿Cuándo toca el suelo? (raíz positiva)',
        respuesta: t,
        pista: `Resuelve -5t² + ${v}t + ${h0} = 0.`
      };
    }
    case 'disc_hard': {
      let a, b, c, disc, intentos = 0;
      do {
        a = randChoice([2, 3]);
        b = randInt(-10, 10);
        c = randInt(1, 12);
        disc = b * b - 4 * a * c;
        intentos++;
      } while (disc >= 0 && intentos < 50);
      if (disc >= 0) { a = 2; b = 0; c = 1; disc = -8; }
      return {
        tipoRespuesta: 'raices_con_especial',
        enunciado: formatEcuacion(a, b, c),
        instruccion: 'Resuelve o indica si no hay solución real:',
        tieneSolucion: false,
        tipoSolucion: 'sin_solucion',
        pista: `Δ = b² - 4ac = ${disc} < 0.`
      };
    }
  }
}

function generarPuzzle(nivelId) {
  switch (nivelId) {
    case 1: return generarPuzzleFactorizacionSimple();
    case 2: return generarPuzzleFormulaGeneral();
    case 3: return generarPuzzleTiroParabolico();
    case 4: return generarPuzzleDiscriminanteEspecial();
    case 5: return generarPuzzleIntegrador();
    default: return generarPuzzleFactorizacionSimple();
  }
}

// ====== ESTADO DEL JUEGO ======
function iniciarEstado() {
  const nivelGuardado = (window.jugador && window.jugador.escapeCuadratico && window.jugador.escapeCuadratico.nivel) || 1;
  gameState = {
    estado: 'narrativa',
    nivelActual: Math.min(Math.max(nivelGuardado, 1), TOTAL_NIVELES),
    puzzles: [],
    puzzleActual: 0,
    codigo: [],
    digitosRevelados: [],
    pistasUsadasEnNivel: 0,
    erroresEnNivel: 0,
    aciertosTotales: 0,
    erroresTotales: 0,
    pistasTotales: 0,
    inicioNivel: Date.now(),
    tiempoTotalJugado: 0,
    respuestaEspecialSeleccionada: false
  };
}

// ====== CARGAR NIVEL ======
function cargarNivel() {
  const nivel = gameState.nivelActual;
  gameState.puzzles = [];
  gameState.puzzleActual = 0;
  gameState.digitosRevelados = [null, null, null];
  gameState.pistasUsadasEnNivel = 0;
  gameState.erroresEnNivel = 0;
  gameState.inicioNivel = Date.now();
  gameState.respuestaEspecialSeleccionada = false;

  const d1 = randInt(0, 9);
  let d2 = randInt(0, 9);
  while (d2 === d1) d2 = randInt(0, 9);
  let d3 = randInt(0, 9);
  while (d3 === d1 || d3 === d2) d3 = randInt(0, 9);
  gameState.codigo = [d1, d2, d3];

  for (let i = 0; i < PUZZLES_POR_NIVEL; i++) {
    const p = generarPuzzle(nivel);
    p.digito = gameState.codigo[i];
    gameState.puzzles.push(p);
  }
  gameState.estado = 'narrativa';
}

// ====== RENDERIZADO ======
function renderNarrativa() {
  const cfg = NIVELES_CONFIG[gameState.nivelActual - 1];
  return `
    <div class="narrativa-box">
      <div class="narrativa-icono">${cfg.icono}</div>
      <div class="narrativa-titulo">Nivel ${cfg.id}: ${cfg.nombre}</div>
      <div class="narrativa-texto">${cfg.narrativa}</div>
      <button class="rpg-button btn-primary" id="btn-comenzar-nivel" style="min-width: 200px;">COMENZAR →</button>
    </div>
  `;
}

function renderPuzzle() {
  const nivel = gameState.nivelActual;
  const cfg = NIVELES_CONFIG[nivel - 1];
  const puzzle = gameState.puzzles[gameState.puzzleActual];
  if (!puzzle) return '<p>Error: puzzle no encontrado</p>';
  const idx = gameState.puzzleActual;

  let digitosHTML = '';
  for (let i = 0; i < 3; i++) {
    const revelado = gameState.digitosRevelados[i] !== null;
    const val = revelado ? gameState.digitosRevelados[i] : '?';
    digitosHTML += `<div class="digito ${revelado ? 'revelado' : ''}">${val}</div>`;
  }

  let inputsHTML = '';
  if (puzzle.tipoRespuesta === 'raices') {
    inputsHTML = `
      <div class="inputs-raices">
        <div class="input-grupo">
          <label>x₁ =</label>
          <input type="number" id="input-r1" step="any" inputmode="numeric" autocomplete="off">
        </div>
        <div class="input-grupo">
          <label>x₂ =</label>
          <input type="number" id="input-r2" step="any" inputmode="numeric" autocomplete="off">
        </div>
      </div>
    `;
  } else if (puzzle.tipoRespuesta === 'tiempo') {
    inputsHTML = `
      <div class="inputs-raices">
        <div class="input-grupo">
          <label>t =</label>
          <input type="number" id="input-t" step="any" inputmode="numeric" autocomplete="off" style="width: 110px;">
        </div>
        <span style="font-weight: 700; color: var(--text-secondary);">segundos</span>
      </div>
    `;
  } else if (puzzle.tipoRespuesta === 'raices_con_especial') {
    inputsHTML = `
      <div class="inputs-raices">
        <div class="input-grupo">
          <label>x₁ =</label>
          <input type="number" id="input-r1" step="any" inputmode="numeric" autocomplete="off">
        </div>
        <div class="input-grupo">
          <label>x₂ =</label>
          <input type="number" id="input-r2" step="any" inputmode="numeric" autocomplete="off">
        </div>
      </div>
      <div style="text-align: center; margin: 0.8rem 0;">
        <button class="btn-especial" id="btn-sin-solucion">∅ No tiene solución real</button>
      </div>
    `;
  }

  const tieneContexto = puzzle.tipoRespuesta === 'tiempo';
  const contenidoPrincipal = tieneContexto
    ? `<div class="puzzle-contexto">${puzzle.enunciado}</div>`
    : `<div class="puzzle-ecuacion">${puzzle.enunciado}</div>`;

  return `
    <div class="progreso-nivel">
      <span>${cfg.icono} Nivel ${nivel}/${TOTAL_NIVELES}</span>
      <span>Puzzle ${idx + 1}/${PUZZLES_POR_NIVEL}</span>
    </div>
    <div class="codigo-panel">${digitosHTML}</div>
    <div class="puzzle-box">
      <div class="puzzle-instruccion">${puzzle.instruccion}</div>
      ${contenidoPrincipal}
      ${inputsHTML}
      <div id="feedback-local" class="feedback hidden"></div>
      <div class="puzzle-acciones">
        <button class="rpg-button btn-secondary" id="btn-pista" style="min-width: 120px;">💡 Pista</button>
        <button class="rpg-button btn-primary" id="btn-comprobar" style="min-width: 160px;">✓ COMPROBAR</button>
      </div>
    </div>
  `;
}

function renderNivelCompletado() {
  const cfg = NIVELES_CONFIG[gameState.nivelActual - 1];
  const codigoStr = gameState.codigo.join(' - ');
  const esUltimo = gameState.nivelActual >= TOTAL_NIVELES;
  return `
    <div class="nivel-completo-box">
      <div class="puerta">${esUltimo ? '🚪✨' : '🔓'}</div>
      <h2>¡Nivel ${gameState.nivelActual} completado!</h2>
      <p>El código era <strong style="font-family: 'Courier New', monospace; font-size: 1.4rem; color: var(--btn-primary);">${codigoStr}</strong></p>
      <p>${cfg.icono} Has superado <strong>${cfg.nombre}</strong>.</p>
      <div class="xp-reward-box">
        🎁 Recompensa: +${XP_POR_PUZZLE * PUZZLES_POR_NIVEL} XP · +${MONEDAS_POR_NIVEL} 🪙
      </div>
      <button class="rpg-button btn-primary" id="btn-siguiente-nivel" style="min-width: 220px; font-size: 1.2rem;">
        ${esUltimo ? '🏆 VER RESULTADO FINAL' : 'CONTINUAR →'}
      </button>
    </div>
  `;
}

function renderJuegoCompletado() {
  return `
    <div class="nivel-completo-box">
      <div class="puerta">🏆🎉</div>
      <h2>¡Has escapado!</h2>
      <p>Has completado los ${TOTAL_NIVELES} niveles del Escape Room Cuadrático.</p>
      <div class="stats-final">
        <div class="item">✅ Aciertos totales: <strong>${gameState.aciertosTotales}</strong></div>
        <div class="item">❌ Errores totales: <strong>${gameState.erroresTotales}</strong></div>
        <div class="item">💡 Pistas usadas: <strong>${gameState.pistasTotales}</strong></div>
        <div class="item">🪙 Monedas ganadas: <strong>+${MONEDAS_POR_NIVEL * TOTAL_NIVELES}</strong></div>
      </div>
      <button class="rpg-button btn-primary" id="btn-volver-lobby" style="min-width: 220px;">VOLVER AL LOBBY</button>
      <button class="rpg-button btn-secondary" id="btn-rejugar" style="min-width: 220px; margin-top: 0.6rem;">JUGAR DE NUEVO</button>
    </div>
  `;
}

function renderizar() {
  if (!elGameScreen) return;
  let html = '';
  switch (gameState.estado) {
    case 'narrativa': html = renderNarrativa(); break;
    case 'puzzle': html = renderPuzzle(); break;
    case 'nivel_completado': html = renderNivelCompletado(); break;
    case 'juego_completado': html = renderJuegoCompletado(); break;
    default: html = '<p>Error: estado desconocido</p>';
  }
  elGameScreen.innerHTML = html;
  actualizarUI();
  conectarEventos();
}

// ====== EVENTOS ======
function conectarEventos() {
  const est = gameState.estado;

  if (est === 'narrativa') {
    const btn = document.getElementById('btn-comenzar-nivel');
    if (btn) btn.addEventListener('click', () => {
      gameState.estado = 'puzzle';
      renderizar();
    });
  }

  else if (est === 'puzzle') {
    const btnComp = document.getElementById('btn-comprobar');
    const btnPista = document.getElementById('btn-pista');
    const btnSinSol = document.getElementById('btn-sin-solucion');

    if (btnComp) btnComp.addEventListener('click', comprobarRespuesta);
    if (btnPista) btnPista.addEventListener('click', usarPista);
    if (btnSinSol) btnSinSol.addEventListener('click', () => {
      gameState.respuestaEspecialSeleccionada = !gameState.respuestaEspecialSeleccionada;
      btnSinSol.classList.toggle('seleccionado', gameState.respuestaEspecialSeleccionada);
      const r1 = document.getElementById('input-r1');
      const r2 = document.getElementById('input-r2');
      if (r1) r1.disabled = gameState.respuestaEspecialSeleccionada;
      if (r2) r2.disabled = gameState.respuestaEspecialSeleccionada;
    });

    ['input-r1', 'input-r2', 'input-t'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') comprobarRespuesta();
      });
    });
  }

  else if (est === 'nivel_completado') {
    const btn = document.getElementById('btn-siguiente-nivel');
    if (btn) btn.addEventListener('click', () => {
      if (gameState.nivelActual >= TOTAL_NIVELES) {
        gameState.estado = 'juego_completado';
        finalizarJuego();
        renderizar();
      } else {
        gameState.nivelActual++;
        guardarProgresoFirebase();
        cargarNivel();
        renderizar();
      }
    });
  }

  else if (est === 'juego_completado') {
    const btnLobby = document.getElementById('btn-volver-lobby');
    if (btnLobby) btnLobby.addEventListener('click', () => window.location.href = 'lobby.html');
    const btnRejugar = document.getElementById('btn-rejugar');
    if (btnRejugar) btnRejugar.addEventListener('click', () => {
      if (confirm('¿Reiniciar todo el escape desde el nivel 1?')) {
        reiniciarEscape();
      }
    });
  }
}

// ====== LÓGICA DE RESPUESTA ======
function mostrarFeedbackLocal(msg, tipo) {
  const fb = document.getElementById('feedback-local');
  if (!fb) return;
  fb.textContent = msg;
  fb.className = 'feedback';
  if (tipo === 'exito') fb.classList.add('feedback-exito');
  else if (tipo === 'error') fb.classList.add('feedback-error');
  else fb.classList.add('feedback-info');
  fb.classList.remove('hidden');
}

function comprobarRespuesta() {
  const puzzle = gameState.puzzles[gameState.puzzleActual];
  if (!puzzle) return;
  let esCorrecta = false;
  let mensajeError = '';

  if (puzzle.tipoRespuesta === 'raices' || puzzle.tipoRespuesta === 'raices_con_especial') {
    const r1El = document.getElementById('input-r1');
    const r2El = document.getElementById('input-r2');
    if (!r1El || !r2El) return;

    if (puzzle.tipoRespuesta === 'raices_con_especial' && gameState.respuestaEspecialSeleccionada) {
      if (!puzzle.tieneSolucion) {
        esCorrecta = true;
      } else {
        mensajeError = 'Esta ecuación SÍ tiene solución real.';
      }
    } else {
      if (puzzle.tipoRespuesta === 'raices_con_especial' && !puzzle.tieneSolucion) {
        mensajeError = 'Esta ecuación NO tiene solución real. Márcala con el botón ∅.';
      } else {
        const v1 = parseFloat(r1El.value);
        const v2 = parseFloat(r2El.value);
        if (isNaN(v1) || isNaN(v2)) {
          mensajeError = 'Ingresa valores numéricos válidos.';
        } else {
          const [ra, rb] = puzzle.raices;
          const ok1 = (sonIguales(v1, ra) && sonIguales(v2, rb));
          const ok2 = (sonIguales(v1, rb) && sonIguales(v2, ra));
          if (ok1 || ok2) esCorrecta = true;
          else mensajeError = `Incorrecto. Revisa tus cálculos.`;
        }
      }
    }
  }

  else if (puzzle.tipoRespuesta === 'tiempo') {
    const tEl = document.getElementById('input-t');
    if (!tEl) return;
    const vt = parseFloat(tEl.value);
    if (isNaN(vt)) { mensajeError = 'Ingresa un valor numérico válido.'; }
    else if (sonIguales(vt, puzzle.respuesta)) { esCorrecta = true; }
    else { mensajeError = 'Incorrecto. Recuerda: la raíz positiva.'; }
  }

  if (esCorrecta) {
    gameState.aciertosTotales++;
    gameState.digitosRevelados[gameState.puzzleActual] = puzzle.digito;
    otorgarRecompensas(XP_POR_PUZZLE, MONEDAS_POR_PUZZLE);

    mostrarFeedbackLocal(`¡Correcto! Dígito revelado: ${puzzle.digito}`, 'exito');

    const btn = document.getElementById('btn-comprobar');
    if (btn) btn.disabled = true;
    setTimeout(() => {
      gameState.puzzleActual++;
      gameState.respuestaEspecialSeleccionada = false;
      if (gameState.puzzleActual >= PUZZLES_POR_NIVEL) {
        gameState.estado = 'nivel_completado';
        otorgarRecompensas(0, MONEDAS_POR_NIVEL);
        renderizar();
      } else {
        renderizar();
      }
    }, 1400);
  } else {
    gameState.erroresTotales++;
    gameState.erroresEnNivel++;
    mostrarFeedbackLocal('❌ ' + (mensajeError || 'Intenta de nuevo.'), 'error');
  }
}

function usarPista() {
  const puzzle = gameState.puzzles[gameState.puzzleActual];
  if (!puzzle) return;
  if (gameState.pistasUsadasEnNivel >= 3) {
    mostrarFeedbackLocal('Ya no puedes pedir más pistas en este nivel.', 'error');
    return;
  }
  gameState.pistasUsadasEnNivel++;
  gameState.pistasTotales++;
  mostrarFeedbackLocal('💡 ' + puzzle.pista, 'info');
}

// ====== RECOMPENSAS ======
function otorgarRecompensas(xp, monedas) {
  if (!window.jugador || !window.uid) return;
  const j = window.jugador;
  const ec = j.escapeCuadratico || { nivel: 1, xp: 0, monedasGanadas: 0 };
  ec.xp = (ec.xp || 0) + xp;
  ec.nivel = gameState.nivelActual;
  ec.monedasGanadas = (ec.monedasGanadas || 0) + monedas;
  j.escapeCuadratico = ec;
  j.monedas = (j.monedas || 0) + monedas;
  actualizarUI();
}

async function guardarProgresoFirebase() {
  if (!window.uid || !window.jugador) return;
  try {
    const j = window.jugador;
    const ec = j.escapeCuadratico || { nivel: 1, xp: 0, monedasGanadas: 0 };
    await db.collection('usuarios').doc(window.uid).update({
      monedas: j.monedas || 0,
      'escapeCuadratico.nivel': gameState.nivelActual,
      'escapeCuadratico.xp': ec.xp || 0,
      'escapeCuadratico.monedasGanadas': ec.monedasGanadas || 0,
      historial: firebase.firestore.FieldValue.arrayUnion({
        juego: 'escapeCuadratico',
        nivel: gameState.nivelActual,
        aciertos: gameState.aciertosTotales,
        errores: gameState.erroresTotales,
        fecha: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('Error al guardar progreso:', e);
  }
}

function finalizarJuego() {
  if (window.jugador && window.jugador.escapeCuadratico) {
    window.jugador.escapeCuadratico.completado = true;
  }
  if (window.uid) {
    db.collection('usuarios').doc(window.uid).update({
      'escapeCuadratico.completado': true,
      'escapeCuadratico.nivel': TOTAL_NIVELES
    }).catch(e => console.warn(e));
  }
}

// ====== UI GLOBAL ======
function actualizarUI() {
  if (!window.jugador) return;
  const j = window.jugador;
  if (elNombre) elNombre.textContent = j.nombre || 'Aventurero';
  if (elNivel) elNivel.textContent = gameState.nivelActual || 1;
  if (elMonedas) elMonedas.textContent = j.monedas || 0;
  if (elRegion) elRegion.textContent = regionParaNivel(gameState.nivelActual);
  if (elXpBarra && elXpTexto) {
    const ec = j.escapeCuadratico || { xp: 0 };
    const xpEnNivel = (ec.xp || 0) % XP_POR_NIVEL;
    elXpBarra.style.width = `${xpEnNivel}%`;
    elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
  }
}

function mostrarFeedback(msg, tipo) {
  if (!elFeedback) return;
  elFeedback.textContent = msg;
  elFeedback.className = 'feedback';
  if (tipo === 'exito') elFeedback.classList.add('feedback-exito');
  else if (tipo === 'error') elFeedback.classList.add('feedback-error');
  elFeedback.classList.remove('hidden');
  setTimeout(() => elFeedback.classList.add('hidden'), 3000);
}

// ====== REINICIAR ======
async function reiniciarEscape() {
  if (!window.uid) return;
  if (!confirm('¿Reiniciar el Escape Room desde el nivel 1? Perderás el progreso del escape, pero tus monedas y otros juegos se mantienen.')) return;
  try {
    await db.collection('usuarios').doc(window.uid).update({
      'escapeCuadratico.nivel': 1,
      'escapeCuadratico.xp': 0,
      'escapeCuadratico.completado': false
    });
    if (window.jugador) {
      window.jugador.escapeCuadratico = { nivel: 1, xp: 0, completado: false, monedasGanadas: 0 };
    }
    gameState.nivelActual = 1;
    gameState.aciertosTotales = 0;
    gameState.erroresTotales = 0;
    gameState.pistasTotales = 0;
    cargarNivel();
    renderizar();
    mostrarFeedback('¡Escape reiniciado!', 'exito');
  } catch (e) {
    console.error(e);
    alert('No se pudo reiniciar. Intenta de nuevo.');
  }
}

// ====== INICIALIZACIÓN ======
function iniciarJuego() {
  elGameScreen = document.getElementById('game-screen');
  elNombre = document.getElementById('player-name');
  elNivel = document.getElementById('player-level');
  elMonedas = document.getElementById('player-coins');
  elXpBarra = document.getElementById('xp-bar-fill');
  elXpTexto = document.getElementById('xp-text');
  elRegion = document.getElementById('player-region');
  elFeedback = document.getElementById('feedback-message');

  if (!elGameScreen) { console.error('No se encontró #game-screen'); return; }

  if (window.jugador && !window.jugador.escapeCuadratico) {
    window.jugador.escapeCuadratico = { nivel: 1, xp: 0, completado: false, monedasGanadas: 0 };
    if (window.uid) {
      db.collection('usuarios').doc(window.uid).update({
        escapeCuadratico: window.jugador.escapeCuadratico
      }).catch(e => console.warn(e));
    }
  }

  iniciarEstado();
  cargarNivel();
  renderizar();

  const btnReiniciar = document.getElementById('btn-reiniciar');
  if (btnReiniciar) btnReiniciar.addEventListener('click', reiniciarEscape);

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.addEventListener('click', async () => {
    if (confirm('¿Cerrar sesión?')) {
      await firebase.auth().signOut();
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  });

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
              actualizarUI();
              if (window.actualizarAvatar) window.actualizarAvatar();
              mostrarFeedback('Nombre actualizado', 'exito');
            });
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.jugador) iniciarJuego();
  else document.addEventListener('jugador-cargado', iniciarJuego);
});
