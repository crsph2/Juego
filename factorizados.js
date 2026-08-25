// factorizados.js - Minijuego de factorización
// Ahora usa common.js para el jugador y el nombre

// ---------- Configuración de niveles y regiones ----------
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

// ... (todas las funciones de normalización, generación de preguntas, etc., igual que antes)
// Incluye: normalizarFactorizacion, numeroAleatorio, generarPregunta, generarOpcionesFactorizacion, mezclarArray

// ---------- Estado del juego ----------
let preguntaActual = null;
let racha = 0;

const elNivel = document.getElementById('player-level');
const elMonedas = document.getElementById('player-coins');
const elXpBarra = document.getElementById('xp-bar-fill');
const elXpTexto = document.getElementById('xp-text');
const elRegion = document.getElementById('player-region');
const elPregunta = document.getElementById('pregunta-enunciado');
const elOpciones = document.getElementById('opciones-container');
const elFeedback = document.getElementById('feedback-message');
const elRacha = document.getElementById('racha-actual');

// Función para actualizar toda la UI del juego (nivel, monedas, XP, región, racha)
function actualizarUIJuego() {
  if (jugador) {
    elNivel.textContent = jugador.nivel || 1;
    elMonedas.textContent = jugador.monedas || 0;
    elRegion.textContent = jugador.regionActual || "Aldea del Factor Común";

    const xpEnNivel = (jugador.xp || 0) % XP_POR_NIVEL;
    elXpBarra.style.width = `${xpEnNivel}%`;
    elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
  }
  elRacha.textContent = racha;
  // Cambiar color de la racha
  if (racha >= 5) {
    elRacha.style.color = '#ffd700';
  } else if (racha >= 3) {
    elRacha.style.color = '#4CAF50';
  } else {
    elRacha.style.color = '#ffffff';
  }
}

// Nueva pregunta
function nuevaPregunta() {
  elFeedback.classList.add('hidden');
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
    elFeedback.textContent = '¡Correcto, héroe! Sigue así.';
    elFeedback.className = 'feedback-exito';
  } else {
    racha = 0;
    btnElegido.classList.add('opcion-incorrecta');
    elFeedback.textContent = `Casi. La respuesta correcta era ${preguntaActual.respuestaCorrecta}.`;
    elFeedback.className = 'feedback-error';
  }
  elFeedback.classList.remove('hidden');

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
    elFeedback.textContent += ' (Error al guardar)';
  }

  actualizarUIJuego();
  if (subioNivel) {
    elFeedback.textContent += ` ¡Subiste a nivel ${jugador.nivel}!`;
  }

  setTimeout(nuevaPregunta, 1600);
}

// Inicializar el juego cuando common.js haya cargado el jugador
document.addEventListener('DOMContentLoaded', () => {
  // Esperamos a que common.js cargue el jugador
  // Podemos usar un intervalo corto o un evento personalizado.
  // Una forma simple es comprobar si jugador ya está definido.
  const checkJugador = setInterval(() => {
    if (typeof jugador !== 'undefined' && jugador !== null) {
      clearInterval(checkJugador);
      actualizarUIJuego();
      nuevaPregunta();
    }
  }, 100);
});
