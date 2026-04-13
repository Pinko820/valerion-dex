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

/**
 * Llena los selectores de tipos automáticamente usando el TYPE_MAP
 */
function populateTypeFilters() {
    const type1Select = document.getElementById('type-1');
    const type2Select = document.getElementById('type-2');
    
    Object.keys(TYPE_MAP).forEach(typeKey => {
        const optionHTML = `<option value="${typeKey}">${TYPE_MAP[typeKey].esp}</option>`;
        type1Select.innerHTML += optionHTML;
        type2Select.innerHTML += optionHTML;
    });
}

/**
 * Maneja el error de carga de imagen ocultando el img y mostrando el placeholder
 */
function handleMissingImage(imgElement) {
    imgElement.classList.add('hidden');
    imgElement.nextElementSibling.classList.remove('hidden');
    imgElement.nextElementSibling.classList.add('flex');
}

/**
 * Carga inicial de datos
 */
async function init() {
    try {
        const res = await fetch(`valerion_data.json?v=${new Date().getTime()}`);
        pokemonData = await res.json();
        
        // Inicializamos los filtros de tipos
        populateTypeFilters();
        
        updateUI();
    } catch (error) {
        console.error("Error en la carga:", error);
        document.getElementById('pokedex').innerHTML = `<p class="text-center text-red-500">Error: ${error.message}</p>`;
    }
}

/**
 * Filtra y renderiza las tarjetas basándose en búsqueda, generación y tipos
 */
function updateUI() {
    const search = document.getElementById('search').value.toLowerCase();
    const gen = document.getElementById('gen-filter').value;
    const t1 = document.getElementById('type-1').value.toUpperCase();
    const t2 = document.getElementById('type-2').value.toUpperCase();
    const showForms = document.getElementById('show-forms').checked; // NUEVO

    const filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(search);
        const matchesGen = (gen === 'all' || p.generacion === gen);
        
        // REGLA: Si showForms es false, solo mostramos los que NO son forma
        const matchesFormStatus = showForms ? true : !p.es_forma;

        // Lógica de tipos (mantenemos la que ya teníamos)
        let matchesTypes = true;
        const pTypes = p.tipos.map(t => t.toUpperCase());
        // ... (tu lógica de t1 y t2 aquí) ...

        return matchesSearch && matchesGen && matchesTypes && matchesFormStatus;
    });

    const container = document.getElementById('pokedex');
    container.innerHTML = filtered.map(p => createCard(p)).join('');
}

/**
 * Genera el HTML de una tarjeta individual
 */
function createCard(p) {
    const bst = p.stats_base.hp + p.stats_base.atq + p.stats_base.def + 
                p.stats_base.spa + p.stats_base.spd + p.stats_base.vel;
    const nombreAMostrar = p.es_forma && p.form_name ? p.form_name : p.nombre;

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
                <img src="sprites/${p.id}.png" class="pixelated" onerror="handleMissingImage(this)" alt="${p.nombre}" loading="lazy">
                <div class="placeholder-silhouette hidden">?</div>
            </div>
            
            <div class="flex-grow flex flex-col justify-between">
                <div class="mb-4">
                    <h2 class="text-center font-black text-2xl uppercase tracking-tighter text-white leading-none">${nombreAMostrar}</h2>

                    <p class="text-center text-yellow-500 text-[10px] font-bold mt-1 mb-3">${p.generacion}</p>
                    <div class="flex justify-center gap-1 mb-2 flex-wrap">${typesHTML}</div>
                </div>

                <div class="bg-gray-900 p-3 rounded-xl mt-auto shadow-inner">
                    <div class="flex justify-between items-center mb-2 px-1 border-b border-gray-700 pb-1">
                        <span class="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Total Stats</span>
                        <span class="text-sm font-black text-white">${bst}</span>
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

function clearFilters() {
    // Resetear valores de los elementos del DOM
    document.getElementById('search').value = '';
    document.getElementById('gen-filter').value = 'all';
    document.getElementById('type-1').value = 'all';
    document.getElementById('type-2').value = 'all';
    
    // Ejecutar la actualización de la interfaz para mostrar todos los Pokémon
    updateUI();
}

// Event Listeners
document.getElementById('search').addEventListener('input', updateUI);
document.getElementById('gen-filter').addEventListener('change', updateUI);
document.getElementById('type-1').addEventListener('change', updateUI);
document.getElementById('type-2').addEventListener('change', updateUI);
document.getElementById('clear-btn').addEventListener('click', clearFilters);
document.getElementById('show-forms').addEventListener('change', updateUI);

// Ejecución inicial
init();
