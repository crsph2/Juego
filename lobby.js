// lobby.js - Lógica del lobby y tienda

// ---------- Datos de la tienda ----------
const ITEMS = {
    avatar: [
        { id: 'avatar_base', nombre: 'Aventurero', categoria: 'avatar', precio: 0, params: {} }
    ],
    superior: [
        { id: 'camiseta_roja', nombre: 'Camiseta Roja', categoria: 'superior', precio: 500, params: { top: 'shirt', clothingColor: 'ff0000' } },
        { id: 'camiseta_azul', nombre: 'Camiseta Azul', categoria: 'superior', precio: 500, params: { top: 'shirt', clothingColor: '0055ff' } },
        { id: 'camiseta_verde', nombre: 'Camiseta Verde', categoria: 'superior', precio: 500, params: { top: 'shirt', clothingColor: '00aa00' } },
        { id: 'camiseta_negra_estrella', nombre: 'Camiseta Negra', categoria: 'superior', precio: 500, params: { top: 'shirt', clothingColor: '111111' } },
        { id: 'camiseta_naranja', nombre: 'Camiseta Naranja', categoria: 'superior', precio: 500, params: { top: 'shirt', clothingColor: 'ff8800' } }
    ],
    inferior: [
        { id: 'pantalon_vaquero', nombre: 'Pantalón Vaquero', categoria: 'inferior', precio: 500, params: { pants: 'pants', pantsColor: '003366' } },
        { id: 'pantalon_corto_beige', nombre: 'Pantalón Corto Beige', categoria: 'inferior', precio: 500, params: { pants: 'shorts', pantsColor: 'd2b48c' } },
        { id: 'pantalon_negro', nombre: 'Pantalón Negro', categoria: 'inferior', precio: 500, params: { pants: 'pants', pantsColor: '222222' } },
        { id: 'pantalon_azul_marino', nombre: 'Pantalón Azul Marino', categoria: 'inferior', precio: 500, params: { pants: 'pants', pantsColor: '000080' } },
        { id: 'pantalon_gris', nombre: 'Pantalón Gris', categoria: 'inferior', precio: 500, params: { pants: 'pants', pantsColor: '808080' } }
    ],
    sombrero: [
        { id: 'gorra_roja', nombre: 'Gorra Roja', categoria: 'sombrero', precio: 500, params: { hat: 'cap', hatColor: 'ff0000' } },
        { id: 'sombrero_copa', nombre: 'Sombrero de Copa', categoria: 'sombrero', precio: 500, params: { hat: 'tophat', hatColor: '111111' } },
        { id: 'boina', nombre: 'Boina', categoria: 'sombrero', precio: 500, params: { hat: 'beanie', hatColor: '333333' } },
        { id: 'sombrero_vaquero', nombre: 'Sombrero Vaquero', categoria: 'sombrero', precio: 500, params: { hat: 'cowboy', hatColor: '8b4513' } },
        { id: 'corona', nombre: 'Corona', categoria: 'sombrero', precio: 500, params: { hat: 'crown', hatColor: 'ffd700' } }
    ],
    zapatillas: [
        { id: 'zapatillas_blancas', nombre: 'Zapatillas Blancas', categoria: 'zapatillas', precio: 500, params: { shoes: 'sneakers', shoesColor: 'ffffff' } },
        { id: 'zapatillas_negras', nombre: 'Zapatillas Negras', categoria: 'zapatillas', precio: 500, params: { shoes: 'sneakers', shoesColor: '111111' } },
        { id: 'zapatillas_rojas', nombre: 'Zapatillas Rojas', categoria: 'zapatillas', precio: 500, params: { shoes: 'sneakers', shoesColor: 'ff0000' } },
        { id: 'zapatillas_azules', nombre: 'Zapatillas Azules', categoria: 'zapatillas', precio: 500, params: { shoes: 'sneakers', shoesColor: '0055ff' } },
        { id: 'zapatillas_verdes', nombre: 'Zapatillas Verdes', categoria: 'zapatillas', precio: 500, params: { shoes: 'sneakers', shoesColor: '00aa00' } }
    ],
    insignia: [] // Las insignias no tienen parámetro directo en DiceBear, puedes usar un colgante en el pecho si quieres, pero por ahora se omite para mantener la coherencia visual.
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

    // Construir URL con parámetros
    const seed = encodeURIComponent(jugadorData.nombre || 'Aventurero');
    let url = `https://api.dicebear.com/10.x/adventurer/svg?seed=${seed}`;
    
    // Combinar params del equipo
    let params = {};
    ['superior', 'inferior', 'sombrero', 'zapatillas'].forEach(cat => {
        const itemId = equipo[cat];
        const item = ITEMS[cat].find(i => i.id === itemId);
        if (item && item.params) Object.assign(params, item.params);
    });

    // Añadir parámetros base (piel y pelo)
    params.skinColor = 'f1c27d';
    params.hairColor = '2c1b18';
    params.hair = 'short';

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    if (queryString) url += `&${queryString}`;

    // Generar HTML
    elAvatarPreview.innerHTML = `
        <div style="position:relative; width:120px; height:140px; overflow:hidden; border-radius: 50% 50% 0 0; background:#e3f2fd;">
            <img src="${url}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; margin-top:-25px;">
            <div style="position:absolute; bottom:-5px; left:50%; transform:translateX(-50%); font-size:0.9rem; background:rgba(255,255,255,0.8); padding:0 8px; border-radius:10px; white-space:nowrap; font-weight:700; color:#3b4cca;">
                ${jugadorData.nombre}
            </div>
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
