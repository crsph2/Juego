// lobby.js - Lógica del lobby y tienda

// ---------- Datos de la tienda ----------
const ITEMS = {
    avatar: [
        { id: 'piel_amarilla', nombre: 'Piel Amarilla (Avatar base)', emoji: '🧑', categoria: 'avatar', precio: 100 }
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
        { id: 'insignia_pi', nombre: 'Pi (π)', emoji: 'π', categoria: 'insignia', precio: 500 },
        { id: 'insignia_integral', nombre: 'Integral (∫)', emoji: '∫', categoria: 'insignia', precio: 500 },
        { id: 'insignia_raiz', nombre: 'Raíz Cuadrada (√)', emoji: '√', categoria: 'insignia', precio: 500 },
        { id: 'insignia_suma', nombre: 'Sumatoria (Σ)', emoji: 'Σ', categoria: 'insignia', precio: 500 },
        { id: 'insignia_infinito', nombre: 'Infinito (∞)', emoji: '∞', categoria: 'insignia', precio: 500 }
    ]
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
    // Esperar a que common.js cargue el jugador
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
    // Configurar pestañas
    categoriaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoriaBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaActual = btn.dataset.categoria;
            mostrarItemsCategoria(categoriaActual);
        });
    });
    // Mostrar primera categoría
    mostrarItemsCategoria('superior');
}

// ---------- Mostrar items de una categoría ----------
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

        // Event listeners
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

// ---------- Comprar item ----------
async function comprarItem(id, categoria, precio) {
    if (jugadorData.monedas < precio) {
        alert('No tienes suficientes monedas.');
        return;
    }
    if (jugadorData.inventario.includes(id)) {
        alert('Ya tienes este item.');
        return;
    }
    // Confirmar compra
    const item = ITEMS[categoria].find(i => i.id === id);
    if (!confirm(`¿Comprar ${item.nombre} por ${precio} monedas?`)) return;

    try {
        // Restar monedas
        jugadorData.monedas -= precio;
        jugadorData.inventario.push(id);
        
        // Si es el avatar, equiparlo automáticamente
        if (categoria === 'avatar') {
            jugadorData.equipo[categoria] = id;
        }
        
        // Guardar en Firestore
        await db.collection('usuarios').doc(window.uid).update({
            monedas: jugadorData.monedas,
            inventario: jugadorData.inventario,
            equipo: jugadorData.equipo
        });
        // Actualizar UI
        actualizarMonedas();
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        mostrarFeedback('¡Compra exitosa!', 'exito');
    } catch (error) {
        console.error('Error al comprar:', error);
        alert('Error al comprar. Intenta de nuevo.');
    }
}

// ---------- Equipar item ----------
async function equiparItem(id, categoria) {
    if (!jugadorData.inventario.includes(id)) {
        alert('No tienes este item.');
        return;
    }
    // Si ya está equipado, no hacer nada
    if (jugadorData.equipo[categoria] === id) return;

    try {
        jugadorData.equipo[categoria] = id;
        await db.collection('usuarios').doc(window.uid).update({
            equipo: jugadorData.equipo
        });
        // Actualizar UI
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        mostrarFeedback('¡Item equipado!', 'exito');
    } catch (error) {
        console.error('Error al equipar:', error);
        alert('Error al equipar. Intenta de nuevo.');
    }
}

// ---------- Actualizar vista previa del avatar ----------
function actualizarVistaPrevia() {
    if (!elAvatarPreview) return;
    const equipo = jugadorData.equipo;
    // Obtener emojis de cada categoría
    const avatarItem = ITEMS.avatar.find(i => i.id === 'piel_amarilla');
    const avatarEmoji = avatarItem ? avatarItem.emoji : '🧑';
    const avatarNombre = jugadorData.inventario.includes('piel_amarilla') ? 'Piel Amarilla' : 'Sin avatar';

    const superior = equipo.superior ? ITEMS.superior.find(i => i.id === equipo.superior) : null;
    const inferior = equipo.inferior ? ITEMS.inferior.find(i => i.id === equipo.inferior) : null;
    const sombrero = equipo.sombrero ? ITEMS.sombrero.find(i => i.id === equipo.sombrero) : null;
    const zapatillas = equipo.zapatillas ? ITEMS.zapatillas.find(i => i.id === equipo.zapatillas) : null;
    const insignia = equipo.insignia ? ITEMS.insignia.find(i => i.id === equipo.insignia) : null;

    let html = `<div class="avatar-base">${avatarEmoji}</div>`;
    if (sombrero) html += `<div class="avatar-sombrero">${sombrero.emoji}</div>`;
    if (superior) html += `<div class="avatar-superior">${superior.emoji}</div>`;
    if (inferior) html += `<div class="avatar-inferior">${inferior.emoji}</div>`;
    if (zapatillas) html += `<div class="avatar-zapatillas">${zapatillas.emoji}</div>`;
    if (insignia) html += `<div class="avatar-insignia">${insignia.emoji}</div>`;

    // Lista de equipados
    html += `<div class="avatar-lista">
        <p><strong>Avatar:</strong> ${avatarNombre}</p>
        <p><strong>Superior:</strong> ${superior ? superior.nombre : 'Ninguno'}</p>
        <p><strong>Inferior:</strong> ${inferior ? inferior.nombre : 'Ninguno'}</p>
        <p><strong>Sombrero:</strong> ${sombrero ? sombrero.nombre : 'Ninguno'}</p>
        <p><strong>Zapatillas:</strong> ${zapatillas ? zapatillas.nombre : 'Ninguno'}</p>
        <p><strong>Insignia:</strong> ${insignia ? insignia.nombre : 'Ninguno'}</p>
    </div>`;

    elAvatarPreview.innerHTML = html;
}

// ---------- Actualizar monedas en tienda ----------
function actualizarMonedas() {
    if (elCoinsTienda) elCoinsTienda.textContent = jugadorData.monedas || 0;
    // También actualizar el contador global del lobby
    const elMonedasGlobal = document.getElementById('player-coins');
    if (elMonedasGlobal) elMonedasGlobal.textContent = jugadorData.monedas || 0;
}

// ---------- Feedback ----------
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

// ---------- Botones de juegos ----------
document.addEventListener('DOMContentLoaded', () => {
    // Cerrar sesión
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
