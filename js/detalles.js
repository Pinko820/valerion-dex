import { CONFIG } from './config.js';

export function openDetails(p) {
    const content = document.getElementById('panel-content');
    if (!content) return;

    content.innerHTML = `
        <div class="p-8 pt-16">
            <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="w-48 h-48 mx-auto pixelated mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <div class="text-center mb-8">
                <h2 class="text-4xl font-black uppercase text-white leading-none">${p.nombreFinal}</h2>
                <p class="text-yellow-500 font-bold text-xl mt-2">#${String(p.numero).padStart(3, '0')}</p>
            </div>
            </div>
    `;

    document.getElementById('details-panel').classList.add('open');
    document.getElementById('panel-overlay').classList.add('show');
    document.body.style.overflow = 'hidden'; 
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('panel-overlay').classList.remove('show');
    document.body.style.overflow = 'auto'; 
}