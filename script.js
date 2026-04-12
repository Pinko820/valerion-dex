let pokemonData = [];

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
 * Genera el HTML de una tarjeta individual
 */
function createCard(p) {
    return `
        <div class="bg-gray-800 p-5 rounded-3xl hover:bg-gray-750 transition-all border-b-8 border-yellow-600 group shadow-lg flex flex-col">
            <div class="sprite-window mb-4 group-hover:scale-110 transition-transform relative flex-shrink-0">
                <img src="sprites/${p.id}.png" class="pixelated" onerror="handleMissingImage(this)" alt="${p.nombre}">
                <div class="placeholder-silhouette hidden">?</div>
            </div>
            
            <div class="flex-grow flex flex-col justify-between">
                <div>
                    <h2 class="text-center font-bold text-xl uppercase tracking-tight text-white">${p.nombre}</h2>
                    <p class="text-center text-yellow-500 text-xs font-bold mb-3">${p.generacion}</p>
                    <div class="flex justify-center gap-1 mb-4 flex-wrap">
                        ${p.tipos.map(t => `<span class="text-[10px] bg-black/40 px-2 py-1 rounded-md font-mono text-gray-300 uppercase">${t}</span>`).join('')}
                    </div>
                </div>

                <div class="space-y-1 text-[10px] font-mono opacity-80 bg-gray-900 p-3 rounded-lg mt-auto">
                    <div class="flex justify-between text-gray-400"><span>HP</span><span class="text-white font-bold">${p.stats_base.hp}</span></div>
                    <div class="flex justify-between text-gray-400"><span>ATK</span><span class="text-white font-bold">${p.stats_base.atq}</span></div>
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
