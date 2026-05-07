import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

// Función para traducir habilidades
const translateAbility = (id) => ABILITY_MAP[id.toUpperCase()] || id;

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
    let fontSizeClass = p.nombreFinal.length > 18 ? "text-[10px]" :
                        p.nombreFinal.length > 13 ? "text-xs" :
                        p.nombreFinal.length > 9  ? "text-sm" : "text-base";

    const typesHTML = p.tipos.map(t => {
        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#555' };
        return `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold text-white uppercase" style="background-color: ${info.color}">${info.esp}</span>`;
    }).join('');

    const habilidadesUnicas = new Set([...p.habilidades, ...p.habilidad_oculta]);
    let abilitiesHTML = "";

    if (habilidadesUnicas.size === 1) {
        const habilidad = translateAbility(Array.from(habilidadesUnicas)[0]);
        abilitiesHTML = `<span class="text-white font-semibold">${habilidad}</span>`;
    } else {
        const normales = p.habilidades.map(translateAbility).join(' / ');
        const ocultaFiltrada = p.habilidad_oculta.filter(h => !p.habilidades.includes(h));
        const ocultaHTML = ocultaFiltrada.length > 0
            ? `<div class="text-yellow-500/70 italic leading-tight">↳ ${ocultaFiltrada.map(translateAbility).join(', ')}</div>`
            : "";
        abilitiesHTML = `<span class="text-white font-semibold">${normales}</span>${ocultaHTML}`;
    }

    const numeroFormateado = String(p.numero).padStart(3, '0');
    const spritePath = `${CONFIG.SPRITE_PATH}${p.id}.png`;

    return `
        <div class="card-pokemon bg-gray-800 rounded-2xl hover:bg-gray-750 transition-all border-l-4 border-yellow-600 group shadow-md flex flex-row cursor-pointer overflow-hidden"
             data-id="${p.id}">

            <!-- IZQUIERDA: sprite (primer frame) -->
            <div class="flex-shrink-0 w-[84px] flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors relative p-1">
                <span class="absolute top-1 left-1 font-mono text-[9px] font-black text-yellow-500/50 leading-none">#${numeroFormateado}</span>
                <div class="sprite-frame-box"
                     data-sprite="${spritePath}"
                     style="
                        width: 72px;
                        height: 72px;
                        image-rendering: pixelated;
                        background-image: url('${spritePath}');
                        background-repeat: no-repeat;
                        background-position: 0 0;
                        background-size: auto 72px;
                     ">
                </div>
            </div>

            <!-- DERECHA: info -->
            <div class="flex-1 flex flex-col justify-between p-2 min-w-0">
                <div>
                    <h2 class="font-black ${fontSizeClass} uppercase tracking-tight text-white leading-tight" style="word-break: break-word; hyphens: auto;">${p.nombreFinal}</h2>
                    <p class="text-yellow-500/70 text-[9px] font-bold mb-1">${p.genLabel}</p>
                    <div class="flex gap-0.5 flex-wrap mb-1.5">${typesHTML}</div>
                </div>

                <div class="text-[10px] text-gray-300 leading-tight mb-1.5">
                    ${abilitiesHTML}
                </div>

                <div class="bg-gray-900/80 rounded-lg px-1.5 py-1">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[7px] font-bold text-yellow-500 uppercase tracking-widest">BST</span>
                        <span class="text-xs font-black text-white">${p.bst}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-x-1.5 text-[9px] font-mono text-gray-400">
                        <div class="flex justify-between"><span>HP</span><span class="text-white">${p.stats_base.hp}</span></div>
                        <div class="flex justify-between"><span>ATK</span><span class="text-white">${p.stats_base.atq}</span></div>
                        <div class="flex justify-between"><span>DEF</span><span class="text-white">${p.stats_base.def}</span></div>
                        <div class="flex justify-between"><span>SPA</span><span class="text-white">${p.stats_base.spa}</span></div>
                        <div class="flex justify-between"><span>SPD</span><span class="text-white">${p.stats_base.spd}</span></div>
                        <div class="flex justify-between"><span>VEL</span><span class="text-white">${p.stats_base.vel}</span></div>
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
