// lobby.js - Lógica del lobby y tienda

// ---------- Datos de la tienda ----------
const ITEMS = {
    avatar: [
        { id: 'avatar_base', nombre: 'Avatar', emoji: '🧑', categoria: 'avatar', precio: 0 }
    ],
    superior: [
        { id: 'camiseta_roja', nombre: 'Camiseta Roja', emoji: '👕', categoria: 'superior', precio: 500 },
        { id: 'camiseta_azul', nombre: 'Camiseta Azul', emoji: '👕', categoria: 'superior', precio: 500 },
        { id: 'camiseta_verde', nombre: 'Camiseta Verde', emoji: '👕', categoria: 'superior', precio: 500 },
        { id: 'camiseta_negra_estrella', nombre: 'Camiseta Negra con Estrella', emoji: '⭐', categoria: 'superior', precio: 500 },
        { id: 'camiseta_naranja', nombre: 'Camiseta Naranja', emoji: '👕', categoria: 'superior', precio: 500 }
    ],
    inferior: [
        { id: 'pantalon_vaquero', nombre: 'Pantalón Vaquero', emoji: '👖', categoria: 'inferior', precio: 500 },
        { id: 'pantalon_corto_beige', nombre: 'Pantalón Corto Beige', emoji: '🩳', categoria: 'inferior', precio: 500 },
        { id: 'pantalon_negro', nombre: 'Pantalón Negro', emoji: '👖', categoria: 'inferior', precio: 500 },
        { id: 'pantalon_azul_marino', nombre: 'Pantalón Azul Marino', emoji: '👖', categoria: 'inferior', precio: 500 },
        { id: 'pantalon_gris', nombre: 'Pantalón Gris', emoji: '👖', categoria: 'inferior', precio: 500 }
    ],
    sombrero: [
        { id: 'gorra_roja', nombre: 'Gorra Roja', emoji: '🧢', categoria: 'sombrero', precio: 500 },
        { id: 'sombrero_copa', nombre: 'Sombrero de Copa', emoji: '🎩', categoria: 'sombrero', precio: 500 },
        { id: 'boina', nombre: 'Boina', emoji: '🎓', categoria: 'sombrero', precio: 500 },
        { id: 'sombrero_vaquero', nombre: 'Sombrero Vaquero', emoji: '🤠', categoria: 'sombrero', precio: 500 },
        { id: 'corona', nombre: 'Corona', emoji: '👑', categoria: 'sombrero', precio: 500 }
    ],
    zapatillas: [
        { id: 'zapatillas_blancas', nombre: 'Zapatillas Blancas', emoji: '👟', categoria: 'zapatillas', precio: 500 },
        { id: 'zapatillas_negras', nombre: 'Zapatillas Negras', emoji: '👟', categoria: 'zapatillas', precio: 500 },
        { id: 'zapatillas_rojas', nombre: 'Zapatillas Rojas', emoji: '👟', categoria: 'zapatillas', precio: 500 },
        { id: 'zapatillas_azules', nombre: 'Zapatillas Azules', emoji: '👟', categoria: 'zapatillas', precio: 500 },
        { id: 'zapatillas_verdes', nombre: 'Zapatillas Verdes', emoji: '👟', categoria: 'zapatillas', precio: 500 }
    ],
    insignia: [
        { id: 'insignia_pi', nombre: 'Pi (π)', emoji: '🏅π', categoria: 'insignia', precio: 500 },
        { id: 'insignia_integral', nombre: 'Integral (∫)', emoji: '🏅∫', categoria: 'insignia', precio: 500 },
        { id: 'insignia_raiz', nombre: 'Raíz Cuadrada (√)', emoji: '🏅√', categoria: 'insignia', precio: 500 },
        { id: 'insignia_suma', nombre: 'Sumatoria (Σ)', emoji: '🏅Σ', categoria: 'insignia', precio: 500 },
        { id: 'insignia_infinito', nombre: 'Infinito (∞)', emoji: '🏅∞', categoria: 'insignia', precio: 500 }
    ]
};

// Función global para obtener item por ID (usada por common.js)
window.obtenerItemPorIdGlobal = function(id) {
    for (const cat in ITEMS) {
        const encontrado = ITEMS[cat].find(item => item.id === id);
        if (encontrado) return encontrado;
    }
    return null;
};

// ---------- Variables globales ----------
let categoriaActual = 'superior';
let jugadorData = window.jugador;

// ---------- Elementos DOM ----------
const elCoinsTienda = document.getElementById('tienda-coins');
const elAvatarPreview = document.getElementById('avatar-preview');
const elItemsTienda = document.getElementById('items-tienda');
const categoriaBtns = document.querySelectorAll('.categoria-btn');

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
    if (window.jugador) {
        iniciarTienda();
    } else {
        document.addEventListener('jugador-cargado', iniciarTienda);
    }
});

function iniciarTienda() {
    jugadorData = window.jugador;
    actualizarVistaPrevia();
    actualizarMonedas();
    categoriaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoriaBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaActual = btn.dataset.categoria;
            mostrarItemsCategoria(categoriaActual);
        });
    });
    mostrarItemsCategoria('superior');
}

function mostrarItemsCategoria(categoria) {
    const items = ITEMS[categoria];
    if (!items) return;
    elItemsTienda.innerHTML = '';
    items.forEach(item => {
        const yaComprado = jugadorData.inventario.includes(item.id);
        const equipado = jugadorData.equipo[categoria] === item.id;
        const card = document.createElement('div');
        card.className = 'item-card';
        if (equipado) card.classList.add('equipado');
        card.innerHTML = `
            <div class="item-emoji">${item.emoji}</div>
            <div class="item-nombre">${item.nombre}</div>
            <div class="item-precio">${item.precio} 🪙</div>
            <div class="item-acciones">
                ${yaComprado ? 
                    (equipado ? '<span class="equipado-label">✅ Equipado</span>' : 
                    `<button class="btn-equipar" data-id="${item.id}" data-cat="${categoria}">Equipar</button>`) :
                    `<button class="btn-comprar" data-id="${item.id}" data-cat="${categoria}" data-precio="${item.precio}">Comprar</button>`
                }
            </div>
        `;
        elItemsTienda.appendChild(card);

        const btnComprar = card.querySelector('.btn-comprar');
        if (btnComprar) {
            btnComprar.addEventListener('click', () => comprarItem(item.id, item.categoria, item.precio));
        }
        const btnEquipar = card.querySelector('.btn-equipar');
        if (btnEquipar) {
            btnEquipar.addEventListener('click', () => equiparItem(item.id, item.categoria));
        }
    });
}

async function comprarItem(id, categoria, precio) {
    if (jugadorData.monedas < precio) {
        alert('No tienes suficientes monedas.');
        return;
    }
    if (jugadorData.inventario.includes(id)) {
        alert('Ya tienes este item.');
        return;
    }
    const item = ITEMS[categoria].find(i => i.id === id);
    if (!confirm(`¿Comprar ${item.nombre} por ${precio} monedas?`)) return;

    try {
        jugadorData.monedas -= precio;
        jugadorData.inventario.push(id);
        if (categoria === 'avatar') {
            jugadorData.equipo.avatar = id;
        }
        await db.collection('usuarios').doc(window.uid).update({
            monedas: jugadorData.monedas,
            inventario: jugadorData.inventario,
            equipo: jugadorData.equipo
        });
        actualizarMonedas();
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        if (window.actualizarAvatar) window.actualizarAvatar();
        mostrarFeedback('¡Compra exitosa!', 'exito');
    } catch (error) {
        console.error('Error al comprar:', error);
        alert('Error al comprar. Intenta de nuevo.');
    }
}

async function equiparItem(id, categoria) {
    if (!jugadorData.inventario.includes(id)) {
        alert('No tienes este item.');
        return;
    }
    if (jugadorData.equipo[categoria] === id) return;

    try {
        jugadorData.equipo[categoria] = id;
        await db.collection('usuarios').doc(window.uid).update({
            equipo: jugadorData.equipo
        });
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        if (window.actualizarAvatar) window.actualizarAvatar();
        mostrarFeedback('¡Item equipado!', 'exito');
    } catch (error) {
        console.error('Error al equipar:', error);
        alert('Error al equipar. Intenta de nuevo.');
    }
}

function actualizarVistaPrevia() {
    if (!elAvatarPreview) return;
    const equipo = jugadorData.equipo;
    const nombre = jugadorData.nombre;

    const superior = equipo.superior ? ITEMS.superior.find(i => i.id === equipo.superior) : null;
    const inferior = equipo.inferior ? ITEMS.inferior.find(i => i.id === equipo.inferior) : null;
    const sombrero = equipo.sombrero ? ITEMS.sombrero.find(i => i.id === equipo.sombrero) : null;
    const zapatillas = equipo.zapatillas ? ITEMS.zapatillas.find(i => i.id === equipo.zapatillas) : null;
    const insignia = equipo.insignia ? ITEMS.insignia.find(i => i.id === equipo.insignia) : null;

    const seed = encodeURIComponent(nombre);
    const dicebearUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`;

    elAvatarPreview.innerHTML = `
        <div style="position:relative; display:inline-block; width:120px; height:120px;">
            <img src="${dicebearUrl}" alt="Avatar" style="width:100%; height:100%; border-radius:50%;">
            ${sombrero ? `<div style="position:absolute; top:-5px; left:50%; transform:translateX(-50%); font-size:2.5rem; text-shadow:0 2px 8px rgba(0,0,0,0.3);">${sombrero.emoji}</div>` : ''}
            ${superior ? `<div style="position:absolute; top:45px; left:50%; transform:translateX(-50%); font-size:2.2rem; text-shadow:0 2px 8px rgba(0,0,0,0.3);">${superior.emoji}</div>` : ''}
            ${inferior ? `<div style="position:absolute; top:85px; left:50%; transform:translateX(-50%); font-size:2rem; text-shadow:0 2px 8px rgba(0,0,0,0.3);">${inferior.emoji}</div>` : ''}
            ${zapatillas ? `<div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); font-size:1.8rem; text-shadow:0 2px 8px rgba(0,0,0,0.3);">${zapatillas.emoji}</div>` : ''}
            ${insignia ? `<div style="position:absolute; top:20px; right:-5px; font-size:1.6rem; text-shadow:0 2px 8px rgba(0,0,0,0.3);">${insignia.emoji}</div>` : ''}
            <div style="position:absolute; bottom:-5px; left:50%; transform:translateX(-50%); font-size:0.9rem; background:rgba(255,255,255,0.8); padding:0 8px; border-radius:10px; white-space:nowrap; font-weight:700; color:#3b4cca;">${nombre}</div>
        </div>
    `;
}

function actualizarMonedas() {
    if (elCoinsTienda) elCoinsTienda.textContent = jugadorData.monedas || 0;
    const elMonedasGlobal = document.getElementById('player-coins');
    if (elMonedasGlobal) elMonedasGlobal.textContent = jugadorData.monedas || 0;
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

// Botones de juegos y logout
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });

    document.getElementById('btn-factorizados').addEventListener('click', () => {
        window.location.href = 'factorizados.html';
    });

    document.getElementById('btn-incognita').addEventListener('click', () => {
        window.location.href = 'incognita.html';
    });
});
