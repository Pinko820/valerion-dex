import { CONFIG, TYPE_MAP } from './config.js';

export function getGenLabel(gen) {
    if (gen === CONFIG.VALERION_GEN) return "Valerion";
    return typeof gen === 'number' ? `Gen ${gen}` : gen;
}

export function handleMissingImage(imgElement) {
    imgElement.classList.add('hidden');
    imgElement.nextElementSibling?.classList.remove('hidden');
    imgElement.nextElementSibling?.classList.add('flex');
}

export function createCard(p) {
    let fontSizeClass = p.nombreFinal.length > 18 ? "text-base" : 
                        p.nombreFinal.length > 14 ? "text-lg" : 
                        p.nombreFinal.length > 10 ? "text-xl" : "text-2xl";

    const typesHTML = p.tipos.map(t => {
        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#555' };
        return `<span class="text-[10px] px-2 py-0.5 rounded font-bold text-white uppercase" style="background-color: ${info.color}">${info.esp}</span>`;
    }).join('');

    // --- LÓGICA DE HABILIDADES ---
    const todasHab = [...p.habilidades, ...p.habilidad_oculta];
    let abilitiesHTML = "";
    
    if (todasHab.length === 1) {
        abilitiesHTML = `<div class="text-[10px] text-gray-400 italic">Habilidad Innata: <span class="text-white font-bold">${todasHab[0]}</span></div>`;
    } else {
        const normales = p.habilidades.join(' / ');
        const oculta = p.habilidad_oculta.length > 0 ? 
            `<div class="text-yellow-500/80 italic mt-0.5">Oculta: ${p.habilidad_oculta.join(', ')}</div>` : "";
        
        abilitiesHTML = `
            <div class="text-[10px] text-gray-400">
                <div class="text-white font-medium">${normales}</div>
                ${oculta}
            </div>
        `;
    }

    const numeroFormateado = String(p.numero).padStart(3, '0');

    return `
        <div class="card-pokemon bg-gray-800 px-3 py-6 rounded-3xl hover:bg-gray-750 transition-all border-b-8 border-yellow-600 group shadow-lg flex flex-col relative cursor-pointer" 
             data-id="${p.id}">
            <span class="absolute top-4 right-6 font-mono text-xl font-black text-white/10 group-hover:text-yellow-500/20 transition-colors">
                #${numeroFormateado}
            </span>
            <div class="sprite-window mb-4 group-hover:scale-110 transition-transform relative flex-shrink-0">
                <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated" alt="${p.nombre}" loading="lazy">
            </div>
            <div class="flex-grow flex flex-col justify-between text-center px-1">
                <div class="mb-4">
                    <h2 class="font-black ${fontSizeClass} uppercase tracking-tighter text-white leading-tight break-words">${p.nombreFinal}</h2>
                    <p class="text-yellow-500 text-[10px] font-bold mt-1 mb-2">${p.genLabel}</p>
                    <div class="flex justify-center gap-1 mb-3 flex-wrap">${typesHTML}</div>
                    <div class="bg-black/20 py-2 px-1 rounded-lg border border-white/5 mb-2">
                        ${abilitiesHTML}
                    </div>
                </div>
                
                <div class="bg-gray-900 p-3 rounded-xl mt-auto shadow-inner">
                    <div class="flex justify-between items-center mb-2 px-1 border-b border-gray-700 pb-1">
                        <span class="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Total Stats</span>
                        <span class="text-sm font-black text-white">${p.bst}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono opacity-90 text-gray-400">
                        <div class="flex justify-between border-b border-gray-800"><span>HP</span><span class="text-white">${p.stats_base.hp}</span></div>
                        <div class="flex justify-between border-b border-gray-800"><span>ATK</span><span class="text-white">${p.stats_base.atq}</span></div>
                        <div class="flex justify-between border-b border-gray-800"><span>DEF</span><span class="text-white">${p.stats_base.def}</span></div>
                        <div class="flex justify-between border-b border-gray-800"><span>SPA</span><span class="text-white">${p.stats_base.spa}</span></div>
                        <div class="flex justify-between border-b border-gray-800"><span>SPD</span><span class="text-white">${p.stats_base.spd}</span></div>
                        <div class="flex justify-between border-b border-gray-800"><span>VEL</span><span class="text-white">${p.stats_base.vel}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function populateTypeFilter(selectorId, defaultText) {
    const select = document.getElementById(selectorId);
    if (!select) return;

    // Usamos t.esp para mostrarlo traducido, pero el valor sigue siendo el texto
    const optionsHTML = Object.values(TYPE_MAP).map(tipo => 
        `<option value="${tipo.esp}">${tipo.esp}</option>`
    ).join('');

    select.innerHTML = `<option value="all">${defaultText}</option>` + optionsHTML;
}
