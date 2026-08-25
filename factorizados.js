// ---------- Configuración de niveles y regiones ----------
const XP_POR_NIVEL = 100;

// Regiones según nivel (mínimos actualizados)
const REGIONES = [
  { minNivel: 1, nombre: "Aldea del Factor Común" },
  { minNivel: 2, nombre: "Ciudad del Factor Común" },
  { minNivel: 5, nombre: "Montaña del Binomio Cuadrado" },
  { minNivel: 9, nombre: "Cueva de la Factorización Compleja" },
  { minNivel: 13, nombre: "Ciudadela de los Polinomios" }
];

// Calcula la región según el nivel
function regionParaNivel(nivel) {
  let region = REGIONES[0].nombre;
  for (const r of REGIONES) {
    if (nivel >= r.minNivel) region = r.nombre;
  }
  return region;
}

// Calcula la dificultad (1 a 5) a partir del nivel
function obtenerDificultad(nivel) {
  if (nivel === 1) return 1;           // Dificultad 1: factor común positivo
  if (nivel >= 2 && nivel <= 4) return 2; // Dificultad 2: factor común con suma/resta
  if (nivel >= 5 && nivel <= 8) return 3; // Dificultad 3: binomios y trinomios simples
  if (nivel >= 9 && nivel <= 12) return 4; // Dificultad 4: trinomios con coeficiente >1
  return 5; // Dificultad 5: diferencia de cubos (nivel 13+)
}

// ---------- Normalización de factorizaciones ----------
// Ordena los factores de un producto de binomios para comparar equivalentes
function normalizarFactorizacion(exp) {
  exp = exp.replace(/\s/g, ''); // eliminar espacios

  // --- 1. Factor común: a(bx + c) o a(bx - c) ---
  let matchComun = exp.match(/^(\d+)\(([+-]?\d*)x([+-]\d+)\)$/);
  if (matchComun) {
    let a = parseInt(matchComun[1]);
    let b = matchComun[2] === '' ? 1 : (matchComun[2] === '-' ? -1 : parseInt(matchComun[2]));
    let c = parseInt(matchComun[3]);
    // Nos aseguramos de que el factor común sea positivo para la comparación
    if (a < 0) {
      a = -a;
      b = -b;
      c = -c;
    }
    // Reordenamos los términos dentro del paréntesis para tener 'x' primero
    let parteX = '';
    if (b === 1) parteX = 'x';
    else if (b === -1) parteX = '-x';
    else parteX = b + 'x';
    let parteConst = '';
    if (c > 0) parteConst = '+' + c;
    else if (c < 0) parteConst = c.toString();
    return a + '(' + parteX + parteConst + ')';
  }

  // --- 2. Diferencia de cuadrados: (x+a)(x-a) o (ax+b)(ax-b) ---
  let matchCuadrados = exp.match(/^\(([+-]?\d*)x([+-]\d+)\)\(([+-]?\d*)x([+-]\d+)\)$/);
  if (matchCuadrados) {
    let a1 = matchCuadrados[1] === '' ? 1 : (matchCuadrados[1] === '-' ? -1 : parseInt(matchCuadrados[1]));
    let b1 = parseInt(matchCuadrados[2]);
    let a2 = matchCuadrados[3] === '' ? 1 : (matchCuadrados[3] === '-' ? -1 : parseInt(matchCuadrados[3]));
    let b2 = parseInt(matchCuadrados[4]);

    // Verificar si es diferencia de cuadrados: a1 == a2 y b1 == -b2
    if (a1 === a2 && b1 === -b2) {
      let a = a1;
      let b = Math.abs(b1);
      // Formato: (x + b)(x - b) o (ax + b)(ax - b)
      let parteX = (a === 1) ? 'x' : a + 'x';
      return '(' + parteX + '+' + b + ')(' + parteX + '-' + b + ')';
    }
    // Si no es diferencia de cuadrados, ordenamos los binomios normalmente
    let factores = [
      { a: a1, b: b1 },
      { a: a2, b: b2 }
    ];
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

  // --- 3. Suma o Diferencia de Cubos: (x ± a)(x² ∓ ax + a²) ---
  let matchCubos = exp.match(/^\(x([+-])(\d+)\)\(x²([+-])(\d+)x\+(\d+)\)$/);
  if (matchCubos) {
    let signo1 = matchCubos[1];
    let a = parseInt(matchCubos[2]);
    let signo2 = matchCubos[3];
    let b = parseInt(matchCubos[4]);
    let c = parseInt(matchCubos[5]);
    // Verificar que sea una suma o diferencia de cubos válida
    if ((signo1 === '+' && signo2 === '-' && b === a && c === a*a) ||
        (signo1 === '-' && signo2 === '+' && b === a && c === a*a)) {
      // Formato canónico: (x + a)(x² - ax + a²) o (x - a)(x² + ax + a²)
      return '(x' + signo1 + a + ')(x²' + (signo1 === '+' ? '-' : '+') + a + 'x+' + (a*a) + ')';
    }
    // Si no coincide, devolvemos la expresión original (no normalizada)
    return exp;
  }

  // Para otros casos, devolvemos la expresión tal cual
  return exp;
}

// ---------- Generación de preguntas ----------
function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Genera una pregunta según la dificultad (1 a 5)
function generarPregunta(dificultad) {
  let enunciado, respuestaCorrecta, opciones = [];

  switch(dificultad) {
    case 1: { // Factor común positivo (nivel 1)
      const a1 = numeroAleatorio(2, 6);
      const b1 = numeroAleatorio(2, 9);
      const termino1 = a1 * b1;
      enunciado = `Factoriza: ${a1}x + ${termino1}`;
      respuestaCorrecta = `${a1}(x + ${b1})`;
      opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'facil');
      break;
    }
    case 2: { // Factor común con suma o resta (niveles 2-4)
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
    case 3: { // 50% diferencia de cuadrados, 50% trinomio simple (niveles 5-8)
      if (Math.random() < 0.5) {
        // Diferencia de cuadrados: x² - a² = (x+a)(x-a)
        const a3 = numeroAleatorio(2, 7);
        enunciado = `Factoriza: x² - ${a3*a3}`;
        respuestaCorrecta = `(x + ${a3})(x - ${a3})`;
        opciones = generarOpcionesFactorizacion(respuestaCorrecta, 3, 'diferencia_cuadrados');
      } else {
        // Trinomio simple: x² + bx + c = (x+m)(x+n)
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
    case 4: { // Trinomio con coeficiente líder > 1 (niveles 9-12)
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
    case 5: { // Diferencia o suma de cubos (nivel 13+)
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

  // Calcular la versión normalizada de la respuesta correcta
  const respuestaNormalizada = normalizarFactorizacion(respuestaCorrecta);

  // Mezclar opciones (incluye la correcta)
  opciones = mezclarArray([respuestaCorrecta, ...opciones]);

  return {
    enunciado,
    respuestaCorrecta,          // cadena original (para mostrar)
    respuestaNormalizada,       // cadena normalizada (para comparar)
    opciones
  };
}

// Genera opciones incorrectas (errores comunes) para cada tipo
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
          `${a}(x ${signo === '+' ? '-' : '+'} ${b})`, // Signo incorrecto
          `${a+1}(x ${signo} ${b})`,                   // Coeficiente incorrecto
          `${a}(x ${signo} ${b+1})`,                   // Constante incorrecta
          `${a}(x ${signo === '+' ? '-' : '+'} ${b+1})` // Ambos errores
        ];
        candidata = variantes[numeroAleatorio(0, variantes.length-1)];
      }
    } else if (nivel === 'diferencia_cuadrados') {
      const match = correcta.match(/\(x \+ (\d+)\)\(x - (\d+)\)/);
      if (match) {
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        const variantes = [
          `(x - ${a})(x + ${b})`,     // Signos intercambiados
          `(x + ${a})(x + ${b})`,     // Ambos positivos
          `(x - ${a})(x - ${b})`,     // Ambos negativos
          `(x + ${a+1})(x - ${b})`    // Coeficiente alterado
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

// Mezcla un array (Fisher-Yates)
function mezclarArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Estado del juego ----------
let uid = null;
let jugador = null;
let preguntaActual = null;
let racha = 0;

const elNombre = document.getElementById('player-name');
const elNivel = document.getElementById('player-level');
const elMonedas = document.getElementById('player-coins');
const elXpBarra = document.getElementById('xp-bar-fill');
const elXpTexto = document.getElementById('xp-text');
const elRegion = document.getElementById('player-region');
const elPregunta = document.getElementById('pregunta-enunciado');
const elOpciones = document.getElementById('opciones-container');
const elFeedback = document.getElementById('feedback-message');
const elRacha = document.getElementById('racha-actual');

// Autenticación con Firebase
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  uid = user.uid;

  try {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) {
      // Si no existe el documento, redirigir al inicio
      window.location.href = 'index.html';
      return;
    }
    jugador = snap.data();
    // Asegurar que el nombre del jugador esté disponible
    if (!jugador.nombre) {
      jugador.nombre = "Aventurero";
    }
    actualizarUI();
    nuevaPregunta();
  } catch (error) {
    console.error("Error al cargar datos del jugador:", error);
    // Mostrar un mensaje de error o redirigir
    elNombre.textContent = "Error al cargar";
  }
});

function actualizarUI() {
  if (jugador) {
    elNombre.textContent = jugador.nombre || "Aventurero";
    elNivel.textContent = jugador.nivel || 1;
    elMonedas.textContent = jugador.monedas || 0;
    elRegion.textContent = jugador.regionActual || "Aldea del Factor Común";

    const xpEnNivel = (jugador.xp || 0) % XP_POR_NIVEL;
    elXpBarra.style.width = `${xpEnNivel}%`;
    elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
  }
  // Actualizar la racha siempre
  elRacha.textContent = racha;
  // Cambiar color de la racha según su valor
  if (racha >= 5) {
    elRacha.style.color = '#ffd700'; // Dorado
  } else if (racha >= 3) {
    elRacha.style.color = '#4CAF50'; // Verde
  } else {
    elRacha.style.color = '#ffffff'; // Blanco
  }
}

function nuevaPregunta() {
  elFeedback.classList.add('hidden');
  // Asegurar que el nivel del jugador sea válido
  const nivelActual = jugador ? jugador.nivel : 1;
  const dificultad = obtenerDificultad(nivelActual);
  preguntaActual = generarPregunta(dificultad);
  elPregunta.textContent = preguntaActual.enunciado + ' = ?';
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
  // Deshabilitar todos los botones para evitar múltiples respuestas
  [...elOpciones.children].forEach(b => b.disabled = true);

  // Normalizar la respuesta del usuario y comparar con la normalizada correcta
  const esCorrecta = normalizarFactorizacion(opcionElegida) === preguntaActual.respuestaNormalizada;

  let xpGanada = 0;
  let monedasGanadas = 0;

  if (esCorrecta) {
    racha++;
    // Bonus por racha: hasta 5 de bonus adicional
    const bonusRacha = Math.min(racha, 5) * 2;
    xpGanada = 10 + bonusRacha;
    monedasGanadas = 5 + Math.floor(racha / 3); // Monedas extra por racha
    btnElegido.classList.add('opcion-correcta');
    elFeedback.textContent = '¡Correcto, héroe! Sigue así.';
    elFeedback.classList.remove('feedback-error');
    elFeedback.classList.add('feedback-exito');
  } else {
    racha = 0;
    btnElegido.classList.add('opcion-incorrecta');
    elFeedback.textContent = `Casi. La respuesta correcta era ${preguntaActual.respuestaCorrecta}.`;
    elFeedback.classList.remove('feedback-exito');
    elFeedback.classList.add('feedback-error');
  }
  elFeedback.classList.remove('hidden');

  // Actualizar experiencia y nivel
  const nuevoXp = (jugador.xp || 0) + xpGanada;
  const nuevoNivel = Math.floor(nuevoXp / XP_POR_NIVEL) + 1;
  const subioNivel = nuevoNivel > (jugador.nivel || 1);

  jugador.xp = nuevoXp;
  jugador.monedas = (jugador.monedas || 0) + monedasGanadas;
  jugador.nivel = nuevoNivel;
  jugador.regionActual = regionParaNivel(nuevoNivel);
  jugador.estadisticas = jugador.estadisticas || {};
  jugador.estadisticas.correctas = (jugador.estadisticas.correctas || 0) + (esCorrecta ? 1 : 0);
  jugador.estadisticas.incorrectas = (jugador.estadisticas.incorrectas || 0) + (esCorrecta ? 0 : 1);

  try {
    await db.collection('usuarios').doc(uid).update({
      xp: jugador.xp,
      monedas: jugador.monedas,
      nivel: jugador.nivel,
      regionActual: jugador.regionActual,
      estadisticas: jugador.estadisticas,
      historial: firebase.firestore.FieldValue.arrayUnion({
        pregunta: preguntaActual.enunciado,
        correcta: esCorrecta,
        fecha: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error al guardar progreso:', error);
    // Opcional: Mostrar un mensaje de error al usuario
    elFeedback.textContent += ' (Error al guardar el progreso)';
  }

  actualizarUI();
  if (subioNivel) {
    elFeedback.textContent += ` ¡Subiste a nivel ${jugador.nivel}!`;
    // Opcional: Efecto visual o sonido por subir de nivel
  }

  // Esperar un momento y cargar la siguiente pregunta
  setTimeout(nuevaPregunta, 1600);
}
