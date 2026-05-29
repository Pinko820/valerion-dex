import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

// OPTIMIZACIÓN: moves_data se precarga en background al inicio
export let movesCache = null;
let movesPromise = null;

export async function preloadMoves() {
    if (movesPromise) return movesPromise;
    
    movesPromise = Promise.all([
        fetch('pokemon_learnsets.json').then(r => r.json()),
        fetch('moves_dictionary.json').then(r => r.json())
    ]).then(([learnsets, dictionary]) => {
        // Guardamos ambos en una estructura unificada
        movesCache = { learnsets, dictionary };
        return movesCache;
    }).catch(err => {
        console.error("Error cargando archivos:", err);
        movesCache = { learnsets: {}, dictionary: {} };
        return movesCache;
    });
    
    return movesPromise;
}

// --- FUNCIONES DE APOYO ---
const getGrassKnotPower = (w) => {
    if (w < 10)  return 20;
    if (w < 25)  return 40;
    if (w < 50)  return 60;
    if (w < 100) return 80;
    if (w < 200) return 100;
    return 120;
};

const calcStat = (base, statName, level, iv, ev, nature) => {
    if (statName === 'hp') {
        if (base === 1) return 1;
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    }
    return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
};

function getCategoryIcon(cat) {
    const categories = {
        Physical: { color: 'bg-orange-600', label: 'FIS' },
        Special:  { color: 'bg-blue-600',   label: 'ESP' },
        Status:   { color: 'bg-gray-500',    label: 'EST' }
    };
    const info = categories[cat] || categories['Status'];
    return `<span class="text-[7px] px-1 py-0.5 rounded ${info.color} text-white font-black uppercase">${info.label}</span>`;
}

function renderMovesList(p, categoria) {
    const moves = p.movimientos?.[categoria] || [];
    
    if (!moves.length) return `<div class="p-8 text-center text-sm text-gray-500 italic">No hay movimientos en esta categoría.</div>`;

    return `
        <div class="flex flex-col gap-1">
            ${moves.map(m => {
                const moveId = (typeof m === 'string') ? m : m.id;
                const moveInfo = movesCache.dictionary[moveId] || { 
                    nombre_es: moveId, tipo: 'NORMAL', cat: 'Status', pot: '-', pre: '-' 
                };

                return `
                <div class="flex items-center gap-3 p-2 bg-gray-800/20 hover:bg-white/5 rounded-xl border border-white/5 transition-all group">
                    <div class="w-10 text-center font-mono font-bold text-yellow-500/80 text-xs">
                        ${m.nivel || '—'}
                    </div>

                    <div class="flex-1 flex flex-col justify-center min-w-0">
                        <span class="text-gray-100 font-bold uppercase text-xs truncate leading-tight group-hover:text-white">
                            ${moveInfo.nombre_es.replace(/_/g, ' ')}
                        </span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold" 
                                  style="background-color:${TYPE_MAP[moveInfo.tipo?.toUpperCase()]?.color || '#555'}">
                                ${TYPE_MAP[moveInfo.tipo?.toUpperCase()]?.esp || moveInfo.tipo}
                            </span>
                            ${getCategoryIcon(moveInfo.cat)}
                        </div>
                    </div>

                    <div class="flex flex-col items-end gap-0.5 text-[10px] font-mono text-gray-400">
                        <span class="leading-none"><span class="text-gray-600">P:</span> ${moveInfo.pot || '—'}</span>
                        <span class="leading-none"><span class="text-gray-600">A:</span> ${moveInfo.pre || '—'}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

export async function openDetails(p) {
    const content    = document.getElementById('panel-content');
    const panel      = document.getElementById('details-panel');
    const mainLayout = document.getElementById('main-layout');

    // OPTIMIZACIÓN: si el preload no ha terminado aún, esperamos (casi siempre ya está listo)
    if (!movesCache) await preloadMoves();
    // Accedemos a .learnsets y convertimos el ID a mayúsculas
    p.movimientos = movesCache.learnsets[p.id.toUpperCase()] || { nivel: [], mt: [], huevo: [] };
    //p.movimientos = movesCache[p.id] || { nivel: [], mt: [], huevo: [] };

    const weight  = p.física?.peso || 0;
    const gkPower = getGrassKnotPower(weight);
    const spritePath = `${CONFIG.SPRITE_PATH}${p.id}.webp`;

    const getTableHTML = (level) => {
        const labels = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
        return Object.entries(p.stats_base).map(([key, base]) => {
            const mMinus = calcStat(base, key, level, 0,  0,   key === 'hp' ? 1 : 0.9);
            const min    = calcStat(base, key, level, 31, 0,   1);
            const max    = calcStat(base, key, level, 31, 252, 1);
            const mPlus  = calcStat(base, key, level, 31, 252, key === 'hp' ? 1 : 1.1);
            return `
                <tr class="border-b border-white/5 text-[10px] font-mono">
                    <td class="text-left py-0.5 text-gray-500 font-bold uppercase">${labels[key]}</td>
                    <td class="text-blue-400 text-center py-0.5">${mMinus}</td>
                    <td class="text-gray-400 text-center py-0.5">${min}</td>
                    <td class="text-gray-400 text-center py-0.5">${max}</td>
                    <td class="text-red-400 font-bold text-center py-0.5">${mPlus}</td>
                </tr>`;
        }).join('');
    };

    content.innerHTML = `
        <div class="p-4">
            <div class="flex flex-row gap-3 mb-4 bg-gray-800/40 p-3 rounded-2xl border border-white/5">
                <div class="flex flex-col items-center gap-2 flex-shrink-0">
                    <div class="sprite-detail-frame"
                         data-sprite="${spritePath}"
                         style="width:128px;height:128px;image-rendering:pixelated;background-image:url('${spritePath}');background-repeat:no-repeat;background-position:0 0;background-size:auto 128px;flex-shrink:0;border-radius:0.75rem;">
                    </div>
                    <div class="space-y-0.5 bg-black/20 p-2 rounded-xl w-full">
                        ${Object.entries(p.stats_base).map(([s, val]) => `
                            <div class="flex items-center gap-1.5">
                                <span class="w-6 text-[7px] font-black uppercase text-gray-500">${s}</span>
                                <div class="flex-1 bg-gray-900 h-1 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500/80" style="width:${Math.min(val / 1.8, 100)}%"></div>
                                </div>
                                <span class="w-5 text-right font-mono text-[8px] text-gray-400">${val}</span>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-between min-w-0 gap-2">
                    <div>
                        <h2 class="text-2xl font-black uppercase text-white leading-tight break-words">${p.nombreFinal}</h2>
                        <p class="text-yellow-500 font-bold text-[9px] mt-0.5 uppercase tracking-widest">#${String(p.numero).padStart(3,'0')} · ${p.genLabel}</p>
                    </div>
                    <div class="flex gap-1 flex-wrap">
                        ${p.tipos.map(t => `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white" style="background-color:${TYPE_MAP[t.toUpperCase()]?.color}">${TYPE_MAP[t.toUpperCase()]?.esp}</span>`).join('')}
                    </div>
                    <div class="flex gap-1 text-[9px] font-bold uppercase">
                        <div class="flex-1 bg-black/30 px-2 py-1 rounded-lg"><span class="text-gray-500 block text-[7px]">Altura</span>${p.física?.altura} m</div>
                        <div class="flex-1 bg-black/30 px-2 py-1 rounded-lg"><span class="text-gray-500 block text-[7px]">Peso</span>${p.física?.peso} kg</div>
                        <div class="flex-1 bg-black/30 px-2 py-1 rounded-lg border border-green-500/20 text-green-400"><span class="text-gray-500 block text-[7px]">H. Lazo</span>${gkPower} pw</div>
                    </div>
                    <div class="bg-black/20 px-2 py-1.5 rounded-lg">
                        <span class="text-[7px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Habilidades</span>
                        <div class="text-[10px] text-gray-200 font-bold">${p.habilidades.map(h => ABILITY_MAP[h] || h).join(' / ')}</div>
                        ${p.habilidad_oculta.length ? `<div class="text-[9px] text-yellow-600 italic">↳ ${p.habilidad_oculta.map(h => ABILITY_MAP[h] || h).join(', ')}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="bg-gray-800/30 px-3 py-2 rounded-2xl border border-white/5 mb-3">
                <div class="flex justify-between items-center mb-1">
                    <h3 class="font-black uppercase text-gray-500 text-[8px] tracking-widest">Calculadora</h3>
                    <div class="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                        <span class="text-[7px] font-black text-gray-500 uppercase">Nv</span>
                        <input type="number" id="calc-level" value="100" min="1" max="100"
                               class="w-8 bg-transparent border-none text-white font-mono text-[10px] p-0 text-center outline-none">
                    </div>
                </div>
                <table class="w-full">
                    <thead>
                        <tr class="text-[7px] text-gray-600 uppercase font-black">
                            <th class="text-left pb-0.5">Stat</th>
                            <th class="pb-0.5 text-blue-400">Min−</th>
                            <th class="pb-0.5">Min</th>
                            <th class="pb-0.5">Max</th>
                            <th class="pb-0.5 text-red-400">Max+</th>
                        </tr>
                    </thead>
                    <tbody id="calc-body">${getTableHTML(100)}</tbody>
                </table>
            </div>

            <div class="bg-gray-800/30 rounded-3xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20" id="moves-tabs">
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-yellow-500 border-b-2 border-yellow-500 active-tab" data-tab="nivel">Nivel</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="mt">MT/Tutor</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${renderMovesList(p, 'nivel')}
                </div>
            </div>
        </div>`;

    // Listeners
    document.getElementById('calc-level').addEventListener('input', (e) => {
        const lvl = parseInt(e.target.value) || 1;
        document.getElementById('calc-body').innerHTML = getTableHTML(lvl);
    });

    // Detectar fondo negro en sprite del panel
    const detailFrame = content.querySelector('.sprite-detail-frame');
    if (detailFrame) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const fs = this.naturalHeight;
            canvas.width = fs; canvas.height = fs;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
                const pixel = ctx.getImageData(2, 2, 1, 1).data;
                if (pixel[0] < 30 && pixel[1] < 30 && pixel[2] < 30 && pixel[3] > 200)
                    detailFrame.style.mixBlendMode = 'screen';
            } catch (e) { /* cross-origin */ }
        };
        img.src = spritePath;
    }

    content.querySelectorAll('#moves-tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            content.querySelectorAll('#moves-tabs button').forEach(b => {
                b.classList.remove('active-tab', 'text-yellow-500', 'border-b-2', 'border-yellow-500');
                b.classList.add('text-gray-500');
            });
            btn.classList.add('active-tab', 'text-yellow-500', 'border-b-2', 'border-yellow-500');
            btn.classList.remove('text-gray-500');
            document.getElementById('moves-container').innerHTML = renderMovesList(p, btn.dataset.tab);
        });
    });

    panel.classList.add('open');
    if (window.innerWidth >= 1024) {
        mainLayout.style.marginRight = "40%";
        document.getElementById('pokedex').style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('main-layout').style.marginRight = "0";
    document.getElementById('pokedex').style.gridTemplateColumns = '';
    document.body.style.overflow = 'auto';
}