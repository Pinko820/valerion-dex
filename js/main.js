import { cargarBaseDeDatos, getFilteredData, pokemonData } from './pokedex.js';
import { createCard } from './ui-utils.js';
import { openDetails, closeDetails } from './detalles.js';
import { populateTypeFilter } from './ui-utils.js';

async function init() {
    await cargarBaseDeDatos();
    
    // Llenamos los dos combobox de tipos
    populateTypeFilter('type-1', 'Primer Tipo: Todos');
    populateTypeFilter('type-2', 'Segundo Tipo: Todos'); 
    
    // Nueva función para el filtro de habilidades
    populateAbilityFilter();

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
    const filterIds = ['search', 'gen-filter', 'ability-filter', 'type-1', 'type-2', 'sort-by', 'sort-direction', 'show-forms'];
    
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

function populateAbilityFilter() {
    const select = document.getElementById('ability-filter');
    if (!select) return;

    // Extraemos todas las habilidades (normales y ocultas) de todos los pokemon
    const todasLasHabilidades = new Set();
    pokemonData.forEach(p => {
        p.habilidades.forEach(h => todasLasHabilidades.add(h));
        p.habilidad_oculta.forEach(h => todasLasHabilidades.add(h));
    });

    // Ordenamos alfabéticamente
    const listaOrdenada = Array.from(todasLasHabilidades).sort();

    listaOrdenada.forEach(hab => {
        const option = document.createElement('option');
        option.value = hab;
        option.textContent = hab;
        select.appendChild(option);
    });
}

init();