import { getGenLabel, createCard } from './ui-utils.js';
import { TYPE_MAP } from './config.js';

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
    const search = document.getElementById('search')?.value.toLowerCase() || "";
    const type1 = document.getElementById('type-1')?.value || "all";
    const type2 = document.getElementById('type-2')?.value || "all";
    const gen = document.getElementById('gen-filter')?.value || "all";
    const showForms = document.getElementById('show-forms')?.checked || false;
    const sortBy = document.getElementById('sort-by')?.value || "numero";
    const sortDir = document.getElementById('sort-direction')?.value || "asc";

    let filtered = pokemonData.filter(p => {
        const matchesSearch = p.nombreBusqueda.includes(search);
        
        // Comprobar si el Pokémon tiene el Tipo 1 seleccionado
        const matchesType1 = type1 === 'all' || p.tipos.some(t => {
            return TYPE_MAP[t.toUpperCase()]?.esp === type1;
        });

        // Comprobar si el Pokémon tiene el Tipo 2 seleccionado
        const matchesType2 = type2 === 'all' || p.tipos.some(t => {
            return TYPE_MAP[t.toUpperCase()]?.esp === type2;
        });

        const matchesGen = gen === 'all' || p.genLabel === gen;
        const matchesForm = showForms ? true : !p.es_forma;

        return matchesSearch && matchesType1 && matchesType2 && matchesGen && matchesForm;
    });

    // ORDENAMIENTO (Corregido el acceso a stats_base)
    return filtered.sort((a, b) => {
        let valA = (sortBy === 'bst') ? a.bst : (a.stats_base[sortBy] ?? a[sortBy]);
        let valB = (sortBy === 'bst') ? b.bst : (b.stats_base[sortBy] ?? b[sortBy]);
        
        // Si los valores son iguales (ej. mismo número de Pokedex), priorizar la forma base
        if (valA === valB) return a.es_forma - b.es_forma;

        if (sortDir === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
}