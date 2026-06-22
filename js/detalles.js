import { CONFIG, TYPE_MAP, ABILITY_MAP } from './config.js';

// OPTIMIZACIÓN: moves_data se precarga en background al inicio
export let movesCache = null;
let movesPromise = null;

// Cache de datos canónicos de PokéAPI para no repetir fetch
const pokeApiCache = {};

export async function preloadMoves() {
    if (movesPromise) return movesPromise;
    
    movesPromise = Promise.all([
        fetch('pokemon_learnsets.json').then(r => r.json()),
        fetch('moves_dictionary.json').then(r => r.json())
    ]).then(([learnsets, dictionary]) => {
        movesCache = { learnsets, dictionary };
        return movesCache;
    }).catch(err => {
        console.error("Error cargando archivos:", err);
        movesCache = { learnsets: {}, dictionary: {} };
        return movesCache;
    });
    
    return movesPromise;
}

// ─── PokéAPI helpers ────────────────────────────────────────────────────────

/**
 * Convierte el ID interno del fangame al slug de PokéAPI.
 * Ejemplos:
 *   BULBASAUR      → bulbasaur
 *   VENUSAUR_1     → venusaur-mega      (Mega)
 *   CHARIZARD_3    → null               (forma solo Valerion)
 *   PIKACHU_ALOLA  → pikachu-alola
 */
function idToPokeApiSlug(id, formName) {
    const base = id.split('_')[0].toLowerCase();
    if (!formName) return base;

    const fn = formName.toLowerCase();

    // CASO ESPECIAL PARA CHARIZARD: Él sí necesita el sufijo -x o -y en la PokéAPI
    if (base === 'charizard' && fn.includes('mega')) {
        if (fn.includes('x')) return 'charizard-mega-x';
        if (fn.includes('y')) return 'charizard-mega-y';

        return 'charizard'; //Regreso charizard normal para la mega Z
    }

    // CASO ESPECIAL PARA Venusaur X: PokéAPI no tiene "venusaur-mega-x", entonces llamo a venusaur normal para que al menos tenga datos para comparar"
    if (base === 'venusaur' && fn.includes('mega')) {
        if (fn.includes('x')) return 'venusaur';
    }

    // CASO ESPECIAL PARA Blastoise X: PokéAPI no tiene "blastoise-mega-x", entonces llamo a blastoise normal para que al menos tenga datos para comparar"
    if (base === 'blastoise' && fn.includes('mega')) {
        if (fn.includes('x')) return 'blastoise';
    }


    // Formas conocidas
    if (fn.includes('mega x'))  return `${base}-mega-x`;
    if (fn.includes('mega y'))  return `${base}-mega-y`;
    if (fn.includes('mega'))    return `${base}-mega`;
    if (fn.includes('alola'))   return `${base}-alola`;
    if (fn.includes('galar'))   return `${base}-galar`;
    if (fn.includes('hisui'))   return `${base}-hisui`;
    if (fn.includes('paldea'))  return `${base}-paldea`;
    if (fn.includes('gmax') || fn.includes('gigamax')) return `${base}-gmax`;
    // Si no reconocemos la forma, es exclusiva del fangame → sin datos canónicos
    return null;
}

async function fetchCanonicalData(pokemon) {
    // Pokémon con número > 1030 o gen 124 sin forma conocida son Valerion-only
    if (pokemon.generacion === 124 && !pokemon.es_forma) return null;

    const slug = idToPokeApiSlug(pokemon.id, pokemon.form_name);
    if (!slug) return null;

    if (pokeApiCache[slug] !== undefined) return pokeApiCache[slug];

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const statOrder = ['hp','attack','defense','special-attack','special-defense','speed'];
        const statKeys  = ['hp','atq','def','spa','spd','vel'];

        const stats = {};
        statOrder.forEach((apiKey, i) => {
            const found = data.stats.find(s => s.stat.name === apiKey);
            if (found) stats[statKeys[i]] = found.base_stat;
        });

        const types    = data.types.map(t => t.type.name.toUpperCase());
        const abilities = data.abilities
            .filter(a => !a.is_hidden)
            .map(a => a.ability.name.toUpperCase().replace(/-/g,''));
        const hiddenAbility = data.abilities
            .filter(a => a.is_hidden)
            .map(a => a.ability.name.toUpperCase().replace(/-/g,''));

        const result = { stats, types, abilities, hiddenAbility };
        pokeApiCache[slug] = result;
        return result;
    } catch (e) {
        console.warn(`PokéAPI error for ${slug}:`, e.message);
        pokeApiCache[slug] = null;
        return null;
    }
}

// ─── Helpers de diferencias ─────────────────────────────────────────────────

function statDiff(valerionVal, canonVal) {
    if (canonVal === undefined || canonVal === null) return null;
    return valerionVal - canonVal;
}

function diffClass(diff) {
    if (diff === null) return '';
    if (diff > 0)  return 'stat-buffed';
    if (diff < 0)  return 'stat-nerfed';
    return 'stat-same';
}

function diffArrow(diff) {
    if (diff === null) return '';
    if (diff > 0) return `<span class="diff-arrow up">▲${diff}</span>`;
    if (diff < 0) return `<span class="diff-arrow down">▼${Math.abs(diff)}</span>`;
    return '';
}

// ─── Funciones de apoyo ─────────────────────────────────────────────────────

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
                <div class="flex items-center gap-3 p-2.5 bg-gray-800/20 hover:bg-white/5 rounded-xl border border-white/5 transition-all group">
                    <div class="w-10 text-center font-mono font-bold text-yellow-500/80 text-sm">
                        ${m.nivel || '—'}
                    </div>

                    <div class="flex-1 flex flex-col justify-center min-w-0">
                        <span class="text-gray-100 font-bold uppercase text-sm truncate leading-tight group-hover:text-white">
                            ${moveInfo.nombre_es.replace(/_/g, ' ')}
                        </span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" 
                                  style="background-color:${TYPE_MAP[moveInfo.tipo?.toUpperCase()]?.color || '#555'}">
                                ${TYPE_MAP[moveInfo.tipo?.toUpperCase()]?.esp || moveInfo.tipo}
                            </span>
                            ${getCategoryIcon(moveInfo.cat)}
                        </div>
                    </div>

                    <div class="flex flex-col items-end gap-0.5 text-xs font-mono text-gray-400">
                        <span class="leading-none"><span class="text-gray-600">P:</span> ${moveInfo.pot || '—'}</span>
                        <span class="leading-none"><span class="text-gray-600">A:</span> ${moveInfo.pre || '—'}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

// ─── Render de stats con diffs ───────────────────────────────────────────────

function renderStatBars(statsValerion, canonStats) {
    const labels = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };

    return Object.entries(statsValerion).map(([s, val]) => {
        const cVal = canonStats?.[s];
        const diff = statDiff(val, cVal);
        const cls  = diffClass(diff);

        // Indicador de diff: flecha + valor original + diferencia, en línea debajo del stat
        let diffBadge = '';
        if (diff !== null && diff !== 0) {
            const sign   = diff > 0 ? '+' : '';
            const color  = diff > 0 ? '#4ade80' : '#f87171';
            const arrow  = diff > 0 ? '▲' : '▼';
            diffBadge = `<span style="color:${color};font-size:9px;font-weight:900;white-space:nowrap;">
                ${arrow}${sign}${diff} <span style="color:#6b7280;">(${cVal})</span>
            </span>`;
        }

        return `
            <div class="flex items-center gap-2">
                <span class="w-8 text-[10px] font-black uppercase text-gray-500 flex-shrink-0">${labels[s] || s}</span>
                <div class="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden">
                    <div class="h-full rounded-full stat-bar ${cls}" style="width:${Math.min(val / 1.8, 100)}%"></div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0" style="min-width:60px;justify-content:flex-end;">
                    <span class="font-mono text-xs font-bold ${cls || 'text-gray-300'}">${val}</span>
                    ${diffBadge}
                </div>
            </div>`;
    }).join('');
}

function renderTypes(valerionTypes, canonTypes) {
    return valerionTypes.map(t => {
        const isNew = canonTypes && !canonTypes.includes(t.toUpperCase());
        return `<span class="px-3 py-1 rounded-full text-xs font-black uppercase text-white type-badge ${isNew ? 'type-changed' : ''}" 
                      style="background-color:${TYPE_MAP[t.toUpperCase()]?.color}"
                      title="${isNew ? '✦ Cambiado en Valerion' : ''}">
                    ${TYPE_MAP[t.toUpperCase()]?.esp}${isNew ? ' ✦' : ''}
                </span>`;
    }).join('');
}

function renderAbilities(valerionAbs, hiddenAbs, canonAbs, canonHidden, isSingleAbilityForm) {
    // Las formas con habilidad única (Mega, Primal, etc.) no tienen oculta — solo muestran la innata
    const absHtml = valerionAbs.map(h => {
        const isNew = canonAbs && !canonAbs.includes(h);
        const label = ABILITY_MAP[h] || h;
        return `<span class="ability-badge ${isNew ? 'ability-changed' : ''}" title="${isNew ? '✦ Cambiada en Valerion' : ''}">${label}${isNew ? ' ✦' : ''}</span>`;
    }).join(' / ');

    // Si es forma con habilidad única (mega, primal, etc.) no mostramos oculta aunque esté en los datos
    const showHidden = !isSingleAbilityForm && hiddenAbs.length > 0;
    const hiddenHtml = showHidden
        ? `<div class="text-xs text-yellow-600 italic mt-0.5">↳ ${hiddenAbs.map(h => {
                const isNew = canonHidden && !canonHidden.includes(h);
                const label = ABILITY_MAP[h] || h;
                return `<span class="ability-badge-hidden ${isNew ? 'ability-changed' : ''}">${label}${isNew ? ' ✦' : ''}</span>`;
            }).join(', ')}</div>`
        : '';

    return `<div class="text-sm text-gray-200 font-bold">${absHtml}</div>${hiddenHtml}`;
}

// ─── Render de tabla de stats con canon ─────────────────────────────────────

function renderCalcTable(statsValerion, level) {
    const labels = { hp: 'PS', atq: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
    return Object.entries(statsValerion).map(([key, base]) => {
        const mMinus = calcStat(base, key, level, 0,  0,   key === 'hp' ? 1 : 0.9);
        const min    = calcStat(base, key, level, 31, 0,   1);
        const max    = calcStat(base, key, level, 31, 252, 1);
        const mPlus  = calcStat(base, key, level, 31, 252, key === 'hp' ? 1 : 1.1);
        return `
            <tr class="border-b border-white/5 text-xs font-mono">
                <td class="text-left py-1 text-gray-500 font-bold uppercase">${labels[key]}</td>
                <td class="text-blue-400 text-center py-1">${mMinus}</td>
                <td class="text-gray-400 text-center py-1">${min}</td>
                <td class="text-gray-400 text-center py-1">${max}</td>
                <td class="text-red-400 font-bold text-center py-1">${mPlus}</td>
            </tr>`;
    }).join('');
}

// ─── Badge de leyenda ────────────────────────────────────────────────────────

function legendBadge(hasChanges) {
    if (!hasChanges) return '';
    return `
        <div class="legend-badge">
            <span class="legend-item space"> ㅤㅤ      </span>
            <span class="legend-item buffed">▲ Buff</span>
            <span class="legend-item nerfed">▼ Nerf</span>
            <span class="legend-item changed">✦ Cambiado</span>
            <span class="legend-sep">vs. PokéAPI</span>
        </div>`;
}

// ─── openDetails principal ───────────────────────────────────────────────────

export async function openDetails(p) {
    const content    = document.getElementById('panel-content');
    const panel      = document.getElementById('details-panel');
    const mainLayout = document.getElementById('main-layout');

    // Mostrar loading
    content.innerHTML = `<div class="flex items-center justify-center h-40 text-gray-500 text-sm">Cargando...</div>`;
    panel.classList.add('open');
    if (window.innerWidth >= 1024) {
        mainLayout.style.marginRight = "50%";
        const pokedexEl = document.getElementById('pokedex');
        pokedexEl.removeAttribute('style'); // limpia cualquier inline style anterior
        pokedexEl.setAttribute('data-panel-open', 'true');
    }

    if (!movesCache) await preloadMoves();
    p.movimientos = movesCache.learnsets[p.id.toUpperCase()] || { nivel: [], mt: [], huevo: [] };

    // Fetch PokéAPI en paralelo
    const canonData = await fetchCanonicalData(p);

    const weight    = p.física?.peso || 0;
    const gkPower   = getGrassKnotPower(weight);
    const spritePath = `${CONFIG.SPRITE_PATH}${p.id}.webp`;

    // Detectar si hay cambios para mostrar leyenda
    let hasChanges = false;
    if (canonData) {
        const statsChanged = Object.entries(p.stats_base).some(([k, v]) => canonData.stats[k] !== v);
        const typesChanged = p.tipos.some(t => !canonData.types.includes(t.toUpperCase())) ||
                             canonData.types.some(t => !p.tipos.includes(t));
        const absChanged   = p.habilidades.some(h => !canonData.abilities.includes(h));
        hasChanges = statsChanged || typesChanged || absChanged;
    }

    // Formas con una sola habilidad innata (Mega, Primal, Ultra, etc.) no tienen oculta
    const isSingleAbilityForm = p.es_forma && (
        (p.form_name || '').toLowerCase().includes('mega') ||
        (p.form_name || '').toLowerCase().includes('primal') ||
        (p.form_name || '').toLowerCase().includes('ultra') ||
        (p.form_name || '').toLowerCase().includes('eternamax') ||
        p.habilidades.length === 1
    );

    content.innerHTML = `
        <div class="p-4">
            ${canonData ? legendBadge(hasChanges) : ''}

            <!-- Cabecera: sprite + info principal -->
            <div class="flex flex-row gap-3 mb-3 bg-gray-800/40 p-3 rounded-2xl border border-white/5">

                <!-- Columna izquierda: sprite -->
                <div class="flex flex-col items-center flex-shrink-0 gap-2">
                    <div class="sprite-detail-frame"
                         data-sprite="${spritePath}"
                         style="width:160px;height:160px;image-rendering:pixelated;background-image:url('${spritePath}');background-repeat:no-repeat;background-position:0 0;background-size:auto 160px;border-radius:0.75rem;">
                    </div>
                    <!-- Altura / Peso / Lazo en fila compacta debajo del sprite -->
                    <div class="flex gap-1 w-full text-xs font-bold uppercase">
                        <div class="flex-1 bg-black/30 px-1.5 py-1.5 rounded-lg text-center">
                            <span class="text-gray-500 block text-[9px]">Alt</span>
                            <span>${p.física?.altura}m</span>
                        </div>
                        <div class="flex-1 bg-black/30 px-1.5 py-1.5 rounded-lg text-center">
                            <span class="text-gray-500 block text-[9px]">Peso</span>
                            <span>${p.física?.peso}kg</span>
                        </div>
                        <div class="flex-1 bg-black/30 px-1.5 py-1.5 rounded-lg text-center border border-green-500/20 text-green-400">
                            <span class="text-gray-500 block text-[9px]">Lazo</span>
                            <span>${gkPower}pw</span>
                        </div>
                    </div>
                </div>

                <!-- Columna derecha: nombre, tipos, stats, habilidades -->
                <div class="flex-1 flex flex-col min-w-0 gap-2">
                    <div>
                        <h2 class="text-3xl font-black uppercase text-white leading-tight break-words">${p.nombreFinal}</h2>
                        <p class="text-yellow-500 font-bold text-sm mt-0.5 uppercase tracking-widest">#${String(p.numero).padStart(3,'0')} · ${p.genLabel}</p>
                    </div>
                    <div class="flex gap-1.5 flex-wrap">
                        ${renderTypes(p.tipos, canonData?.types)}
                    </div>
                    <!-- Stats bars — ahora en la columna derecha, aprovechan todo el ancho -->
                    <div class="space-y-1.5 bg-black/20 p-2.5 rounded-xl">
                        ${renderStatBars(p.stats_base, canonData?.stats)}
                    </div>
                    <div class="bg-black/20 px-2.5 py-2 rounded-lg">
                        <span class="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Habilidades</span>
                        ${renderAbilities(p.habilidades, p.habilidad_oculta, canonData?.abilities, canonData?.hiddenAbility, isSingleAbilityForm)}
                    </div>
                    ${canonData ? '' : `<div class="text-xs text-gray-600 italic">Sin datos canónicos (Pokémon Valerion)</div>`}
                </div>
            </div>

            <div class="bg-gray-800/30 px-3 py-2 rounded-2xl border border-white/5 mb-3">
                <div class="flex justify-between items-center mb-1">
                    <h3 class="font-black uppercase text-gray-400 text-xs tracking-widest">Calculadora</h3>
                    <div class="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                        <span class="text-[9px] font-black text-gray-500 uppercase">Nv</span>
                        <input type="number" id="calc-level" value="100" min="1" max="100"
                               class="w-10 bg-transparent border-none text-white font-mono text-xs p-0 text-center outline-none">
                    </div>
                </div>
                <table class="w-full">
                    <thead>
                        <tr class="text-[9px] text-gray-600 uppercase font-black">
                            <th class="text-left pb-0.5">Stat</th>
                            <th class="pb-0.5 text-blue-400">Min−</th>
                            <th class="pb-0.5">Min</th>
                            <th class="pb-0.5">Max</th>
                            <th class="pb-0.5 text-red-400">Max+</th>
                        </tr>
                    </thead>
                    <tbody id="calc-body">${renderCalcTable(p.stats_base, 100)}</tbody>
                </table>
            </div>

            <div class="bg-gray-800/30 rounded-3xl border border-white/5 overflow-hidden">
                <div class="flex border-b border-white/5 bg-black/20" id="moves-tabs">
                    <button class="flex-1 py-3 text-xs font-black uppercase text-yellow-500 border-b-2 border-yellow-500 active-tab" data-tab="nivel">Nivel</button>
                    <button class="flex-1 py-3 text-xs font-black uppercase text-gray-500" data-tab="mt">MT/Tutor</button>
                    <button class="flex-1 py-3 text-xs font-black uppercase text-gray-500" data-tab="huevo">Huevo</button>
                </div>
                <div id="moves-container" class="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${renderMovesList(p, 'nivel')}
                </div>
            </div>
        </div>`;

    // Listeners
    document.getElementById('calc-level').addEventListener('input', (e) => {
        const lvl = parseInt(e.target.value) || 1;
        document.getElementById('calc-body').innerHTML = renderCalcTable(p.stats_base, lvl);
    });

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
}

export function closeDetails() {
    document.getElementById('details-panel').classList.remove('open');
    document.getElementById('main-layout').style.marginRight = "0";
    const pokedexEl = document.getElementById('pokedex');
    pokedexEl.removeAttribute('style');
    pokedexEl.removeAttribute('data-panel-open');
    document.body.style.overflow = 'auto';
}
