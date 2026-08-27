// ============================================================
// factorizados.js – Lógica del juego "Factorizados"
// ============================================================

const XP_POR_NIVEL = 100;

const REGIONES = [
  { minNivel: 1, nombre: "Aldea del Factor Común" },
  { minNivel: 2, nombre: "Ciudad del Factor Común" },
  { minNivel: 5, nombre: "Montaña del Binomio Cuadrado" },
  { minNivel: 9, nombre: "Cueva de la Factorización Compleja" },
  { minNivel: 13, nombre: "Ciudadela de los Polinomios" }
];

function regionParaNivel(nivel) {
  let region = REGIONES[0].nombre;
  for (const r of REGIONES) {
    if (nivel >= r.minNivel) region = r.nombre;
  }
  return region;
}

function obtenerDificultad(nivel) {
  if (nivel === 1) return 1;
  if (nivel >= 2 && nivel <= 4) return 2;
  if (nivel >= 5 && nivel <= 8) return 3;
  if (nivel >= 9 && nivel <= 12) return 4;
  return 5;
}

// ---------- Normalización ----------
function normalizarFactorizacion(exp) {
  exp = exp.replace(/\s/g, '');
  let matchComun = exp.match(/^(\d+)\(([+-]?\d*)x([+-]\d+)\)$/);
  if (matchComun) {
    let a = parseInt(matchComun[1]);
    let b = matchComun[2] === '' ? 1 : (matchComun[2] === '-' ? -1 : parseInt(matchComun[2]));
    let c = parseInt(matchComun[3]);
    if (a < 0) { a = -a; b = -b; c = -c; }
    let parteX = '';
    if (b === 1) parteX = 'x';
    else if (b === -1) parteX = '-x';
    else parteX = b + 'x';
    let parteConst = '';
    if (c > 0) parteConst = '+' + c;
    else if (c < 0) parteConst = c.toString();
    return a + '(' + parteX + parteConst + ')';
  }

  let matchCuadrados = exp.match(/^\(([+-]?\d*)x([+-]\d+)\)\(([+-]?\d*)x([+-]\d+)\)$/);
  if (matchCuadrados) {
    let a1 = matchCuadrados[1] === '' ? 1 : (matchCuadrados[1] === '-' ? -1 : parseInt(matchCuadrados[1]));
    let b1 = parseInt(matchCuadrados[2]);
    let a2 = matchCuadrados[3] === '' ? 1 : (matchCuadrados[3] === '-' ? -1 : parseInt(matchCuadrados[3]));
    let b2 = parseInt(matchCuadrados[4]);
    if (a1 === a2 && b1 === -b2) {
      let a = a1;
      let b = Math.abs(b1);
      let parteX = (a === 1) ? 'x' : a + 'x';
      return '(' + parteX + '+' + b + ')(' + parteX + '-' + b + ')';
    }
    let factores = [{ a: a1, b: b1 }, { a: a2, b: b2 }];
    factores.sort((f1, f2) => {
      if (f1.a !== f2.a) return f1.a - f2.a;
      return f1.b - f2.b;
    });
    function fmt(f) {
      let parteX = '';
      if (f.a === 1) parteX = 'x';
      else if (f.a === -1) parteX = '-x';
      else parteX = f.a + 'x';
      let parteConst = '';
      if (f.b > 0) parteConst = '+' + f.b;
      else if (f.b < 0) parteConst = f.b.toString();
      return '(' + parteX + parteConst + ')';
    }
    return fmt(factores[0]) + fmt(factores[1]);
  }

  let matchCubos = exp.match(/^\(x([+-])(\d+)\)\(x²([+-])(\d+)x\+(\d+)\)$/);
  if (matchCubos) {
    let signo1 = matchCubos[1];
    let a = parseInt(matchCubos[2]);
    let signo2 = matchCubos[3];
    let b = parseInt(matchCubos[4]);
    let c = parseInt(matchCubos[5]);
    if ((signo1 === '+' && signo2 === '-' && b === a && c === a*a) ||
        (signo1 === '-' && signo2 === '+' && b === a && c === a*a)) {
      return '(x' + signo1 + a + ')(x²' + (signo1 === '+' ? '-' : '+') + a + 'x+' + (a*a) + ')';
    }
    return exp;
  }
  return exp;
}

// ---------- Generación de preguntas ----------
function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarPregunta(dificultad) {
  let enunciado, respuestaCorrecta, opciones = [];

  switch(dificultad) {
    case 1: {
      const a1 = numeroAleatorio(2, 6);
      const b1 = numeroAleatorio(2, 9);
      const termino1 = a1 * b1;
      enunciado = `Factoriza: ${a1}x + ${termino1}`;
      respuestaCorrecta = `${a1}(x + ${b1})`;
      opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'facil');
      break;
    }
    case 2: {
      const a2 = numeroAleatorio(2, 6);
      const b2 = numeroAleatorio(2, 9);
      const signo = Math.random() < 0.5 ? '+' : '-';
      const termino2 = signo === '+' ? a2 * b2 : -a2 * b2;
      const expresion2 = `${a2}x ${signo} ${Math.abs(termino2)}`;
      const factorizacion2 = `${a2}(x ${signo} ${b2})`;
      enunciado = `Factoriza: ${expresion2}`;
      respuestaCorrecta = factorizacion2;
      opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'facil');
      break;
    }
    case 3: {
      if (Math.random() < 0.5) {
        const a3 = numeroAleatorio(2, 7);
        enunciado = `Factoriza: x² - ${a3*a3}`;
        respuestaCorrecta = `(x + ${a3})(x - ${a3})`;
        opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'diferencia_cuadrados');
      } else {
        const m = numeroAleatorio(2, 5);
        const n = numeroAleatorio(2, 5);
        const b = m + n;
        const c = m * n;
        enunciado = `Factoriza: x² + ${b}x + ${c}`;
        respuestaCorrecta = `(x + ${m})(x + ${n})`;
        opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'trinomio_simple');
      }
      break;
    }
    case 4: {
      const p = numeroAleatorio(2, 3);
      const r = numeroAleatorio(2, 3);
      const q = numeroAleatorio(1, 4);
      const s = numeroAleatorio(1, 4);
      const a4 = p * r;
      const b4 = p * s + q * r;
      const c4 = q * s;
      enunciado = `Factoriza: ${a4}x² + ${b4}x + ${c4}`;
      respuestaCorrecta = `(${p}x + ${q})(${r}x + ${s})`;
      opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'trinomio_lider');
      break;
    }
    case 5: {
      const tipoCubo = Math.random() < 0.5 ? 'diferencia' : 'suma';
      const a5 = numeroAleatorio(2, 4);
      const b5 = numeroAleatorio(2, 4);
      const bCubo = b5 * b5 * b5;
      let expresion5, factorizacion5;
      if (tipoCubo === 'diferencia') {
        expresion5 = `x³ - ${bCubo}`;
        factorizacion5 = `(x - ${b5})(x² + ${b5}x + ${b5*b5})`;
      } else {
        expresion5 = `x³ + ${bCubo}`;
        factorizacion5 = `(x + ${b5})(x² - ${b5}x + ${b5*b5})`;
      }
      enunciado = `Factoriza: ${expresion5}`;
      respuestaCorrecta = factorizacion5;
      opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'cubos');
      break;
    }
  }

  const respuestaNormalizada = normalizarFactorizacion(respuestaCorrecta);
  opciones = mezclarArray([respuestaCorrecta, ...opciones]);

  return {
    enunciado,
    respuestaCorrecta,
    respuestaNormalizada,
    opciones
  };
}

function generarOpcionesFactorizacion(correcta, cantidad, nivel) {
  const opciones = new Set();
  let intentos = 0;
  while (opciones.size < cantidad && intentos < 100) {
    intentos++;
    let candidata = '';

    if (nivel === 'facil') {
      const match = correcta.match(/(\d+)\(x ([+-]) (\d+)\)/);
      if (match) {
        const a = parseInt(match[1]);
        const signo = match[2];
        const b = parseInt(match[3]);
        const variantes = [
          `${a}(x ${signo === '+' ? '-' : '+'} ${b})`,
          `${a+1}(x ${signo} ${b})`,
          `${a}(x ${signo} ${b+1})`,
          `${a}(x ${signo === '+' ? '-' : '+'} ${b+1})`
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    } else if (nivel === 'diferencia_cuadrados') {
      const match = correcta.match(/\(x \+ (\d+)\)\(x - (\d+)\)/);
      if (match) {
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        const variantes = [
          `(x - ${a})(x + ${b})`,
          `(x + ${a})(x + ${b})`,
          `(x - ${a})(x - ${b})`,
          `(x + ${a+1})(x - ${b})`
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    } else if (nivel === 'trinomio_simple') {
      const match = correcta.match(/\(x \+ (\d+)\)\(x \+ (\d+)\)/);
      if (match) {
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        const variantes = [
          `(x - ${a})(x + ${b})`,
          `(x + ${a})(x - ${b})`,
          `(x - ${a})(x - ${b})`,
          `(x + ${a+1})(x + ${b})`
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    } else if (nivel === 'trinomio_lider') {
      const match = correcta.match(/\((\d+)x \+ (\d+)\)\((\d+)x \+ (\d+)\)/);
      if (match) {
        const p = parseInt(match[1]), q = parseInt(match[2]);
        const r = parseInt(match[3]), s = parseInt(match[4]);
        const variantes = [
          `(${p}x - ${q})(${r}x + ${s})`,
          `(${p}x + ${q})(${r}x - ${s})`,
          `(${p}x + ${q+1})(${r}x + ${s})`,
          `(${p+1}x + ${q})(${r}x + ${s})`
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    } else if (nivel === 'cubos') {
      const match = correcta.match(/\(x ([+-]) (\d+)\)\(x² ([+-]) (\d+)x \+ (\d+)\)/);
      if (match) {
        const signo1 = match[1];
        const num1 = parseInt(match[2]);
        const signo2 = match[3];
        const num2 = parseInt(match[4]);
        const num3 = parseInt(match[5]);
        const variantes = [
          `(x ${signo1 === '+' ? '-' : '+'} ${num1})(x² ${signo2} ${num2+1}x + ${num3})`,
          `(x ${signo1} ${num1+1})(x² ${signo2} ${num2}x + ${num3})`,
          `(x ${signo1 === '+' ? '-' : '+'} ${num1})(x² ${signo2 === '+' ? '-' : '+'} ${num2}x + ${num3})`
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    }

    if (candidata && candidata !== correcta) {
      opciones.add(candidata);
    }
  }
  return Array.from(opciones);
}

function mezclarArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Estado del juego ----------
let preguntaActual = null;
let racha = 0;

// Elementos del DOM
let elNombre, elNivel, elMonedas, elXpBarra, elXpTexto, elRegion;
let elPregunta, elOpciones, elFeedback, elRacha;
let elBtnReiniciar;

// ---------- Inicialización ----------
function iniciarJuego() {
  elNombre = document.getElementById('player-name');
  elNivel = document.getElementById('player-level');
  elMonedas = document.getElementById('player-coins');
  elXpBarra = document.getElementById('xp-bar-fill');
  elXpTexto = document.getElementById('xp-text');
  elRegion = document.getElementById('player-region');
  elPregunta = document.getElementById('pregunta-enunciado');
  elOpciones = document.getElementById('opciones-container');
  elFeedback = document.getElementById('feedback-message');
  elRacha = document.getElementById('racha-actual');
  elBtnReiniciar = document.getElementById('btn-reiniciar');

  actualizarUI();
  nuevaPregunta();

  // Botón guardar (sin cambios)
  const btnGuardar = document.getElementById('btn-save');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      mostrarFeedback('¡Progreso guardado!', 'exito');
    });
  }

  // Botón salir
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

  // Botón reiniciar nivel
  if (elBtnReiniciar) {
    elBtnReiniciar.addEventListener('click', reiniciarNivel);
  }
}

function actualizarUI() {
  if (!window.jugador) return;
  const j = window.jugador;
  // Leer datos de factorizados
  const fac = j.factorizados || { nivel: 1, monedas: 0, xp: 0, region: "Aldea del Factor Común" };
  if (elNombre) elNombre.textContent = j.nombre || "Aventurero";
  if (elNivel) elNivel.textContent = fac.nivel || 1;
  if (elMonedas) elMonedas.textContent = fac.monedas || 0;
  if (elRegion) elRegion.textContent = fac.region || "Aldea del Factor Común";
  if (elXpBarra && elXpTexto) {
    const xpEnNivel = (fac.xp || 0) % XP_POR_NIVEL;
    elXpBarra.style.width = `${xpEnNivel}%`;
    elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
  }
  if (elRacha) {
    elRacha.textContent = racha;
    if (racha >= 5) elRacha.style.color = '#d32f2f';
    else if (racha >= 3) elRacha.style.color = '#2e7d32';
    else elRacha.style.color = '#1a1a1a';
  }
}

function mostrarFeedback(mensaje, tipo) {
  if (!elFeedback) return;
  elFeedback.textContent = mensaje;
  elFeedback.className = 'feedback';
  if (tipo === 'exito') elFeedback.classList.add('feedback-exito');
  else if (tipo === 'error') elFeedback.classList.add('feedback-error');
  elFeedback.classList.remove('hidden');
  setTimeout(() => elFeedback.classList.add('hidden'), 2500);
}

function nuevaPregunta() {
  if (elFeedback) elFeedback.classList.add('hidden');
  const nivelActual = window.jugador && window.jugador.factorizados ? window.jugador.factorizados.nivel : 1;
  const dificultad = obtenerDificultad(nivelActual);
  preguntaActual = generarPregunta(dificultad);
  if (elPregunta) elPregunta.textContent = preguntaActual.enunciado + ' = ?';
  if (!elOpciones) return;
  elOpciones.innerHTML = '';
  preguntaActual.opciones.forEach((opcion) => {
    const btn = document.createElement('button');
    btn.className = 'rpg-button btn-opcion';
    btn.textContent = opcion;
    btn.addEventListener('click', () => responder(opcion, btn));
    elOpciones.appendChild(btn);
  });
}

async function responder(opcionElegida, btnElegido) {
  if (!elOpciones) return;
  [...elOpciones.children].forEach(b => b.disabled = true);

  const esCorrecta = normalizarFactorizacion(opcionElegida) === preguntaActual.respuestaNormalizada;
  let xpGanada = 0;
  let monedasGanadas = 0;

  if (esCorrecta) {
    racha++;
    const bonusRacha = Math.min(racha, 5) * 2;
    xpGanada = 10 + bonusRacha;
    monedasGanadas = 5 + Math.floor(racha / 3);
    btnElegido.classList.add('opcion-correcta');
    if (elFeedback) {
      elFeedback.textContent = '¡Correcto, héroe! Sigue así.';
      elFeedback.className = 'feedback feedback-exito';
      elFeedback.classList.remove('hidden');
    }
  } else {
    racha = 0;
    btnElegido.classList.add('opcion-incorrecta');
    if (elFeedback) {
      elFeedback.textContent = `Casi. La respuesta correcta era ${preguntaActual.respuestaCorrecta}.`;
      elFeedback.className = 'feedback feedback-error';
      elFeedback.classList.remove('hidden');
    }
  }

  if (window.jugador && window.uid) {
    const j = window.jugador;
    // Inicializar subobjeto factorizados
    if (!j.factorizados) {
      j.factorizados = { xp: 0, nivel: 1, monedas: 0, region: "Aldea del Factor Común" };
    }
    const fac = j.factorizados;
    const nuevoXp = (fac.xp || 0) + xpGanada;
    const nuevoNivel = Math.floor(nuevoXp / XP_POR_NIVEL) + 1;
    const subioNivel = nuevoNivel > (fac.nivel || 1);

    fac.xp = nuevoXp;
    fac.monedas = (fac.monedas || 0) + monedasGanadas;
    fac.nivel = nuevoNivel;
    fac.region = regionParaNivel(nuevoNivel);
    fac.racha = racha;

    if (!j.estadisticas) j.estadisticas = {};
    j.estadisticas.factorizados_correctas = (j.estadisticas.factorizados_correctas || 0) + (esCorrecta ? 1 : 0);
    j.estadisticas.factorizados_incorrectas = (j.estadisticas.factorizados_incorrectas || 0) + (esCorrecta ? 0 : 1);

    try {
      await db.collection('usuarios').doc(window.uid).update({
        'factorizados.xp': fac.xp,
        'factorizados.nivel': fac.nivel,
        'factorizados.monedas': fac.monedas,
        'factorizados.region': fac.region,
        'factorizados.racha': racha,
        'estadisticas.factorizados_correctas': j.estadisticas.factorizados_correctas,
        'estadisticas.factorizados_incorrectas': j.estadisticas.factorizados_incorrectas,
        historial: firebase.firestore.FieldValue.arrayUnion({
          juego: 'factorizados',
          pregunta: preguntaActual.enunciado,
          correcta: esCorrecta,
          fecha: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      if (elFeedback) {
        elFeedback.textContent += ' (Error al guardar el progreso)';
      }
    }

    actualizarUI();
    if (subioNivel && elFeedback) {
      elFeedback.textContent += ` ¡Subiste a nivel ${fac.nivel}!`;
    }
  }

  setTimeout(nuevaPregunta, 1600);
}

// ---------- Reiniciar nivel ----------
async function reiniciarNivel() {
  if (!window.uid) return;
  if (!confirm('¿Seguro que quieres reiniciar tu nivel en Factorizados? Se perderá todo el progreso.')) return;
  try {
    await db.collection('usuarios').doc(window.uid).update({
      'factorizados.nivel': 1,
      'factorizados.xp': 0,
      'factorizados.monedas': 0,
      'factorizados.racha': 0,
      'factorizados.region': "Aldea del Factor Común"
    });
    if (window.jugador) {
      if (!window.jugador.factorizados) window.jugador.factorizados = {};
      window.jugador.factorizados.nivel = 1;
      window.jugador.factorizados.xp = 0;
      window.jugador.factorizados.monedas = 0;
      window.jugador.factorizados.racha = 0;
      racha = 0;
      if (elRacha) elRacha.textContent = '0';
    }
    actualizarUI();
    mostrarFeedback('¡Nivel reiniciado!', 'exito');
  } catch (error) {
    console.error('Error al reiniciar nivel:', error);
    alert('No se pudo reiniciar el nivel. Intenta de nuevo.');
  }
}

// ---------- Escuchar evento de jugador cargado ----------
document.addEventListener('jugador-cargado', () => {
  iniciarJuego();
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.jugador) {
    iniciarJuego();
  }
});
