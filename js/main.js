import { cargarBaseDeDatos, getFilteredData, pokemonData } from './pokedex.js';
import { createCard } from './ui-utils.js';
import { openDetails, closeDetails } from './detalles.js';
import { populateTypeFilter } from './ui-utils.js';

async function init() {
    await cargarBaseDeDatos();
    
    // Llenamos los dos combobox de tipos
    populateTypeFilter('type-1', 'Primer Tipo: Todos');
    populateTypeFilter('type-2', 'Segundo Tipo: Todos'); 
    
    renderUI();

    // Delegación de eventos para las tarjetas
    const pokedexContainer = document.getElementById('pokedex');
    if (pokedexContainer) {
        pokedexContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.card-pokemon');
            if (card) {
                const p = pokemonData.find(item => item.id === card.dataset.id);
                if (p) openDetails(p);
            }
        });
    }

    // LISTENER DE FILTROS (Corregido para usar type-1 y type-2)
    const filterIds = ['search', 'gen-filter', 'type-1', 'type-2', 'sort-by', 'sort-direction', 'show-forms'];
    
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Usamos 'input' para texto y 'change' para selects para mayor compatibilidad
            const eventType = el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change';
            el.addEventListener(eventType, renderUI);
        }
    });

    document.getElementById('close-panel')?.addEventListener('click', closeDetails);
    document.getElementById('panel-overlay')?.addEventListener('click', closeDetails);
}

function renderUI() {
    const filtered = getFilteredData();
    const container = document.getElementById('pokedex');
    if (container) {
        container.innerHTML = filtered.map(p => createCard(p)).join('');
    }
}

init();