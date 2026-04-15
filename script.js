// Centralizamos la configuración
const CONFIG = {
    VALERION_GEN: 124,
    SPRITE_PATH: 'sprites/'
};

let pokemonData = [];

// Helper para normalizar nombres de generación
const getGenLabel = (gen) => {
    if (gen === CONFIG.VALERION_GEN) return "Valerion";
    return typeof gen === 'number' ? `Gen ${gen}` : gen;
};

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
        const rawData = await res.json();
        
        // OPTIMIZACIÓN: Pre-procesamos los datos para no calcular en cada render
        pokemonData = rawData.map(p => ({
            ...p,
            bst: Object.values(p.stats_base).reduce((a, b) => a + b, 0),
            genLabel: getGenLabel(p.generacion),
            nombreBusqueda: p.nombre.toLowerCase()
        }));

        populateTypeFilters();
        updateUI();
    } catch (error) {
        console.error("Error:", error);
    }
}

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

    // 1. Filtrado eficiente
    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombreBusqueda.includes(filters.search);
        const matchesGen = filters.gen === 'all' || p.genLabel === filters.gen;
        const matchesForm = filters.showForms ? true : !p.es_forma;
        
        // Lógica de tipos simplificada
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

    // 2. Ordenamiento (ahora mucho más rápido porque el BST ya existe)
    filtered.sort((a, b) => {
        let valA = (filters.sortBy === 'bst') ? a.bst : (a.stats_base[filters.sortBy] || a[filters.sortBy]);
        let valB = (filters.sortBy === 'bst') ? b.bst : (b.stats_base[filters.sortBy] || b[filters.sortBy]);
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        return filters.sortDir === 'asc' 
            ? (valA > valB ? 1 : -1) 
            : (valA < valB ? 1 : -1);
    });

    renderPokedex(filtered);
}

// Separamos el render para mayor claridad
function renderPokedex(list) {
    const container = document.getElementById('pokedex');
    // Usamos DocumentFragment o un solo innerHTML para evitar reflujos constantes
    container.innerHTML = list.map(p => createCard(p)).join('');
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
