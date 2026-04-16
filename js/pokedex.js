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
        const matchesGen = gen === 'all' || p.genLabel === gen;
        const matchesForm = showForms ? true : !p.es_forma;

        // --- Lógica de Tipos ---
        let matchesType = true;
        if (type1 !== 'all' && type2 !== 'all') {
            if (type1 === type2) {
                // CASO: Pokémon Puro (Solo el tipo seleccionado)
                matchesType = p.tipos.length === 1 && 
                              TYPE_MAP[p.tipos[0].toUpperCase()]?.esp === type1;
            } else {
                // CASO: Doble Tipo (Debe tener ambos)
                const tieneT1 = p.tipos.some(t => TYPE_MAP[t.toUpperCase()]?.esp === type1);
                const tieneT2 = p.tipos.some(t => TYPE_MAP[t.toUpperCase()]?.esp === type2);
                matchesType = tieneT1 && tieneT2;
            }
        } else if (type1 !== 'all') {
            matchesType = p.tipos.some(t => TYPE_MAP[t.toUpperCase()]?.esp === type1);
        } else if (type2 !== 'all') {
            matchesType = p.tipos.some(t => TYPE_MAP[t.toUpperCase()]?.esp === type2);
        }

        return matchesSearch && matchesType && matchesGen && matchesForm;
    });

    // --- Lógica de Ordenamiento ---
    return filtered.sort((a, b) => {
        // Buscamos el valor en stats_base, si no existe (como 'numero'), buscamos en la raíz
        let valA = (sortBy === 'bst') ? a.bst : (a.stats_base[sortBy] ?? a[sortBy]);
        let valB = (sortBy === 'bst') ? b.bst : (b.stats_base[sortBy] ?? b[sortBy]);
        
        // Desempate por ID para que el orden sea consistente
        if (valA === valB) return a.id.localeCompare(b.id);

        if (sortDir === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
}