import { cargarBaseDeDatos, getFilteredData, pokemonData } from './pokedex.js';
import { createCard } from './ui-utils.js';
import { openDetails, closeDetails } from './detalles.js';
import { populateTypeFilter } from './ui-utils.js';
import { TYPE_MAP,ABILITY_MAP } from './config.js';

async function init() {
    await cargarBaseDeDatos();
    
    // Llenamos los dos combobox de tipos
    populateTypeFilter('type-1', 'Tipo 1: Todos');
    populateTypeFilter('type-2', 'Tipo 2: Todos'); 
    
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

    // --- NUEVO: Lógica para Limpiar Filtros ---
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // 1. Resetear el buscador
            document.getElementById('search').value = "";
            
            // 2. Resetear todos los selects a "all"
            ['gen-filter', 'ability-filter', 'type-1', 'type-2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "all";
            });

            // 3. Resetear ordenamiento a sus valores iniciales
            const sortBy = document.getElementById('sort-by');
            if (sortBy) sortBy.value = "numero";
            
            const sortDir = document.getElementById('sort-direction');
            if (sortDir) sortDir.value = "asc";

            // 4. Asegurar que el checkbox de formas esté marcado
            const showForms = document.getElementById('show-forms');
            if (showForms) showForms.checked = true;

            // 5. Volver a dibujar la interfaz con los datos originales
            renderUI();
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

    const allAbilities = new Set();
    pokemonData.forEach(p => {
        p.habilidades.forEach(h => allAbilities.add(h));
        p.habilidad_oculta.forEach(h => allAbilities.add(h));
    });

    // Ordenar alfabéticamente basado en la traducción
    const sortedAbilities = Array.from(allAbilities).sort((a, b) => {
        const nameA = (ABILITY_MAP[a] || a).toLowerCase();
        const nameB = (ABILITY_MAP[b] || b).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    sortedAbilities.forEach(hab => {
        const opt = document.createElement('option');
        opt.value = hab; // El valor sigue siendo "NOGUARD" (técnico)
        opt.textContent = ABILITY_MAP[hab] || hab; // El texto es "Indefenso" (interfaz)
        select.appendChild(opt);
    });
}

init();