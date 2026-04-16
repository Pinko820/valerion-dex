import { CONFIG } from './config.js';

export function openDetails(p) {
    const content = document.getElementById('panel-content');
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('panel-overlay');
    const mainLayout = document.getElementById('main-layout');

    if (!content || !panel) return;

    // Llenar contenido
    content.innerHTML = `
        <div class="p-8 pt-16">
            <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="w-48 h-48 mx-auto pixelated mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <div class="text-center mb-8">
                <h2 class="text-4xl font-black uppercase text-white leading-none">${p.nombreFinal}</h2>
                <p class="text-yellow-500 font-bold text-xl mt-2">#${String(p.numero).padStart(3, '0')}</p>
            </div>
            </div>
    `;

    // Abrir panel
    panel.classList.add('open');

    // Lógica PC vs Móvil
    if (window.innerWidth >= 1024) {
        // En PC: Ajustar margen para no tapar la lista y permitir interacción
        mainLayout.style.marginRight = "450px"; 
        overlay.classList.remove('show'); // No mostrar overlay
        document.body.style.overflow = 'auto'; // Permitir scroll en la lista
    } else {
        // En Móvil: Bloquear todo (comportamiento actual)
        mainLayout.style.marginRight = "0";
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; 
    }
}

export function closeDetails() {
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('panel-overlay');
    const mainLayout = document.getElementById('main-layout');

    panel.classList.remove('open');
    overlay.classList.remove('show');
    
    // Resetear layout
    mainLayout.style.marginRight = "0";
    document.body.style.overflow = 'auto';
}