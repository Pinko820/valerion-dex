let pokemonData = [];
const TYPE_COLORS = {
    NORMAL: '#A8A77A', FIRE: '#EE8130', WATER: '#6390F0',
    GRASS: '#7AC74C', ELECTRIC: '#F7D02C', ICE: '#96D9D6',
    FIGHTING: '#C22E28', POISON: '#A33EA1', GROUND: '#E2BF65',
    FLYING: '#A98FF3', PSYCHIC: '#F95587', BUG: '#A6B91A',
    ROCK: '#B6A136', GHOST: '#735797', DRAGON: '#6F35FC',
    STEEL: '#B7B7CE', FAIRY: '#D685AD', DARK: '#705746'
};

/**
 * Maneja el error de carga de imagen ocultando el img y mostrando el placeholder
 */
function handleMissingImage(imgElement) {
    imgElement.classList.add('hidden');
    // Muestra el div placeholder que es el siguiente hermano en el DOM
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
        updateUI();
    } catch (error) {
        console.error("Error en la carga:", error);
        document.getElementById('pokedex').innerHTML = `<p class="text-center text-red-500">Error: ${error.message}</p>`;
    }
}

/**
 * Filtra y renderiza las tarjetas
 */
function updateUI() {
    const search = document.getElementById('search').value.toLowerCase();
    const gen = document.getElementById('gen-filter').value;

    const filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(search);
        const matchesGen = (gen === 'all' || p.generacion === gen);
        return matchesSearch && matchesGen;
    });

    const container = document.getElementById('pokedex');
    container.innerHTML = filtered.map(p => createCard(p)).join('');
}

/**
 * Genera el HTML de una tarjeta individual con los 6 stats
 */
function createCard(p) {
    const typesHTML = p.tipos.map(t => {
        const color = TYPE_COLORS[t.toUpperCase()] || '#555';
        return `<span class="text-xs px-3 py-1 rounded-md font-bold text-white uppercase shadow-sm" 
                      style="background-color: ${color}">
                    ${t}
                </span>`;
    }).join('');

    return `
        <div class="bg-gray-800 p-6 rounded-3xl hover:bg-gray-750 transition-all border-b-8 border-yellow-600 group shadow-lg flex flex-col">
            <div class="sprite-window mb-6 group-hover:scale-110 transition-transform relative flex-shrink-0">
                <img src="sprites/${p.id}.png" class="pixelated" onerror="handleMissingImage(this)" alt="${p.nombre}" loading="lazy">
                <div class="placeholder-silhouette hidden">?</div>
            </div>
            
            <div class="flex-grow flex flex-col justify-between">
                <div class="mb-4">
                    <h2 class="text-center font-black text-2xl uppercase tracking-tight text-white leading-none">${p.nombre}</h2>
                    <p class="text-center text-yellow-500 text-sm font-bold mt-1 mb-4">${p.generacion}</p>
                    
                    <div class="flex justify-center gap-2 mb-2 flex-wrap">
                        ${typesHTML}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono opacity-90 bg-gray-900 p-4 rounded-xl mt-auto">
                    <div class="flex justify-between text-gray-400 border-b border-gray-800 pb-1"><span>HP</span><span class="text-white font-bold">${p.stats_base.hp}</span></div>
                    <div class="flex justify-between text-gray-400 border-b border-gray-800 pb-1"><span>ATK</span><span class="text-white font-bold">${p.stats_base.atq}</span></div>
                    <div class="flex justify-between text-gray-400 border-b border-gray-800 pb-1"><span>DEF</span><span class="text-white font-bold">${p.stats_base.def}</span></div>
                    <div class="flex justify-between text-gray-400 border-b border-gray-800 pb-1"><span>SPA</span><span class="text-white font-bold">${p.stats_base.spa}</span></div>
                    <div class="flex justify-between text-gray-400"><span>SPD</span><span class="text-white font-bold">${p.stats_base.spd}</span></div>
                    <div class="flex justify-between text-gray-400"><span>VEL</span><span class="text-white font-bold">${p.stats_base.vel}</span></div>
                </div>
            </div>
        </div>
    `;
}

// Event Listeners
document.getElementById('search').addEventListener('input', updateUI);
document.getElementById('gen-filter').addEventListener('change', updateUI);

// Ejecución inicial
init();
