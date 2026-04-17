import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

let movesCache = null;

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

    if (!content || !panel) return;

    // 1. CARGAR MOVIMIENTOS SI NO ESTÁN EN CACHE
    if (!movesCache) {
        try {
            const res = await fetch('moves_data.json');
            movesCache = await res.json();
        } catch (e) {
            console.error("Error cargando moves_data.json:", e);
            movesCache = {};
        }
    }

    p.movimientos = movesCache[p.id] || { nivel: [], mt: [], huevo: [], tutor: [] };

    // --- Lógica de Barras de Stats ---
    const getStatBar = (val, label, colorClass) => {
        const percent = Math.min((val / 200) * 100, 100);
        return `
            <div class="flex items-center gap-2 mb-1">
                <span class="w-8 text-[9px] font-black text-gray-500 uppercase">${label}</span>
                <div class="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full ${colorClass} rounded-full" style="width: ${percent}%"></div>
                </div>
                <span class="w-8 text-right text-xs font-mono font-bold text-gray-300">${val}</span>
            </div>
        `;
    };

    // 2. RENDERIZAR TODO EL CONTENIDO
    content.innerHTML = `
        <div class="p-6">
            <div class="relative bg-gray-800/50 rounded-3xl p-6 mb-6 border border-white/5 overflow-hidden text-center">
                <div class="absolute -top-4 -right-4 text-8xl font-black text-white/5 italic">#${String(p.numero).padStart(3, '0')}</div>
                <div class="sprite-detail-wrapper mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex justify-center">
                    <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated h-44" alt="${p.nombreFinal}">
                </div>
                <h2 class="text-4xl font-black uppercase text-white leading-none mb-3">${p.nombreFinal}</h2>
                <div class="flex justify-center gap-2">
                    ${p.tipos.map(t => {
                        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#777' };
                        return `<span class="px-4 py-1 rounded-full text-[10px] font-black uppercase" style="background-color: ${info.color}">${info.esp}</span>`;
                    }).join('')}
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 mb-6">
                <div class="bg-gray-800/30 p-4 rounded-2xl border border-white/5">
                    <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Estadísticas Base</h3>
                    ${getStatBar(p.stats_base.hp, 'hp', 'bg-green-500')}
                    ${getStatBar(p.stats_base.atq, 'atk', 'bg-red-500')}
                    ${getStatBar(p.stats_base.def, 'def', 'bg-blue-500')}
                    ${getStatBar(p.stats_base.spa, 'spa', 'bg-orange-500')}
                    ${getStatBar(p.stats_base.spd, 'spd', 'bg-purple-500')}
                    ${getStatBar(p.stats_base.vel, 'vel', 'bg-pink-500')}
                    <div class="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-yellow-500 font-black">
                        <span class="text-[9px] uppercase">Total (BST)</span>
                        <span class="font-mono text-base">${p.bst}</span>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex-1 bg-gray-800/30 p-3 rounded-2xl border border-white/5 text-center">
                        <span class="block text-[8px] text-gray-500 font-black uppercase">Altura</span>
                        <span class="text-sm font-bold text-gray-200">${p.física?.altura || '??'} m</span>
                    </div>
                    <div class="flex-1 bg-gray-800/30 p-3 rounded-2xl border border-white/5 text-center">
                        <span class="block text-[8px] text-gray-500 font-black uppercase">Peso</span>
                        <span class="text-sm font-bold text-gray-200">${p.física?.peso || '??'} kg</span>
                    </div>
                </div>
            </div>

            <div class="bg-gray-800/30 rounded-2xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20">
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase border-b-2 border-yellow-500 text-yellow-500" data-tab="nivel">Nivel</button>
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase border-transparent text-gray-500" data-tab="mt">MT/Tutor</button>
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase border-transparent text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${renderMovesList(p, 'nivel')}
                </div>
            </div>
        </div>
    `;

    // Lógica de cambio de pestañas
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
    if (window.innerWidth >= 1024) mainLayout.style.marginRight = "450px";
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