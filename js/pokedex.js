import { getGenLabel } from './ui-utils.js';
import { TYPE_MAP } from './config.js';
import { selectedMoves, matchesMoveFilter } from './move-filter.js';

export let pokemonData  = [];
export let pokemonIndex = {};

// Referencia al cache de movimientos (se asigna desde main.js tras la precarga)
export let movesCache = null;
export function setMovesCache(cache) { movesCache = cache; }

// ── Carga y normaliza la base de datos principal ──────────────────────────
export async function cargarBaseDeDatos() {
    // OPTIMIZACIÓN: sin ?v=Date.now() → el navegador puede cachear el JSON
    const res     = await fetch('valerion_data.json');
    const rawData = await res.json();

    pokemonData = rawData.map(p => {
        const bst = Object.values(p.stats_base).reduce((a, b) => a + b, 0);

        // Construir nombre final para formas (evitar repetición del nombre base)
        let nombreFinal = p.nombre;
        if (p.es_forma && p.form_name) {
            const contiene = p.form_name.toLowerCase().includes(p.nombre.toLowerCase());
            nombreFinal = contiene ? p.form_name : `${p.nombre} ${p.form_name}`;
        }

        const entry = {
            ...p,
            bst,
            genLabel: getGenLabel(p.generacion),
            nombreFinal,
            nombreBusqueda: nombreFinal.toLowerCase(),
        };

        // OPTIMIZACIÓN: construir índice O(1) para lookups por ID
        pokemonIndex[p.id] = entry;
        return entry;
    });
}

// ── Filtra y ordena pokemonData según los controles de la UI ──────────────
export function getFilteredData() {
    const search    = document.getElementById('search')?.value.toLowerCase()  || '';
    const type1     = document.getElementById('type-1')?.value               || 'all';
    const type2     = document.getElementById('type-2')?.value               || 'all';
    const ability   = document.getElementById('ability-filter')?.value        || 'all';
    const gen       = document.getElementById('gen-filter')?.value            || 'all';
    const showForms = document.getElementById('show-forms')?.checked          ?? true;
    const sortBy    = document.getElementById('sort-by')?.value               || 'numero';
    const sortDir   = document.getElementById('sort-direction')?.value        || 'asc';

    const filtered = pokemonData.filter(p => {
        if (!p.nombreBusqueda.includes(search))                                                   return false;
        if (gen !== 'all') {
            // Comprobamos si el valor del select coincide con alguno de los elementos del array de este Pokémon
            const coincideGeneracion = p.generacion.some(g => 
                String(g) === gen || getGenLabel(g) === gen
            );
            if (!coincideGeneracion) return false;
        }
        if (!showForms        && p.es_forma)                                                      return false;
        if (ability !== 'all' && !p.habilidades.includes(ability)
                               && !p.habilidad_oculta.includes(ability))                          return false;
        if (!matchesMoveFilter(p.id, movesCache))                                                 return false;

        return matchesTypeFilter(p.tipos, type1, type2);
    });

    return filtered.sort((a, b) => {
        let valA = sortBy === 'bst' ? a.bst : (a.stats_base[sortBy] ?? a[sortBy]);
        let valB = sortBy === 'bst' ? b.bst : (b.stats_base[sortBy] ?? b[sortBy]);
        if (valA === valB) return a.id.localeCompare(b.id);
        return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
}

// ── Lógica de filtro de tipos extraída para mayor claridad ────────────────
function matchesTypeFilter(tipos, type1, type2) {
    const mapType = t => TYPE_MAP[t.toUpperCase()]?.esp;

    if (type1 !== 'all' && type2 !== 'all') {
        if (type1 === type2) {
            // Tipo monoatributo exacto
            return tipos.length === 1 && mapType(tipos[0]) === type1;
        }
        const hasT1 = tipos.some(t => mapType(t) === type1);
        const hasT2 = tipos.some(t => mapType(t) === type2);
        return hasT1 && hasT2;
    }

    if (type1 !== 'all') return tipos.some(t => mapType(t) === type1);
    if (type2 !== 'all') return tipos.some(t => mapType(t) === type2);

    return true;
}
