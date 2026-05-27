import { cargarBaseDeDatos, getFilteredData, pokemonIndex, setMovesCache } from './pokedex.js';
import { createCard, observeNewSprites, populateTypeFilter } from './ui-utils.js';
import { openDetails, closeDetails, preloadMoves } from './detalles.js';
import { ABILITY_MAP } from './config.js';
import { initMoveFilter, setMoveFilterCallback } from './move-filter.js';

// OPTIMIZACIÓN: debounce para evitar re-renders en cada tecla
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

async function init() {
    await cargarBaseDeDatos();

    populateTypeFilter('type-1', 'Tipo 1: Todos');
    populateTypeFilter('type-2', 'Tipo 2: Todos');
    populateAbilityFilter();

    renderUI();

    // OPTIMIZACIÓN: precargar moves_data en background para que el primer
    // clic al panel de detalles sea instantáneo. Cuando termine, inicializar
    // el filtro de movimientos con el catálogo completo.
    preloadMoves().then(cache => {
        setMovesCache(cache);
        // Añade esta línea para poder acceder desde la consola:
        window.movesCache = cache;
        setMoveFilterCallback(renderUI);
        initMoveFilter(cache, renderUI);
    });

    // OPTIMIZACIÓN: delegación de eventos — un solo listener para todas las tarjetas
    const pokedexContainer = document.getElementById('pokedex');
    if (pokedexContainer) {
        pokedexContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.card-pokemon');
            if (card) {
                // OPTIMIZACIÓN: lookup O(1) por índice en vez de .find() O(n)
                const p = pokemonIndex[card.dataset.id];
                if (p) openDetails(p);
            }
        });
    }

    // Limpiar filtros
    document.getElementById('clear-btn')?.addEventListener('click', () => {
        document.getElementById('search').value = "";
        ['gen-filter', 'ability-filter', 'type-1', 'type-2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "all";
        });
        document.getElementById('sort-by').value       = "numero";
        document.getElementById('sort-direction').value = "asc";
        document.getElementById('show-forms').checked   = true;

        // Limpiar chips de movimientos
        import('./move-filter.js').then(({ selectedMoves: sm }) => {
            sm.length = 0; // vaciar el array in-place
            const box   = document.getElementById('move-filter-box');
            const input = document.getElementById('move-search-input');
            if (box && input) box.querySelectorAll('.move-chip').forEach(c => c.remove());
        });

        renderUI();
    });

    // OPTIMIZACIÓN: debounce 200ms en el buscador de texto, inmediato en selects
    const debouncedRender = debounce(renderUI, 200);
    const filterIds = ['search', 'gen-filter', 'ability-filter', 'type-1', 'type-2',
                       'sort-by', 'sort-direction', 'show-forms'];

    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const isText = el.tagName === 'INPUT' && el.type === 'text';
        el.addEventListener(isText ? 'input' : 'change', isText ? debouncedRender : renderUI);
    });

    document.getElementById('close-panel')?.addEventListener('click', closeDetails);
    document.getElementById('panel-overlay')?.addEventListener('click', closeDetails);
}

function renderUI() {
    const filtered = getFilteredData();
    const container = document.getElementById('pokedex');
    if (!container) return;

    // OPTIMIZACIÓN: DocumentFragment → un solo reflow al final
    const fragment = document.createDocumentFragment();
    const tmp = document.createElement('div');

    filtered.forEach(p => {
        tmp.innerHTML = createCard(p);
        fragment.appendChild(tmp.firstElementChild);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    // OPTIMIZACIÓN: registrar sprites recién insertados para lazy-load
    observeNewSprites(container);
}

function populateAbilityFilter() {
    const select = document.getElementById('ability-filter');
    if (!select) return;

    const allAbilities = new Set();
    // Import pokemonData lazily from the already-loaded module
    import('./pokedex.js').then(({ pokemonData }) => {
        pokemonData.forEach(p => {
            p.habilidades.forEach(h => allAbilities.add(h));
            p.habilidad_oculta.forEach(h => allAbilities.add(h));
        });

        const sortedAbilities = [...allAbilities].sort((a, b) => {
            const nA = (ABILITY_MAP[a] || a).toLowerCase();
            const nB = (ABILITY_MAP[b] || b).toLowerCase();
            return nA.localeCompare(nB);
        });

        // OPTIMIZACIÓN: un solo innerHTML en vez de N appendChild
        select.innerHTML = '<option value="all">Todas las Habilidades</option>' +
            sortedAbilities.map(h =>
                `<option value="${h}">${ABILITY_MAP[h] || h}</option>`
            ).join('');
    });
}

init();