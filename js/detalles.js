import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

let movesCache = null;

// --- FUNCIONES DE APOYO ---
const getGrassKnotPower = (w) => {
    if (w < 10) return 20;
    if (w < 25) return 40;
    if (w < 50) return 60;
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
        'Physical': { color: 'bg-orange-600', label: 'FIS' },
        'Special': { color: 'bg-blue-600', label: 'ESP' },
        'Status': { color: 'bg-gray-500', label: 'EST' }
    };
    const info = categories[cat] || categories['Status'];
    return `<span class="text-[7px] px-1 py-0.5 rounded ${info.color} text-white font-black uppercase">${info.label}</span>`;
}

// --- RENDERIZADO DE TABLA DE MOVIMIENTOS ---
function renderMovesList(p, categoria) {
    const moves = p.movimientos?.[categoria] || [];
    if (moves.length === 0) return `<div class="p-8 text-center text-[10px] text-gray-600 uppercase italic">Sin datos</div>`;

    return `
        <table class="w-full text-left border-separate border-spacing-y-1">
            <tbody class="text-[10px] font-mono">
                ${moves.map(m => `
                    <tr class="bg-white/5 hover:bg-white/10">
                        <td class="py-2 px-2 text-yellow-500/70 font-bold">${m.nivel || '—'}</td>
                        <td class="py-2 px-1">
                            <div class="flex flex-col">
                                <span class="text-gray-200 font-bold uppercase leading-none">${m.nombre.replace(/_/g, ' ')}</span>
                                <div class="flex items-center gap-1 mt-1">
                                    <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${TYPE_MAP[m.tipo?.toUpperCase()]?.color || '#555'}"></div>
                                    ${getCategoryIcon(m.cat)}
                                </div>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-right text-gray-400">
                            P: ${m.pot || '—'} A: ${m.pre || '—'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

export async function openDetails(p) {
    const content = document.getElementById('panel-content');
    const panel = document.getElementById('details-panel');
    const mainLayout = document.getElementById('main-layout');

    if (!movesCache) {
        const res = await fetch('moves_data.json');
        movesCache = await res.json();
    }
    p.movimientos = movesCache[p.id] || { nivel: [], mt: [], huevo: [] };

    const weight = p.física?.peso || 0;
    const gkPower = getGrassKnotPower(weight);

    const getTableHTML = (level) => {
        const labels = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
        return Object.entries(p.stats_base).map(([key, base]) => {
            const mMinus = calcStat(base, key, level, 0, 0, key === 'hp' ? 1 : 0.9);
            const min = calcStat(base, key, level, 31, 0, 1);
            const max = calcStat(base, key, level, 31, 252, 1);
            const mPlus = calcStat(base, key, level, 31, 252, key === 'hp' ? 1 : 1.1);
            return `
                <tr class="border-b border-white/5 text-[11px] font-mono">
                    <td class="text-left py-1 text-gray-500 font-bold uppercase">${labels[key]}</td>
                    <td class="text-blue-400 text-center">${mMinus}</td>
                    <td class="text-gray-400 text-center">${min}</td>
                    <td class="text-gray-400 text-center">${max}</td>
                    <td class="text-red-400 font-bold text-center">${mPlus}</td>
                </tr>`;
        }).join('');
    };

    content.innerHTML = `
        <div class="p-6">
            <div class="flex flex-col sm:flex-row gap-6 mb-6 bg-gray-800/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                
                <div class="w-full sm:w-1/2 relative z-10">
                    <div class="sprite-detail-wrapper mb-4 drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex justify-center">
                        <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated h-48" alt="${p.nombreFinal}">
                    </div>
                    <div class="space-y-1 bg-black/20 p-3 rounded-xl">
                        ${Object.entries(p.stats_base).map(([s, val]) => `
                            <div class="flex items-center gap-2">
                                <span class="w-7 text-[8px] font-black uppercase text-gray-500">${s}</span>
                                <div class="flex-1 bg-gray-900 h-1 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500/80" style="width: ${Math.min(val/1.8, 100)}%"></div>
                                </div>
                                <span class="w-6 text-right font-mono text-[9px] text-gray-400">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1 flex flex-col justify-center space-y-4 relative z-10">
                    <div>
                        <h2 class="text-4xl font-black uppercase text-white leading-none">${p.nombreFinal}</h2>
                        <p class="text-yellow-500 font-bold text-xs mt-1 uppercase tracking-widest">#${String(p.numero).padStart(3, '0')} - ${p.genLabel}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase">
                        <div class="bg-black/30 p-2 rounded-lg"><span class="text-gray-500 block text-[8px]">Altura</span>${p.física?.altura} m</div>
                        <div class="bg-black/30 p-2 rounded-lg"><span class="text-gray-500 block text-[8px]">Peso</span>${p.física?.peso} kg</div>
                        <div class="bg-black/30 p-2 rounded-lg col-span-2 border border-green-500/20 text-green-400">
                            <span class="text-gray-500 block text-[8px]">Daño Hierba Lazo</span>${gkPower} Poder
                        </div>
                    </div>

                    <div class="flex gap-1 flex-wrap">
                        ${p.tipos.map(t => `<span class="px-3 py-1 rounded-full text-[9px] font-black uppercase text-white" style="background-color: ${TYPE_MAP[t.toUpperCase()]?.color}">${TYPE_MAP[t.toUpperCase()]?.esp}</span>`).join('')}
                    </div>

                    <div class="space-y-1 pt-2 border-t border-white/5">
                        <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Habilidades</span>
                        <div class="text-[11px] text-gray-200 font-bold">${p.habilidades.map(h => ABILITY_MAP[h] || h).join(' / ')}</div>
                        ${p.habilidad_oculta.length ? `<div class="text-[10px] text-yellow-600 italic">Oculta: ${p.habilidad_oculta.map(h => ABILITY_MAP[h] || h).join(', ')}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="bg-gray-800/30 p-5 rounded-3xl border border-white/5 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-black uppercase text-gray-400 text-xs tracking-widest">Calculadora de Stats</h3>
                    <div class="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <span class="text-[9px] font-black text-gray-500 uppercase">Nivel</span>
                        <input type="number" id="calc-level" value="100" min="1" max="100" class="w-10 bg-transparent border-none text-white font-mono text-sm p-0 text-center">
                    </div>
                </div>
                <table class="w-full">
                    <thead>
                        <tr class="text-[8px] text-gray-500 uppercase font-black">
                            <th class="text-left pb-2">Stat</th>
                            <th class="pb-2">Min-</th>
                            <th class="pb-2">Min</th>
                            <th class="pb-2">Max</th>
                            <th class="pb-2">Max+</th>
                        </tr>
                    </thead>
                    <tbody id="calc-body">
                        ${getTableHTML(100)}
                    </tbody>
                </table>
            </div>

            <div class="bg-gray-800/30 rounded-3xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20" id="moves-tabs">
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-yellow-500 border-b-2 border-yellow-500" data-tab="nivel">Nivel</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="mt">MT/Tutor</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${renderMovesList(p, 'nivel')}
                </div>
            </div>
        </div>
    `;

    // --- LISTENERS ---
    document.getElementById('calc-level').addEventListener('input', (e) => {
        const lvl = parseInt(e.target.value) || 1;
        document.getElementById('calc-body').innerHTML = getTableHTML(lvl);
    });

    content.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            content.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('text-yellow-500', 'border-yellow-500');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            btn.classList.add('text-yellow-500', 'border-yellow-500');
            btn.classList.remove('text-gray-500', 'border-transparent');
            document.getElementById('moves-container').innerHTML = renderMovesList(p, btn.dataset.tab);
        });
    });

    panel.classList.add('open');
    if (window.innerWidth >= 1024) mainLayout.style.marginRight = "40%";
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('main-layout').style.marginRight = "0";
    document.body.style.overflow = 'auto';
}