// common.js - Funciones compartidas para todas las páginas

window.uid = null;
window.jugador = null;

function getUid() {
    return sessionStorage.getItem('mathquest_uid');
}

async function cargarJugador() {
    window.uid = getUid();
    if (!window.uid) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const snap = await db.collection('usuarios').doc(window.uid).get();
        if (!snap.exists) {
            window.location.href = 'index.html';
            return;
        }
        window.jugador = snap.data();
        // Inicializar campos
        if (window.jugador.monedas === undefined) window.jugador.monedas = 0;
        if (!window.jugador.inventario) window.jugador.inventario = ['avatar_base'];
        if (!window.jugador.equipo) {
            window.jugador.equipo = {
                avatar: 'avatar_base',
                superior: null,
                inferior: null,
                sombrero: null,
                zapatillas: null,
                insignia: null
            };
        } else if (!window.jugador.equipo.avatar) {
            window.jugador.equipo.avatar = 'avatar_base';
        }
        if (!window.jugador.factorizados) {
            window.jugador.factorizados = { nivel: 1, xp: 0, region: 'Aldea del Factor Común', racha: 0 };
        }
        if (!window.jugador.incognita) {
            window.jugador.incognita = { nivel: 1, xp: 0, region: 'Aldea de las Ecuaciones', racha: 0 };
        }
        if (!window.jugador.nombre) window.jugador.nombre = 'Trotamundos';

        actualizarUICompleta();
        configurarEdicionNombre();
        document.dispatchEvent(new CustomEvent('jugador-cargado', { detail: window.jugador }));
    } catch (error) {
        console.error('Error al cargar jugador:', error);
        const elNombre = document.getElementById('player-name');
        if (elNombre) elNombre.textContent = 'Error al cargar';
    }
}

function actualizarUICompleta() {
    if (!window.jugador) return;

    // Nombre
    const elNombre = document.getElementById('player-name');
    if (elNombre) elNombre.textContent = window.jugador.nombre;

    // Monedas
    const elMonedas = document.getElementById('player-coins');
    if (elMonedas) elMonedas.textContent = window.jugador.monedas || 0;

    // Factorizados: nivel, XP, región
    const fac = window.jugador.factorizados || { nivel: 1, xp: 0, region: 'Aldea del Factor Común' };
    const elNivel = document.getElementById('player-level');
    if (elNivel) elNivel.textContent = fac.nivel || 1;

    const elXpBarra = document.getElementById('xp-bar-fill');
    const elXpTexto = document.getElementById('xp-text');
    if (elXpBarra && elXpTexto) {
        const XP_POR_NIVEL = 100;
        const xpEnNivel = (fac.xp || 0) % XP_POR_NIVEL;
        elXpBarra.style.width = `${xpEnNivel}%`;
        elXpTexto.textContent = `${xpEnNivel} / ${XP_POR_NIVEL} XP`;
    }

    const elRegion = document.getElementById('player-region');
    if (elRegion) {
        elRegion.textContent = fac.region || 'Aldea del Factor Común';
    }

    // Actualizar avatar
    actualizarAvatar();
}

function actualizarAvatar() {
    const avatarContainer = document.getElementById('avatar-display');
    if (!avatarContainer) return;

    const equipo = window.jugador.equipo || {};
    const nombre = window.jugador.nombre || 'Aventurero';

    // Mapeo de IDs a parámetros de DiceBear (estilo adventurer)
    function getDiceParams(id) {
        if (!id) return {};
        switch (id) {
            // Superiores
            case 'camiseta_roja': return { top: 'shirt', clothingColor: 'ff0000' };
            case 'camiseta_azul': return { top: 'shirt', clothingColor: '0055ff' };
            case 'camiseta_verde': return { top: 'shirt', clothingColor: '00aa00' };
            case 'camiseta_negra_estrella': return { top: 'shirt', clothingColor: '111111' };
            case 'camiseta_naranja': return { top: 'shirt', clothingColor: 'ff8800' };
            
            // Inferiores
            case 'pantalon_vaquero': return { pants: 'pants', pantsColor: '003366' };
            case 'pantalon_corto_beige': return { pants: 'shorts', pantsColor: 'd2b48c' };
            case 'pantalon_negro': return { pants: 'pants', pantsColor: '222222' };
            case 'pantalon_azul_marino': return { pants: 'pants', pantsColor: '000080' };
            case 'pantalon_gris': return { pants: 'pants', pantsColor: '808080' };

            // Sombreros
            case 'gorra_roja': return { hat: 'cap', hatColor: 'ff0000' };
            case 'sombrero_copa': return { hat: 'tophat', hatColor: '111111' };
            case 'boina': return { hat: 'beanie', hatColor: '333333' };
            case 'sombrero_vaquero': return { hat: 'cowboy', hatColor: '8b4513' };
            case 'corona': return { hat: 'crown', hatColor: 'ffd700' };

            // Zapatillas
            case 'zapatillas_blancas': return { shoes: 'sneakers', shoesColor: 'ffffff' };
            case 'zapatillas_negras': return { shoes: 'sneakers', shoesColor: '111111' };
            case 'zapatillas_rojas': return { shoes: 'sneakers', shoesColor: 'ff0000' };
            case 'zapatillas_azules': return { shoes: 'sneakers', shoesColor: '0055ff' };
            case 'zapatillas_verdes': return { shoes: 'sneakers', shoesColor: '00aa00' };
            
            default: return {};
        }
    }

    // Construir la URL base
    const seed = encodeURIComponent(nombre); 
    let url = `https://api.dicebear.com/10.x/adventurer/svg?seed=${seed}`;

    // Aplicar parámetros del equipo
    let params = {
        ...getDiceParams(equipo.superior),
        ...getDiceParams(equipo.inferior),
        ...getDiceParams(equipo.sombrero),
        ...getDiceParams(equipo.zapatillas)
    };

    // Agregar color de piel y pelo por defecto para una paleta armoniosa
    params.skinColor = 'f1c27d'; 
    params.hairColor = '2c1b18'; 
    params.hair = 'short'; 

    // Unir parámetros a la URL
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    if (queryString) url += `&${queryString}`;

    // Generar HTML del avatar (busto encerrado en el contenedor CSS)
    avatarContainer.innerHTML = `
        <div class="avatar-dicebear">
            <img src="${url}" alt="Avatar" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="avatar-nombre">${nombre}</div>
    `;
}

function configurarEdicionNombre() {
    const btnEditar = document.getElementById('edit-name-btn') || document.getElementById('btn-edit-name');
    if (!btnEditar) return;
    const nuevoBtn = btnEditar.cloneNode(true);
    btnEditar.parentNode.replaceChild(nuevoBtn, btnEditar);

    nuevoBtn.addEventListener('click', () => {
        if (!window.jugador) return;
        const nuevoNombre = prompt('Ingresa tu nuevo nombre de aventurero:', window.jugador.nombre);
        if (nuevoNombre && nuevoNombre.trim() !== '' && nuevoNombre !== window.jugador.nombre) {
            const nombreLimpio = nuevoNombre.trim();
            db.collection('usuarios').doc(window.uid).update({ nombre: nombreLimpio })
                .then(() => {
                    window.jugador.nombre = nombreLimpio;
                    sessionStorage.setItem('mathquest_nombre', nombreLimpio);
                    actualizarUICompleta();
                    mostrarFeedback('¡Nombre actualizado!', 'exito');
                })
                .catch(err => {
                    console.error('Error al actualizar nombre:', err);
                    alert('No se pudo actualizar el nombre. Intenta de nuevo.');
                });
        }
    });
}

function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById('feedback-message');
    if (feedback) {
        feedback.textContent = mensaje;
        feedback.className = 'feedback';
        if (tipo === 'exito') feedback.classList.add('feedback-exito');
        else if (tipo === 'error') feedback.classList.add('feedback-error');
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 3000);
    }
}

// Redirigir si no hay usuario
firebase.auth().onAuthStateChanged((user) => {
    const paginasPublicas = ['index.html', 'register.html'];
    const path = window.location.pathname.split('/').pop();
    if (!user && !paginasPublicas.includes(path)) {
        window.location.href = 'index.html';
    }
});

// ============================================================
// MODO OSCURO MANUAL (Guardado en localStorage)
// ============================================================
const themeBtn = document.getElementById('theme-toggle');

function aplicarTema(tema) {
    if (tema === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeBtn) themeBtn.textContent = '☀️'; // Sol para volver al claro
    } else {
        document.body.classList.remove('dark-mode');
        if (themeBtn) themeBtn.textContent = '🌙'; // Luna para ir al oscuro
    }
    localStorage.setItem('mathquest_theme', tema);
}

// Al cargar la página, leer la preferencia guardada
const temaGuardado = localStorage.getItem('mathquest_theme') || 'light';
aplicarTema(temaGuardado);

// Evento del botón (si existe en la página actual)
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const nuevoTema = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        aplicarTema(nuevoTema);
    });
}

document.addEventListener('DOMContentLoaded', cargarJugador);
