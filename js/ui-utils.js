import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

const translateAbility = (id) => ABILITY_MAP[id.toUpperCase()] || id;

// OPTIMIZACIÓN: IntersectionObserver compartido para lazy-load de sprites
let spriteObserver = null;
function getSpriteObserver() {
    if (spriteObserver) return spriteObserver;
    spriteObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const src = el.dataset.sprite;
            if (src) {
                el.style.backgroundImage = `url('${src}')`;
                el.removeAttribute('data-sprite'); // no volver a observar
            }
            spriteObserver.unobserve(el);
        });
    }, {
        rootMargin: '200px 0px', // precargar con 200px de anticipación
        threshold: 0
    });
    return spriteObserver;
}

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
    const fontSizeClass = p.nombreFinal.length > 18 ? "text-[10px]" :
                          p.nombreFinal.length > 13 ? "text-xs" :
                          p.nombreFinal.length > 9  ? "text-sm" : "text-base";

    const typesHTML = p.tipos.map(t => {
        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#555' };
        return `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold text-white uppercase" style="background-color:${info.color}">${info.esp}</span>`;
    }).join('');

    const habilidadesUnicas = new Set([...p.habilidades, ...p.habilidad_oculta]);
    let abilitiesHTML;

    if (habilidadesUnicas.size === 1) {
        abilitiesHTML = `<span class="text-white font-semibold">${translateAbility([...habilidadesUnicas][0])}</span>`;
    } else {
        const normales = p.habilidades.map(translateAbility).join(' / ');
        const ocultaFiltrada = p.habilidad_oculta.filter(h => !p.habilidades.includes(h));
        const ocultaHTML = ocultaFiltrada.length
            ? `<div class="text-yellow-500/70 italic leading-tight">↳ ${ocultaFiltrada.map(translateAbility).join(', ')}</div>`
            : "";
        abilitiesHTML = `<span class="text-white font-semibold">${normales}</span>${ocultaHTML}`;
    }

    const numeroFormateado = String(p.numero).padStart(3, '0');
    const spritePath = `${CONFIG.SPRITE_PATH}${p.id}.png`;

    // OPTIMIZACIÓN: data-sprite sin backgroundImage → el observer lo inyecta solo cuando entra al viewport
    return `
        <div class="card-pokemon bg-gray-800 rounded-2xl hover:bg-gray-750 transition-all border-l-4 border-yellow-600 group shadow-md flex flex-row cursor-pointer overflow-hidden"
             data-id="${p.id}">
            <div class="flex-shrink-0 w-[84px] flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors relative p-1">
                <span class="absolute top-1 left-1 font-mono text-[9px] font-black text-yellow-500/50 leading-none">#${numeroFormateado}</span>
                <div class="sprite-frame-box lazy-sprite"
                     data-sprite="${spritePath}"
                     style="width:72px;height:72px;image-rendering:pixelated;background-repeat:no-repeat;background-position:0 0;background-size:auto 72px;">
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-between p-2 min-w-0">
                <div>
                    <h2 class="font-black ${fontSizeClass} uppercase tracking-tight text-white leading-tight" style="word-break:break-word;hyphens:auto">${p.nombreFinal}</h2>
                    <p class="text-yellow-500/70 text-[9px] font-bold mb-1">${p.genLabel}</p>
                    <div class="flex gap-0.5 flex-wrap mb-1.5">${typesHTML}</div>
                </div>
                <div class="text-[10px] text-gray-300 leading-tight mb-1.5">${abilitiesHTML}</div>
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
        </div>`;
}

// OPTIMIZACIÓN: registra los sprites recién insertados en el observer
export function observeNewSprites(container) {
    const obs = getSpriteObserver();
    container.querySelectorAll('.lazy-sprite[data-sprite]').forEach(el => obs.observe(el));
}

export function populateTypeFilter(selectorId, defaultText) {
    const select = document.getElementById(selectorId);
    if (!select) return;
    select.innerHTML = `<option value="all">${defaultText}</option>` +
        Object.values(TYPE_MAP).map(tipo =>
            `<option value="${tipo.esp}">${tipo.esp}</option>`
        ).join('');
}