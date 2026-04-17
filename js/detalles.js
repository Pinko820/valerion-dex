import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

let movesCache = null;

const calcStat = (base, statName, level, iv, ev, nature) => {
    if (statName === 'hp') {
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    }
    return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
};

// Función para iconos de categoría (Physical, Special, Status)
function getCategoryIcon(cat) {
    const categories = {
        'Physical': { color: 'bg-orange-600', label: 'FIS' },
        'Special': { color: 'bg-blue-600', label: 'ESP' },
        'Status': { color: 'bg-gray-500', label: 'EST' }
    };
    const info = categories[cat] || categories['Status'];
    return `<span class="text-[7px] px-1 py-0.5 rounded ${info.color} text-white font-black uppercase">${info.label}</span>`;
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

    // Función para renderizar filas de la calculadora
    const renderCalcRows = (level = 100) => {
        const statsKeys = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
        return Object.entries(p.stats_base).map(([key, base]) => {
            const minMinus = calcStat(base, key, level, 0, 0, key === 'hp' ? 1 : 0.9);
            const min = calcStat(base, key, level, 31, 0, 1);
            const max = calcStat(base, key, level, 31, 252, 1);
            const maxPlus = calcStat(base, key, level, 31, 252, key === 'hp' ? 1 : 1.1);
            return `
                <tr class="border-b border-white/5">
                    <td class="text-left font-bold text-gray-400">${statsKeys[key]}</td>
                    <td class="text-blue-400">${minMinus}</td>
                    <td class="text-gray-300">${min}</td>
                    <td class="text-gray-300">${max}</td>
                    <td class="text-red-400">${maxPlus}</td>
                </tr>`;
        }).join('');
    };

    content.innerHTML = `
        <div class="p-6 text-sm">
            <div class="flex flex-col md:flex-row gap-6 mb-8 bg-gray-800/40 p-6 rounded-3xl border border-white/5">
                <div class="w-full md:w-1/2">
                    <div class="sprite-detail-wrapper drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                        <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated w-full h-auto" alt="${p.nombreFinal}">
                    </div>
                    <div class="mt-4 space-y-1">
                        ${Object.entries(p.stats_base).map(([s, val]) => `
                            <div class="flex items-center gap-2">
                                <span class="w-8 text-[8px] font-black uppercase text-gray-500">${s}</span>
                                <div class="flex-1 bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500" style="width: ${Math.min(val/2, 100)}%"></div>
                                </div>
                                <span class="w-6 text-right font-mono text-[10px]">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1 space-y-4">
                    <div>
                        <h2 class="text-3xl font-black uppercase leading-none">${p.nombreFinal}</h2>
                        <p class="text-yellow-500 font-mono">#${String(p.numero).padStart(3, '0')}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="bg-black/20 p-2 rounded-lg"><span class="text-gray-500 block">ALTURA</span>${p.física?.altura} m</div>
                        <div class="bg-black/20 p-2 rounded-lg"><span class="text-gray-500 block">PESO</span>${p.física?.peso} kg</div>
                        <div class="bg-black/20 p-2 rounded-lg col-span-2"><span class="text-gray-500 block">DAÑO HIERBA LAZO</span>${gkPower} Poder</div>
                    </div>

                    <div class="flex gap-2">
                        ${p.tipos.map(t => `<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase" style="background-color: ${TYPE_MAP[t.toUpperCase()]?.color}">${TYPE_MAP[t.toUpperCase()]?.esp}</span>`).join('')}
                    </div>

                    <div class="space-y-1">
                        <span class="text-[10px] font-black text-gray-500 uppercase">Habilidades</span>
                        <div class="text-xs text-gray-200">${p.habilidades.map(h => ABILITY_MAP[h] || h).join(' / ')}</div>
                        ${p.habilidad_oculta.length ? `<div class="text-[11px] text-yellow-600 italic">Oculta: ${p.habilidad_oculta.map(h => ABILITY_MAP[h] || h).join(', ')}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="bg-gray-800/30 p-4 rounded-2xl border border-white/5 mb-8">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-black uppercase text-gray-400">Calculadora de Stats</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-gray-500">NIVEL</span>
                        <input type="number" id="calc-level" value="100" min="1" max="100" class="w-12 bg-gray-900 border-none rounded text-center text-xs p-1 focus:ring-1 focus:ring-yellow-500">
                    </div>
                </div>
                <table class="w-full stats-calc-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th title="0 IVs, 0 EVs, Naturaleza desfavorable">Min-</th>
                            <th title="31 IVs, 0 EVs, Naturaleza neutra">Min</th>
                            <th title="31 IVs, 252 EVs, Naturaleza neutra">Max</th>
                            <th title="31 IVs, 252 EVs, Naturaleza favorable">Max+</th>
                        </tr>
                    </thead>
                    <tbody id="calc-body">
                        ${renderCalcRows(100)}
                    </tbody>
                </table>
            </div>

            <div class="bg-gray-800/30 rounded-2xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20" id="moves-tabs">
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-yellow-500 border-b-2 border-yellow-500" data-tab="nivel">Nivel</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="mt">MT/Tutor</button>
                    <button class="flex-1 py-3 text-[9px] font-black uppercase text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[300px] overflow-y-auto"></div>
            </div>
        </div>
    `;

    // Eventos para la calculadora
    document.getElementById('calc-level').addEventListener('input', (e) => {
        const lvl = parseInt(e.target.value) || 1;
        document.getElementById('calc-body').innerHTML = renderCalcRows(lvl);
    });

    panel.classList.add('open');
    if (window.innerWidth >= 1024) {
        mainLayout.style.marginRight = "40%";
    }
}

function renderMovesList(p, categoria) {
    const moves = p.movimientos[categoria] || [];
    if (moves.length === 0) return `<div class="p-8 text-center text-[10px] text-gray-600 uppercase italic">Sin datos</div>`;

    return `
        <table class="w-full text-left border-separate border-spacing-y-1">
            <tbody class="text-[10px] font-mono">
                ${moves.map(m => `
                    <tr class="bg-white/5 hover:bg-white/10 transition-colors">
                        <td class="py-2 px-2 text-yellow-500/70 font-bold rounded-l-lg">${m.nivel || '—'}</td>
                        <td class="py-2 px-1">
                            <div class="flex flex-col">
                                <span class="text-gray-200 font-bold uppercase leading-none">${m.nombre.replace(/_/g, ' ')}</span>
                                <div class="flex items-center gap-1 mt-1">
                                    <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${TYPE_MAP[m.tipo?.toUpperCase()]?.color || '#555'}"></div>
                                    ${getCategoryIcon(m.cat)}
                                </div>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-right text-gray-400 rounded-r-lg">
                            <span class="text-[8px] text-gray-600">P</span> ${m.pot || '—'}<br>
                            <span class="text-[8px] text-gray-600">A</span> ${m.pre || '—'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('main-layout').style.marginRight = "0";
    document.body.style.overflow = 'auto';
}