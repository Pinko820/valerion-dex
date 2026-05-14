import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

// OPTIMIZACIÓN: moves_data se precarga en background al inicio
let movesCache = null;
let movesPromise = null;

export function preloadMoves() {
    if (movesPromise) return movesPromise;
    movesPromise = fetch('moves_data.json')
        .then(r => r.json())
        .then(data => { movesCache = data; })
        .catch(() => { movesCache = {}; });
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

const statBarColor = (val) => {
    if (val <= 30)  return '#ef4444'; // rojo
    if (val <= 69)  return '#f97316'; // naranja
    if (val <= 99) return '#eab308'; // amarillo
    if (val <= 139) return '#84cc16'; // verde lima
    if (val <= 179) return '#38bdf8'; // celeste
    return '#f1f5f9';                 // blanco
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
    if (!moves.length) return `<div class="p-8 text-center text-[10px] text-gray-600 uppercase italic">Sin datos</div>`;

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
                                    <div class="w-1.5 h-1.5 rounded-full" style="background-color:${TYPE_MAP[m.tipo?.toUpperCase()]?.color || '#555'}"></div>
                                    ${getCategoryIcon(m.cat)}
                                </div>
                            </div>
                        </td>
                        <td class="py-2 px-2 text-right text-gray-400">P: ${m.pot || '—'} A: ${m.pre || '—'}</td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

export async function openDetails(p) {
    const content    = document.getElementById('panel-content');
    const panel      = document.getElementById('details-panel');
    const mainLayout = document.getElementById('main-layout');

    // OPTIMIZACIÓN: si el preload no ha terminado aún, esperamos (casi siempre ya está listo)
    if (!movesCache) await preloadMoves();
    p.movimientos = movesCache[p.id] || { nivel: [], mt: [], huevo: [] };

    const weight  = p.física?.peso || 0;
    const gkPower = getGrassKnotPower(weight);
    const spritePath = `${CONFIG.SPRITE_PATH}${p.id}.png`;

    const getTableHTML = (level) => {
        const labels = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
        return Object.entries(p.stats_base).map(([key, base]) => {
            const mMinus = calcStat(base, key, level, 0,  0,   key === 'hp' ? 1 : 0.9);
            const min    = calcStat(base, key, level, 31, 0,   1);
            const max    = calcStat(base, key, level, 31, 252, 1);
            const mPlus  = calcStat(base, key, level, 31, 252, key === 'hp' ? 1 : 1.1);
            return `
                <tr class="border-b border-white/5 text-xs font-mono">
                    <td class="text-left py-1 text-gray-400 font-black uppercase">${labels[key]}</td>
                    <td class="text-blue-400 text-center py-1">${mMinus}</td>
                    <td class="text-gray-400 text-center py-1">${min}</td>
                    <td class="text-gray-400 text-center py-1">${max}</td>
                    <td class="text-red-400 font-bold text-center py-1">${mPlus}</td>
                </tr>`;
        }).join('');
    };

    content.innerHTML = `
        <div class="p-5">
            <div class="flex flex-row gap-4 mb-5 bg-gray-800/40 p-4 rounded-2xl border border-white/5">
                <div class="flex flex-col items-center gap-3 flex-shrink-0">
                    <div class="sprite-detail-frame"
                         data-sprite="${spritePath}"
                         style="width:144px;height:144px;image-rendering:pixelated;background-image:url('${spritePath}');background-repeat:no-repeat;background-position:0 0;background-size:auto 144px;flex-shrink:0;border-radius:0.75rem;">
                    </div>
                    <div class="space-y-1 bg-black/20 p-2.5 rounded-xl w-full">
                        ${Object.entries(p.stats_base).map(([s, val]) => `
                            <div class="flex items-center gap-2">
                                <span class="w-8 text-[10px] font-black uppercase text-gray-400">${s}</span>
                                <div class="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full" style="width:${Math.min(val / 2.0, 100)}%;background:${statBarColor(val)}"></div>
                                </div>
                                <span class="w-7 text-right font-mono text-xs font-bold" style="color:${statBarColor(val)}">${val}</span>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-between min-w-0 gap-2.5">
                    <div>
                        <h2 class="text-2xl font-black uppercase text-white leading-tight break-words">${p.nombreFinal}</h2>
                        <p class="text-yellow-500 font-bold text-xs mt-0.5 uppercase tracking-widest">#${String(p.numero).padStart(3,'0')} · ${p.genLabel}</p>
                    </div>
                    <div class="flex gap-1.5 flex-wrap">
                        ${p.tipos.map(t => `<span class="px-2.5 py-0.5 rounded-full text-xs font-black uppercase text-white" style="background-color:${TYPE_MAP[t.toUpperCase()]?.color}">${TYPE_MAP[t.toUpperCase()]?.esp}</span>`).join('')}
                    </div>
                    <div class="flex gap-1.5 text-xs font-bold uppercase">
                        <div class="flex-1 bg-black/30 px-2 py-1.5 rounded-lg"><span class="text-gray-500 block text-[9px]">Altura</span>${p.física?.altura} m</div>
                        <div class="flex-1 bg-black/30 px-2 py-1.5 rounded-lg"><span class="text-gray-500 block text-[9px]">Peso</span>${p.física?.peso} kg</div>
                        <div class="flex-1 bg-black/30 px-2 py-1.5 rounded-lg border border-green-500/20 text-green-400"><span class="text-gray-500 block text-[9px]">H. Lazo</span>${gkPower} pw</div>
                    </div>
                    <div class="bg-black/20 px-3 py-2 rounded-lg">
                        <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Habilidades</span>
                        <div class="text-xs text-gray-200 font-bold leading-snug">${p.habilidades.map(h => ABILITY_MAP[h] || h).join(' / ')}</div>
                        ${p.habilidad_oculta.length ? `<div class="text-xs text-yellow-500/80 italic mt-0.5">↳ HA: ${p.habilidad_oculta.map(h => ABILITY_MAP[h] || h).join(', ')}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="bg-gray-800/30 px-4 py-3 rounded-2xl border border-white/5 mb-3">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-black uppercase text-gray-400 text-xs tracking-widest">Calculadora de Stats</h3>
                    <div class="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <span class="text-[10px] font-black text-gray-500 uppercase">Nivel</span>
                        <input type="number" id="calc-level" value="100" min="1" max="100"
                               class="w-10 bg-transparent border-none text-white font-mono text-xs p-0 text-center outline-none">
                    </div>
                </div>
                <table class="w-full">
                    <thead>
                        <tr class="text-[10px] text-gray-600 uppercase font-black">
                            <th class="text-left pb-1">Stat</th>
                            <th class="pb-1 text-blue-400 text-center">Min −</th>
                            <th class="pb-1 text-center">Mín</th>
                            <th class="pb-1 text-center">Máx</th>
                            <th class="pb-1 text-red-400 text-center">Max +</th>
                        </tr>
                    </thead>
                    <tbody id="calc-body">${getTableHTML(100)}</tbody>
                </table>
            </div>

            <div class="bg-gray-800/30 rounded-3xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20" id="moves-tabs">
                    <button class="flex-1 py-3 text-xs font-black uppercase text-yellow-500 border-b-2 border-yellow-500 active-tab" data-tab="nivel">Nivel</button>
                    <button class="flex-1 py-3 text-xs font-black uppercase text-gray-500" data-tab="mt">MT / Tutor</button>
                    <button class="flex-1 py-3 text-xs font-black uppercase text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[380px] overflow-y-auto custom-scrollbar">
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
    document.getElementById('panel-overlay').classList.add('show');
    if (window.innerWidth >= 1024) {
        mainLayout.style.marginRight = "40%";
        document.getElementById('pokedex').style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('panel-overlay').classList.remove('show');
    document.getElementById('main-layout').style.marginRight = "0";
    // Forzar 5 columnas explícitamente (sobreescribe el !important del CSS)
    document.getElementById('pokedex').style.gridTemplateColumns = 'repeat(5, 1fr)';
    document.body.style.overflow = 'auto';
}