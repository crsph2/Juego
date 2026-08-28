// lobby.js - Lógica del lobby y tienda

const ITEMS = {
    avatar: [
        { id: 'avatar_base', nombre: 'Clásico', categoria: 'avatar', precio: 0, style: 'adventurer' },
        { id: 'avatar_robot', nombre: 'Robot', categoria: 'avatar', precio: 800, style: 'bottts' },
        { id: 'avatar_personas', nombre: 'Caricatura', categoria: 'avatar', precio: 800, style: 'personas' },
        { id: 'avatar_notionists', nombre: 'Minimalista', categoria: 'avatar', precio: 800, style: 'notionists' }
    ],
    simbolo: [
        { id: 'pi', nombre: 'Pi (π)', categoria: 'simbolo', precio: 250, pos: 'top-left' },
        { id: 'integral', nombre: 'Integral (∫)', categoria: 'simbolo', precio: 250, pos: 'top-right' },
        { id: 'raiz', nombre: 'Raíz (√)', categoria: 'simbolo', precio: 250, pos: 'bottom-left' },
        { id: 'sigma', nombre: 'Sigma (Σ)', categoria: 'simbolo', precio: 250, pos: 'bottom-right' },
        { id: 'infinito', nombre: 'Infinito (∞)', categoria: 'simbolo', precio: 250, pos: 'center-left' },
        { id: 'delta', nombre: 'Delta (Δ)', categoria: 'simbolo', precio: 250, pos: 'center-right' },
        { id: 'theta', nombre: 'Theta (θ)', categoria: 'simbolo', precio: 250, pos: 'top-left' },
        { id: 'suma_frac', nombre: 'Fracción', categoria: 'simbolo', precio: 250, pos: 'top-right' }
    ]
};

window.obtenerItemPorIdGlobal = function(id) {
    for (const cat in ITEMS) {
        const encontrado = ITEMS[cat].find(item => item.id === id);
        if (encontrado) return encontrado;
    }
    return null;
};

let categoriaActual = 'avatar';
let jugadorData = window.jugador;

const elCoinsTienda = document.getElementById('tienda-coins');
const elAvatarPreview = document.getElementById('avatar-preview');
const elItemsTienda = document.getElementById('items-tienda');
const categoriaBtns = document.querySelectorAll('.categoria-btn');

document.addEventListener('DOMContentLoaded', () => {
    if (window.jugador) { iniciarTienda(); }
    else { document.addEventListener('jugador-cargado', iniciarTienda); }
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
    mostrarItemsCategoria('avatar');
}

function mostrarItemsCategoria(categoria) {
    const items = ITEMS[categoria];
    if (!items) return;
    elItemsTienda.innerHTML = '';
    
    items.forEach(item => {
        // Lógica para avatares
        let inventarioAvatares = [];
        let inventarioItem = false;
        let equipado = false;

        if (categoria === 'avatar') {
            // Buscar todos los avatares de este tipo en el inventario
            inventarioAvatares = jugadorData.inventario.filter(id => id.startsWith(item.id));
            inventarioItem = inventarioAvatares.length > 0;
            equipado = inventarioAvatares.includes(jugadorData.equipo.avatar);
        } 
        else if (categoria === 'simbolo') {
            inventarioItem = jugadorData.inventario.includes(`simbolo_${item.id}`);
            equipado = (jugadorData.equipo.simbolos || []).some(s => s.id === item.id);
        }

        const card = document.createElement('div');
        card.className = 'item-card';
        if (equipado) card.classList.add('equipado');

        let contenidoPreview = '';
        let accionesHTML = '';

        if (categoria === 'avatar') {
            const estilo = item.style;
            // Vista previa genérica
            contenidoPreview = `<div style="width:60px; height:60px; margin:0 auto; overflow:hidden; border-radius:50%; background:#e3f2fd;"><img src="https://api.dicebear.com/10.x/${estilo}/svg?seed=Preview" style="width:100%; height:100%; object-fit:cover;"></div>`;

            // Si tiene avatares comprados, mostrar una cuadrícula con ellos
            if (inventarioAvatares.length > 0) {
                let miniaturasHTML = '<div class="item-avatar-coleccion">';
                inventarioAvatares.forEach(avatarId => {
                    const isEquipado = jugadorData.equipo.avatar === avatarId;
                    const claseEquipado = isEquipado ? 'avatar-miniatura equipado' : 'avatar-miniatura';
                    miniaturasHTML += `
                        <div class="${claseEquipado}" onclick="equiparAvatarEspecifico('${avatarId}')" title="Equipar">
                            <img src="https://api.dicebear.com/10.x/${estilo}/svg?seed=${avatarId}" alt="Avatar">
                        </div>
                    `;
                });
                miniaturasHTML += '</div>';
                accionesHTML += miniaturasHTML;
            }

            // Botones de acción
            if (inventarioItem) {
                accionesHTML += `<br><button class="btn-comprar" data-id="${item.id}" data-cat="${categoria}" data-precio="${item.precio}">Comprar otro</button>`;
            } else {
                accionesHTML += `<button class="btn-comprar" data-id="${item.id}" data-cat="${categoria}" data-precio="${item.precio}">Comprar</button>`;
            }
        } else {
            // Lógica para símbolos (sin cambios)
            const svg = SIMBOLOS_SVG[item.id];
            contenidoPreview = `<div style="font-size:2.5rem; color:var(--btn-secondary); display:flex; justify-content:center;">${svg}</div>`;
            
            if (inventarioItem) {
                if (equipado) {
                    accionesHTML = `<button class="btn-quitar" data-id="${item.id}" data-cat="${categoria}">Quitar</button>`;
                } else {
                    accionesHTML = `<button class="btn-equipar" data-id="${item.id}" data-cat="${categoria}">Equipar</button>`;
                }
            } else {
                accionesHTML = `<button class="btn-comprar" data-id="${item.id}" data-cat="${categoria}" data-precio="${item.precio}">Comprar</button>`;
            }
        }

        card.innerHTML = `
            ${contenidoPreview}
            <div class="item-nombre">${item.nombre}</div>
            <div class="item-precio">${item.precio} 🪙</div>
            <div class="item-acciones">${accionesHTML}</div>
        `;
        elItemsTienda.appendChild(card);

        // Event listeners
        const btnComprar = card.querySelector('.btn-comprar');
        if (btnComprar) btnComprar.addEventListener('click', () => comprarItem(item.id, item.categoria, item.precio));
        const btnEquipar = card.querySelector('.btn-equipar');
        if (btnEquipar) btnEquipar.addEventListener('click', () => equiparItem(item.id, item.categoria));
        const btnQuitar = card.querySelector('.btn-quitar');
        if (btnQuitar) btnQuitar.addEventListener('click', () => quitarItem(item.id, item.categoria));
    });
}

// Función global para equipar un avatar específico desde la cuadrícula
window.equiparAvatarEspecifico = async function(avatarId) {
    if (!window.jugador || !window.uid) return;
    try {
        jugadorData.equipo.avatar = avatarId;
        await db.collection('usuarios').doc(window.uid).update({ 'equipo.avatar': avatarId });
        
        mostrarItemsCategoria('avatar');
        actualizarVistaPrevia();
        if (window.actualizarAvatar) window.actualizarAvatar();
        mostrarFeedback('¡Avatar equipado!', 'exito');
    } catch (error) {
        console.error('Error al equipar avatar:', error);
        alert('Error al equipar avatar.');
    }
};

async function comprarItem(id, categoria, precio) {
    if (jugadorData.monedas < precio) { alert('No tienes suficientes monedas.'); return; }
    
    // Generar ID ÚNICO para cada avatar comprado
    const itemIdCompra = categoria === 'simbolo' ? `simbolo_${id}` : `${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (jugadorData.inventario.includes(itemIdCompra)) { alert('Ya tienes este item.'); return; }

    const item = ITEMS[categoria].find(i => i.id === id);
    if (!confirm(`¿Comprar ${item.nombre} por ${precio} monedas?`)) return;

    try {
        jugadorData.monedas -= precio;
        jugadorData.inventario.push(itemIdCompra);
        
        await db.collection('usuarios').doc(window.uid).update({ monedas: jugadorData.monedas, inventario: jugadorData.inventario });
        
        actualizarMonedas();
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        mostrarFeedback('¡Compra exitosa!', 'exito');
    } catch (error) { console.error('Error al comprar:', error); alert('Error al comprar.'); }
}

async function equiparItem(id, categoria) {
    try {
        if (categoria === 'avatar') {
            // Equipar el primer avatar no equipado de ese tipo
            const inventarioAvatares = jugadorData.inventario.filter(item => item.startsWith(id));
            const avatarEquipar = inventarioAvatares.find(item => item !== jugadorData.equipo.avatar) || inventarioAvatares[0];
            
            jugadorData.equipo.avatar = avatarEquipar;
            await db.collection('usuarios').doc(window.uid).update({ 'equipo.avatar': avatarEquipar });
        } else {
            const item = ITEMS.simbolo.find(i => i.id === id);
            if (!item) return;
            jugadorData.equipo.simbolos = jugadorData.equipo.simbolos.filter(s => s.id !== id);
            jugadorData.equipo.simbolos.push({ id: id, pos: item.pos });
            await db.collection('usuarios').doc(window.uid).update({ 'equipo.simbolos': jugadorData.equipo.simbolos });
        }
        
        mostrarItemsCategoria(categoriaActual);
        actualizarVistaPrevia();
        if (window.actualizarAvatar) window.actualizarAvatar();
        mostrarFeedback('¡Item equipado!', 'exito');
    } catch (error) { console.error('Error al equipar:', error); alert('Error al equipar.'); }
}

async function quitarItem(id, categoria) {
    if (categoria === 'simbolo') {
        jugadorData.equipo.simbolos = jugadorData.equipo.simbolos.filter(s => s.id !== id);
        await db.collection('usuarios').doc(window.uid).update({ 'equipo.simbolos': jugadorData.equipo.simbolos });
    }
    
    mostrarItemsCategoria(categoriaActual);
    actualizarVistaPrevia();
    if (window.actualizarAvatar) window.actualizarAvatar();
    mostrarFeedback('¡Item quitado!', 'exito');
}

function actualizarVistaPrevia() {
    if (!elAvatarPreview) return;
    const equipo = jugadorData.equipo;
    const nombre = jugadorData.nombre;

    let estilo = AVATAR_ESTILOS['avatar_base'];
    if (equipo.avatar.includes('robot')) estilo = AVATAR_ESTILOS['avatar_robot'];
    else if (equipo.avatar.includes('personas')) estilo = AVATAR_ESTILOS['avatar_personas'];
    else if (equipo.avatar.includes('notionists')) estilo = AVATAR_ESTILOS['avatar_notionists'];

    let url = `https://api.dicebear.com/10.x/${estilo.style}/svg?seed=${equipo.avatar}`;
    url += '&skinColor=f1c27d&hairColor=2c1b18&hair=short';

    let simbolosHTML = '';
    (equipo.simbolos || []).forEach(simbolo => {
        const svg = SIMBOLOS_SVG[simbolo.id];
        if (svg) simbolosHTML += `<div class="avatar-simbolo">${svg}</div>`;
    });

    elAvatarPreview.innerHTML = `
        <div style="position:relative; width:140px; height:160px; overflow:hidden; border-radius: 50% 50% 0 0; background:var(--avatar-bg);">
            <img src="${url}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; margin-top:-25px;">
        </div>
        <div class="avatar-simbolos-fila">
            ${simbolosHTML}
        </div>
        <div style="margin-top:5px; font-size:0.9rem; background:var(--card-bg); padding:0 8px; border-radius:10px; white-space:nowrap; font-weight:700; color:var(--text-main);">${nombre}</div>
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });
    document.getElementById('btn-factorizados').addEventListener('click', () => { window.location.href = 'factorizados.html'; });
    document.getElementById('btn-incognita').addEventListener('click', () => { window.location.href = 'incognita.html'; });
});
