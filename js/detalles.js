import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';
import { getGenLabel } from './ui-utils.js';

// Ayuda para traducir tipos y habilidades
const translateType = (id) => TYPE_MAP[id.toUpperCase()] || { esp: id, color: '#777' };
const translateAbility = (id) => ABILITY_MAP[id.toUpperCase()] || id;


export function openDetails(p) {
    const content = document.getElementById('panel-content');
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('panel-overlay');
    const mainLayout = document.getElementById('main-layout');

    if (!content || !panel) return;

    // --- Lógica de Barras de Stats ---
    const getStatBar = (val, colorClass) => {
        const percent = Math.min((val / 200) * 100, 100); // 200 es el tope visual
        return `
            <div class="flex items-center gap-2 mb-1">
                <span class="w-8 text-[10px] font-bold text-gray-400 uppercase">${Object.keys(p.stats_base).find(k => p.stats_base[k] === val)}</span>
                <div class="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div class="h-full ${colorClass} rounded-full" style="width: ${percent}%"></div>
                </div>
                <span class="w-8 text-right text-xs font-mono font-bold">${val}</span>
            </div>
        `;
    };

    // --- Construcción del HTML ---
    content.innerHTML = `
        <div class="p-6">
            <div class="relative bg-gray-800/50 rounded-3xl p-6 mb-6 border border-white/5 overflow-hidden">
                <div class="absolute -top-4 -right-4 text-8xl font-black text-white/5 italic">#${String(p.numero).padStart(3, '0')}</div>
                <div class="sprite-detail-wrapper mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated" alt="${p.nombreFinal}">
                </div>
                <div class="text-center relative z-10">
                    <p class="text-yellow-500 font-black text-xs uppercase tracking-widest mb-1">${p.genLabel}</p>
                    <h2 class="text-4xl font-black uppercase text-white leading-none mb-4">${p.nombreFinal}</h2>
                    <div class="flex justify-center gap-2">
                        ${p.tipos.map(t => {
                            const info = translateType(t);
                            return `<span class="px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-lg" style="background-color: ${info.color}">${info.esp}</span>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 mb-6">
                <div class="bg-gray-800/30 p-4 rounded-2xl border border-white/5">
                    <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Estadísticas Base</h3>
                    ${getStatBar(p.stats_base.hp, 'bg-green-500')}
                    ${getStatBar(p.stats_base.atq, 'bg-red-500')}
                    ${getStatBar(p.stats_base.def, 'bg-blue-500')}
                    ${getStatBar(p.stats_base.spa, 'bg-orange-500')}
                    ${getStatBar(p.stats_base.spd, 'bg-purple-500')}
                    ${getStatBar(p.stats_base.vel, 'bg-pink-500')}
                    <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-yellow-500 font-black">
                        <span class="text-[10px] uppercase">Total Stats (BST)</span>
                        <span class="font-mono text-lg">${p.bst}</span>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex-1 bg-gray-800/30 p-4 rounded-2xl border border-white/5 text-center">
                        <span class="block text-[9px] text-gray-500 font-bold uppercase mb-1">Altura</span>
                        <span class="text-lg font-mono font-bold">${p.física?.altura || '??'} m</span>
                    </div>
                    <div class="flex-1 bg-gray-800/30 p-4 rounded-2xl border border-white/5 text-center">
                        <span class="block text-[9px] text-gray-500 font-bold uppercase mb-1">Peso</span>
                        <span class="text-lg font-mono font-bold">${p.física?.peso || '??'} kg</span>
                    </div>
                </div>
            </div>

            <div class="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/20 mb-6 italic text-gray-300 text-sm leading-relaxed">
                "${p.descripcion || 'No hay datos registrados sobre esta especie en la región de Valerion.'}"
            </div>

            <div class="bg-gray-800/30 rounded-2xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20">
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase tracking-tighter border-b-2 border-yellow-500 text-yellow-500" data-tab="nivel">Nivel</button>
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase tracking-tighter border-transparent text-gray-500" data-tab="mt">MT/MO</button>
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase tracking-tighter border-transparent text-gray-500" data-tab="huevo">Huevo</button>
                    <button class="tab-btn flex-1 py-3 text-[9px] font-black uppercase tracking-tighter border-transparent text-gray-500" data-tab="tutor">Tutor</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    ${renderMovesList(p, 'nivel')}
                </div>
            </div>
        </div>
    `;

    // Lógica de Tabs
    const buttons = content.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.replace('text-yellow-500', 'text-gray-500');
                b.classList.replace('border-yellow-500', 'border-transparent');
            });
            btn.classList.replace('text-gray-500', 'text-yellow-500');
            btn.classList.replace('border-transparent', 'border-yellow-500');
            document.getElementById('moves-container').innerHTML = renderMovesList(p, btn.dataset.tab);
        });
    });

    panel.classList.add('open');

    if (window.innerWidth >= 1024) {
        mainLayout.style.marginRight = "450px"; 
        overlay.classList.remove('show');
    } else {
        mainLayout.style.marginRight = "0";
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; 
    }
}

// Función auxiliar para renderizar la lista de movimientos
function renderMovesList(p, categoria) {
    const moves = p.movimientos?.[categoria];
    
    if (!moves || moves.length === 0) {
        return `<div class="p-8 text-center text-xs text-gray-600 font-bold uppercase italic">Sin datos de movimientos por ${categoria}</div>`;
    }

    return `
        <table class="w-full text-left">
            <thead class="text-[8px] uppercase text-gray-600 border-b border-white/5">
                <tr>
                    <th class="py-2 px-1">${categoria === 'nivel' ? 'Nvl' : 'Obt'}</th>
                    <th class="py-2 px-1">Movimiento</th>
                    <th class="py-2 px-1 text-center">Tipo</th>
                    <th class="py-2 px-1 text-right">Pot / Pre</th>
                </tr>
            </thead>
            <tbody class="text-[11px] font-mono">
                ${moves.map(m => {
                    const infoTipo = TYPE_MAP[m.tipo?.toUpperCase()] || { color: '#444' };
                    return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="py-2 px-1 font-bold text-yellow-500/70">${m.nivel || '—'}</td>
                        <td class="py-2 px-1 text-white font-bold uppercase truncate max-w-[100px]">${m.nombre}</td>
                        <td class="py-2 px-1">
                            <div class="w-3 h-3 rounded-full mx-auto" style="background-color: ${infoTipo.color}" title="${m.tipo}"></div>
                        </td>
                        <td class="py-2 px-1 text-right text-gray-400">
                            ${m.pot || '—'} <span class="text-gray-600">/</span> ${m.pre || '—'}
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

export function closeDetails() {
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('panel-overlay');
    const mainLayout = document.getElementById('main-layout');

    panel.classList.remove('open');
    overlay.classList.remove('show');
    mainLayout.style.marginRight = "0";
    document.body.style.overflow = 'auto';
}