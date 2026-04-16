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
    const gen = document.getElementById('gen-filter').value;
    const showForms = document.getElementById('show-forms').checked;
    const sortBy = document.getElementById('sort-by').value;
    const sortDir = document.getElementById('sort-direction').value;

    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombreBusqueda.includes(search);
        const matchesGen = gen === 'all' || p.genLabel === gen;
        const matchesForm = showForms ? true : !p.es_forma;
        return matchesSearch && matchesGen && matchesForm;
    });

    return filtered.sort((a, b) => {
        let valA = (sortBy === 'bst') ? a.bst : (a.stats_base[sortBy] || a[sortBy]);
        let valB = (sortBy === 'bst') ? b.bst : (b.stats_base[sortBy] || b[sortBy]);
        if (valA === valB) return a.es_forma - b.es_forma;
        return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
}