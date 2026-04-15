// Configuración global
const CONFIG = {
    VALERION_GEN: 124,
    SPRITE_PATH: 'sprites/'
};

let pokemonData = [];

const TYPE_MAP = {
    NORMAL: { esp: 'Normal', color: '#A8A77A' },
    FIRE: { esp: 'Fuego', color: '#EE8130' },
    WATER: { esp: 'Agua', color: '#6390F0' },
    GRASS: { esp: 'Planta', color: '#7AC74C' },
    ELECTRIC: { esp: 'Eléctrico', color: '#F7D02C' },
    ICE: { esp: 'Hielo', color: '#96D9D6' },
    FIGHTING: { esp: 'Lucha', color: '#C22E28' },
    POISON: { esp: 'Veneno', color: '#A33EA1' },
    GROUND: { esp: 'Tierra', color: '#E2BF65' },
    FLYING: { esp: 'Volador', color: '#A98FF3' },
    PSYCHIC: { esp: 'Psíquico', color: '#F95587' },
    BUG: { esp: 'Bicho', color: '#A6B91A' },
    ROCK: { esp: 'Roca', color: '#B6A136' },
    GHOST: { esp: 'Fantasma', color: '#735797' },
    DRAGON: { esp: 'Dragón', color: '#6F35FC' },
    STEEL: { esp: 'Acero', color: '#B7B7CE' },
    FAIRY: { esp: 'Hada', color: '#D685AD' },
    DARK: { esp: 'Siniestro', color: '#705746' }
};

// Helper para normalizar nombres de generación
const getGenLabel = (gen) => {
    if (gen === CONFIG.VALERION_GEN) return "Valerion";
    return typeof gen === 'number' ? `Gen ${gen}` : gen;
};

/**
 * Carga inicial de datos y pre-procesamiento
 */
async function init() {
    try {
        const res = await fetch(`valerion_data.json?v=${new Date().getTime()}`);
        if (!res.ok) throw new Error(`No se pudo cargar el JSON (Error ${res.status})`);
        
        const rawData = await res.json();
        
        // OPTIMIZACIÓN: Pre-procesamos los datos una sola vez
        pokemonData = rawData.map(p => {
            const bst = p.stats_base ? Object.values(p.stats_base).reduce((a, b) => a + b, 0) : 0;
            const genLabel = getGenLabel(p.generacion);
            
            // Lógica de nombre dinámico
            let nombreFinal = p.nombre;
            if (p.es_forma && p.form_name) {
                const contieneNombre = p.form_name.toLowerCase().includes(p.nombre.toLowerCase());
                nombreFinal = contieneNombre ? p.form_name : `${p.nombre} ${p.form_name}`;
            }

            return {
                ...p,
                bst: bst,
                genLabel: genLabel,
                nombreFinal: nombreFinal,
                nombreBusqueda: nombreFinal.toLowerCase()
            };
        });

        populateTypeFilters();
        updateUI();
    } catch (error) {
        console.error("Error crítico:", error);
        document.getElementById('pokedex').innerHTML = `
            <div class="col-span-full text-center p-10 bg-red-900/20 rounded-3xl border border-red-500">
                <p class="text-red-500 font-bold">Error al cargar la base de datos:</p>
                <p class="text-white text-sm mt-2">${error.message}</p>
                <p class="text-gray-400 text-xs mt-4">Verifica que 'valerion_data.json' esté en la carpeta raíz.</p>
            </div>`;
    }
}

/**
 * Llena los selectores de tipos
 */
function populateTypeFilters() {
    const type1Select = document.getElementById('type-1');
    const type2Select = document.getElementById('type-2');
    if (!type1Select || !type2Select) return;

    Object.keys(TYPE_MAP).forEach(typeKey => {
        const optionHTML = `<option value="${typeKey}">${TYPE_MAP[typeKey].esp}</option>`;
        type1Select.innerHTML += optionHTML;
        type2Select.innerHTML += optionHTML;
    });
}

/**
 * Filtra y ordena los datos
 */
function updateUI() {
    const filters = {
        search: document.getElementById('search').value.toLowerCase(),
        gen: document.getElementById('gen-filter').value,
        t1: document.getElementById('type-1').value.toUpperCase(),
        t2: document.getElementById('type-2').value.toUpperCase(),
        showForms: document.getElementById('show-forms').checked,
        sortBy: document.getElementById('sort-by').value,
        sortDir: document.getElementById('sort-direction').value
    };

    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombreBusqueda.includes(filters.search);
        const matchesGen = filters.gen === 'all' || p.genLabel === filters.gen;
        const matchesForm = filters.showForms ? true : !p.es_forma;
        
        const pTypes = p.tipos.map(t => t.toUpperCase());
        let matchesTypes = true;
        if (filters.t1 !== 'ALL' && filters.t2 !== 'ALL') {
            matchesTypes = (filters.t1 === filters.t2) 
                ? (pTypes.length === 1 && pTypes[0] === filters.t1)
                : (pTypes.includes(filters.t1) && pTypes.includes(filters.t2));
        } else if (filters.t1 !== 'ALL') matchesTypes = pTypes.includes(filters.t1);
        else if (filters.t2 !== 'ALL') matchesTypes = pTypes.includes(filters.t2);

        return matchesSearch && matchesGen && matchesForm && matchesTypes;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
        let valA, valB;
        
        // Criterio Primario
        if (filters.sortBy === 'bst') {
            valA = a.bst;
            valB = b.bst;
        } else if (a.stats_base && a.stats_base[filters.sortBy]) {
            valA = a.stats_base[filters.sortBy];
            valB = b.stats_base[filters.sortBy];
        } else {
            valA = a[filters.sortBy];
            valB = b[filters.sortBy];
        }

        // Si los valores son iguales (ej: mismo número de Pokedex), aplicamos desempate
        if (valA === valB) {
            // Ponemos la forma base (es_forma: false) siempre primero
            return a.es_forma - b.es_forma; 
        }

        // Normalización para strings
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        // Aplicamos la dirección
        return filters.sortDir === 'asc' 
            ? (valA > valB ? 1 : -1) 
            : (valA < valB ? 1 : -1);
    });

    renderPokedex(filtered);
}

/**
 * Renderiza la lista en el contenedor
 */
function renderPokedex(list) {
    const container = document.getElementById('pokedex');
    if (!container) return;
    container.innerHTML = list.map(p => createCard(p)).join('');
}

/**
 * Genera el HTML de una tarjeta (Función que faltaba)
 */
function createCard(p) {
    // Escalado de fuente dinámico
    let fontSizeClass = "text-2xl";
    if (p.nombreFinal.length > 18) fontSizeClass = "text-base";
    else if (p.nombreFinal.length > 14) fontSizeClass = "text-lg";
    else if (p.nombreFinal.length > 10) fontSizeClass = "text-xl";

    const typesHTML = p.tipos.map(t => {
        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#555' };
        return `<span class="text-[10px] px-2 py-0.5 rounded font-bold text-white uppercase" style="background-color: ${info.color}">${info.esp}</span>`;
    }).join('');

    const numeroFormateado = String(p.numero).padStart(3, '0');

    return `
        <div class="bg-gray-800 px-3 py-6 rounded-3xl hover:bg-gray-750 transition-all border-b-8 border-yellow-600 group shadow-lg flex flex-col relative">
            <span class="absolute top-4 right-6 font-mono text-xl font-black text-white/10 group-hover:text-yellow-500/20 transition-colors">
                #${numeroFormateado}
            </span>

            <div class="sprite-window mb-4 group-hover:scale-110 transition-transform relative flex-shrink-0">
                <img src="${CONFIG.SPRITE_PATH}${p.id}.png" class="pixelated" onerror="handleMissingImage(this)" alt="${p.nombre}" loading="lazy">
                <div class="placeholder-silhouette hidden">?</div>
            </div>
            
            <div class="flex-grow flex flex-col justify-between">
                <div class="mb-4 px-1">
                    <h2 class="text-center font-black ${fontSizeClass} uppercase tracking-tighter text-white leading-tight break-words">
                        ${p.nombreFinal}
                    </h2>
                    <p class="text-center text-yellow-500 text-[10px] font-bold mt-1 mb-3">${p.genLabel}</p>
                    <div class="flex justify-center gap-1 mb-2 flex-wrap">${typesHTML}</div>
                </div>

                <div class="bg-gray-900 p-3 rounded-xl mt-auto shadow-inner">
                    <div class="flex justify-between items-center mb-2 px-1 border-b border-gray-700 pb-1">
                        <span class="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Total Stats</span>
                        <span class="text-sm font-black text-white">${p.bst}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono opacity-90">
                        <div class="flex justify-between text-gray-400 border-b border-gray-800"><span class="text-[10px]">HP</span><span class="text-white font-bold">${p.stats_base.hp}</span></div>
                        <div class="flex justify-between text-gray-400 border-b border-gray-800"><span class="text-[10px]">ATK</span><span class="text-white font-bold">${p.stats_base.atq}</span></div>
                        <div class="flex justify-between text-gray-400 border-b border-gray-800"><span class="text-[10px]">DEF</span><span class="text-white font-bold">${p.stats_base.def}</span></div>
                        <div class="flex justify-between text-gray-400 border-b border-gray-800"><span class="text-[10px]">SPA</span><span class="text-white font-bold">${p.stats_base.spa}</span></div>
                        <div class="flex justify-between text-gray-400"><span class="text-[10px]">SPD</span><span class="text-white font-bold">${p.stats_base.spd}</span></div>
                        <div class="flex justify-between text-gray-400"><span class="text-[10px]">VEL</span><span class="text-white font-bold">${p.stats_base.vel}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleMissingImage(imgElement) {
    imgElement.classList.add('hidden');
    imgElement.nextElementSibling.classList.remove('hidden');
    imgElement.nextElementSibling.classList.add('flex');
}

function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('gen-filter').value = 'all';
    document.getElementById('type-1').value = 'all';
    document.getElementById('type-2').value = 'all';
    document.getElementById('show-forms').checked = true;
    document.getElementById('sort-by').value = 'numero';
    document.getElementById('sort-direction').value = 'asc';
    updateUI();
}

// Event Listeners
document.getElementById('search').addEventListener('input', updateUI);
document.getElementById('gen-filter').addEventListener('change', updateUI);
document.getElementById('type-1').addEventListener('change', updateUI);
document.getElementById('type-2').addEventListener('change', updateUI);
document.getElementById('clear-btn').addEventListener('click', clearFilters);
document.getElementById('show-forms').addEventListener('change', updateUI);
document.getElementById('sort-by').addEventListener('change', updateUI);
document.getElementById('sort-direction').addEventListener('change', updateUI);

// Ejecución
init();
