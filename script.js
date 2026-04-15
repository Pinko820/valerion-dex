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

function populateTypeFilters() {
    const type1Select = document.getElementById('type-1');
    const type2Select = document.getElementById('type-2');
    
    Object.keys(TYPE_MAP).forEach(typeKey => {
        const optionHTML = `<option value="${typeKey}">${TYPE_MAP[typeKey].esp}</option>`;
        type1Select.innerHTML += optionHTML;
        type2Select.innerHTML += optionHTML;
    });
}

function handleMissingImage(imgElement) {
    imgElement.classList.add('hidden');
    imgElement.nextElementSibling.classList.remove('hidden');
    imgElement.nextElementSibling.classList.add('flex');
}

async function init() {
    try {
        const res = await fetch(`valerion_data.json?v=${new Date().getTime()}`);
        pokemonData = await res.json();
        populateTypeFilters();
        updateUI();
    } catch (error) {
        console.error("Error en la carga:", error);
        document.getElementById('pokedex').innerHTML = `<p class="text-center text-red-500">Error: ${error.message}</p>`;
    }
}

function updateUI() {
    const search = document.getElementById('search').value.toLowerCase();
    const gen = document.getElementById('gen-filter').value;
    const t1 = document.getElementById('type-1').value.toUpperCase();
    const t2 = document.getElementById('type-2').value.toUpperCase();
    const showForms = document.getElementById('show-forms').checked;
    
    // NUEVOS VALORES DE ORDENAMIENTO
    const sortBy = document.getElementById('sort-by').value;
    const sortDir = document.getElementById('sort-direction').value;

    // 1. FILTRADO (Tu lógica actual corregida)
    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(search);

        // TRADUCCIÓN: Si es 124, lo tratamos como "Valerion", si no, como "Gen X"
        const pGen = (typeof p.generacion === 'number') ? 
                (p.generacion === 124 ? "Valerion" : `Gen ${p.generacion}`) : 
                p.generacion;
        
        let matchesGen = (gen === 'all');
        if (gen === 'Otras') {
            const principales = ['Valerion', 'Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5', 'Gen 6', 'Gen 7', 'Gen 8', 'Gen 9'];
            matchesGen = !principales.includes(pGen);
        } else if (gen !== 'all') {
            matchesGen = (pGen === gen);
        }
        
        const matchesFormStatus = showForms ? true : !p.es_forma;
        const pTypes = p.tipos.map(t => t.toUpperCase());
        let matchesTypes = true;

        if (t1 !== 'ALL' && t2 !== 'ALL') {
            matchesTypes = (t1 === t2) ? (pTypes.length === 1 && pTypes[0] === t1) : (pTypes.includes(t1) && pTypes.includes(t2));
        } else if (t1 !== 'ALL') matchesTypes = pTypes.includes(t1);
        else if (t2 !== 'ALL') matchesTypes = pTypes.includes(t2);

        return matchesSearch && matchesGen && matchesTypes && matchesFormStatus;
    });

    // 2. ORDENAMIENTO (Lógica nueva)
    filtered.sort((a, b) => {
        let valA, valB;

        // Extraer valores según el criterio
        if (sortBy === 'nombre') {
            valA = a.nombre.toLowerCase();
            valB = b.nombre.toLowerCase();
        } else if (sortBy === 'bst') {
            valA = Object.values(a.stats_base).reduce((sum, s) => sum + s, 0);
            valB = Object.values(b.stats_base).reduce((sum, s) => sum + s, 0);
        } else if (['hp', 'atq', 'def', 'spa', 'spd', 'vel'].includes(sortBy)) {
            valA = a.stats_base[sortBy];
            valB = b.stats_base[sortBy];
        } else {
            valA = a.numero;
            valB = b.numero;
        }

        // Comparar según dirección
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. RENDERIZADO
    const container = document.getElementById('pokedex');
    container.innerHTML = filtered.map(p => createCard(p)).join('');
}

function createCard(p) {
    const bst = p.stats_base.hp + p.stats_base.atq + p.stats_base.def + 
                p.stats_base.spa + p.stats_base.spd + p.stats_base.vel;
    
    // --- NUEVA LÓGICA DE NOMBRE DINÁMICO ---
    let nombreFinal = p.nombre;
    if (p.es_forma && p.form_name) {
        // Comprobamos si el nombre base ya está en el nombre de la forma (ej: Mega Pidgeot)
        const contieneNombre = p.form_name.toLowerCase().includes(p.nombre.toLowerCase());
        nombreFinal = contieneNombre ? p.form_name : `${p.nombre} ${p.form_name}`;
    }

    // --- ESCALADO DE FUENTE DINÁMICO ---
    let fontSizeClass = "text-2xl";
    if (nombreFinal.length > 18) fontSizeClass = "text-base";
    else if (nombreFinal.length > 14) fontSizeClass = "text-lg";
    else if (nombreFinal.length > 10) fontSizeClass = "text-xl";

    const typesHTML = p.tipos.map(t => {
        const info = TYPE_MAP[t.toUpperCase()] || { esp: t, color: '#555' };
        return `<span class="text-[10px] px-2 py-0.5 rounded font-bold text-white uppercase" style="background-color: ${info.color}">${info.esp}</span>`;
    }).join('');

    const numeroFormateado = String(p.numero).padStart(3, '0');
    
    const genLabel = (typeof p.generacion === 'number') ? 
                (p.generacion === 124 ? "Valerion" : `Gen ${p.generacion}`) : 
                p.generacion;

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
                <div class="mb-4 px-1">
                    <h2 class="text-center font-black ${fontSizeClass} uppercase tracking-tighter text-white leading-tight break-words">
                        ${nombreFinal}
                    </h2>
                    <p class="text-center text-yellow-500 text-[10px] font-bold mt-1 mb-3">${genLabel}</p>
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
    document.getElementById('search').value = '';
    document.getElementById('gen-filter').value = 'all';
    document.getElementById('type-1').value = 'all';
    document.getElementById('type-2').value = 'all';
    document.getElementById('show-forms').checked = true;
    
    // Resetear ordenamiento
    document.getElementById('sort-by').value = 'numero';
    document.getElementById('sort-direction').value = 'asc';
    
    updateUI();
}

document.getElementById('search').addEventListener('input', updateUI);
document.getElementById('gen-filter').addEventListener('change', updateUI);
document.getElementById('type-1').addEventListener('change', updateUI);
document.getElementById('type-2').addEventListener('change', updateUI);
document.getElementById('clear-btn').addEventListener('click', clearFilters);
document.getElementById('show-forms').addEventListener('change', updateUI);
document.getElementById('sort-by').addEventListener('change', updateUI);
document.getElementById('sort-direction').addEventListener('change', updateUI);

init();
