import { cargarBaseDeDatos, getFilteredData, pokemonData } from './pokedex.js';
import { createCard, handleMissingImage } from './ui-utils.js';
import { openDetails, closeDetails } from './detalles.js';
import { populateTypeFilter } from './ui-utils.js';

async function init() {
    await cargarBaseDeDatos();
    populateTypeFilter('type-1', 'Tipo 1: Todos');
    populateTypeFilter('type-2', 'Tipo 2: Todos');
    renderUI();

    // Event Delegation para clics en tarjetas
    document.getElementById('pokedex').addEventListener('click', (e) => {
        const card = e.target.closest('.card-pokemon');
        if (card) {
            const p = pokemonData.find(item => item.id === card.dataset.id);
            if (p) openDetails(p);
        }
    });

    // Listeners de Filtros
    ['search', 'gen-filter', 'type-filter', 'sort-by', 'sort-direction', 'show-forms'].forEach(id => {
        document.getElementById(id).addEventListener('input', renderUI);
    });

    document.getElementById('close-panel').addEventListener('click', closeDetails);
    document.getElementById('panel-overlay').addEventListener('click', closeDetails);
}

function renderUI() {
    const filtered = getFilteredData();
    document.getElementById('pokedex').innerHTML = filtered.map(p => createCard(p)).join('');
}

init();