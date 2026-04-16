import { getGenLabel, createCard } from './ui-utils.js';

export let pokemonData = [];

export async function cargarBaseDeDatos() {
    const res = await fetch(`valerion_data.json?v=${new Date().getTime()}`);
    const rawData = await res.json();
    
    pokemonData = rawData.map(p => {
        const bst = Object.values(p.stats_base).reduce((a, b) => a + b, 0);
        let nombreFinal = p.nombre;
        if (p.es_forma && p.form_name) {
            const contiene = p.form_name.toLowerCase().includes(p.nombre.toLowerCase());
            nombreFinal = contiene ? p.form_name : `${p.nombre} ${p.form_name}`;
        }
        return { ...p, bst, genLabel: getGenLabel(p.generacion), nombreFinal, nombreBusqueda: nombreFinal.toLowerCase() };
    });
}

export function getFilteredData() {
    const search = document.getElementById('search').value.toLowerCase();
    const type1 = document.getElementById('type-1').value;
    const type2 = document.getElementById('type-2').value;
    const gen = document.getElementById('gen-filter').value;
    const showForms = document.getElementById('show-forms').checked;
    const sortBy = document.getElementById('sort-by').value;
    const sortDir = document.getElementById('sort-direction').value;

    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombreBusqueda.includes(search);
        
        // Lógica para Tipo 1
        const matchesType1 = type1 === 'all' || p.tipos.some(t => {
            return TYPE_MAP[t.toUpperCase()]?.esp === type1;
        });

        // Lógica para Tipo 2
        const matchesType2 = type2 === 'all' || p.tipos.some(t => {
            return TYPE_MAP[t.toUpperCase()]?.esp === type2;
        });

        const matchesGen = gen === 'all' || p.genLabel === gen;
        const matchesForm = showForms ? true : !p.es_forma;

        // El Pokémon debe cumplir con ambos filtros de tipo a la vez
        return matchesSearch && matchesType1 && matchesType2 && matchesGen && matchesForm;
    });

    return filtered.sort((a, b) => {
        let valA = (sortBy === 'bst') ? a.bst : (a.stats_base[sortBy] || a[sortBy]);
        let valB = (sortBy === 'bst') ? b.bst : (b.stats_base[sortBy] || b[sortBy]);
        if (valA === valB) return a.es_forma - b.es_forma;
        return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
}