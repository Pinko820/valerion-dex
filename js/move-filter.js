// js/move-filter.js
// Widget de filtro de movimientos con autocomplete y chips

import { TYPE_MAP } from './config.js';

// ── Estado global ──────────────────────────────────────────────────────────
// Cada entrada: { id: 'CLOSECOMBAT', label: 'Combate Cerrado' }
export let selectedMoves = [];

// Catálogo global: { id → { label, tipo, cat } }
// Se construye al llamar initMoveFilter(movesData)
let moveCatalog = {};

// ── Categoría → color texto ────────────────────────────────────────────────
const CAT_COLOR = { Physical: '#f97316', Special: '#60a5fa', Status: '#9ca3af' };
const CAT_LABEL = { Physical: 'Fís.', Special: 'Esp.', Status: 'Est.' };

// ── Inicialización ─────────────────────────────────────────────────────────
export function initMoveFilter(movesData, onChangeCallback) {
    // 1. Construir catálogo global de movimientos únicos desde moves_data
    moveCatalog = {};
    for (const pkm of Object.values(movesData)) {
        for (const cat of ['nivel', 'mt', 'huevo']) {
            for (const m of pkm[cat] || []) {
                if (!moveCatalog[m.nombre]) {
                    moveCatalog[m.nombre] = {
                        label: m.nombre_es || m.nombre,
                        tipo:  (m.tipo || 'NORMAL').toUpperCase(),
                        cat:   m.cat || 'Status',
                    };
                }
            }
        }
    }

    // 2. Referencias DOM
    const box       = document.getElementById('move-filter-box');
    const input     = document.getElementById('move-search-input');
    const dropdown  = document.getElementById('move-autocomplete');
    if (!box || !input || !dropdown) return;

    // 3. Clic en el box → enfocar input
    box.addEventListener('click', () => input.focus());

    // 4. Input → mostrar sugerencias
    let activeIdx = -1;
    input.addEventListener('input', () => {
        activeIdx = -1;
        renderDropdown(input.value.trim(), dropdown);
    });

    // 5. Teclado: flechas + enter + backspace
    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('li[data-id]');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, items.length - 1);
            items.forEach((li, i) => li.classList.toggle('active', i === activeIdx));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, 0);
            items.forEach((li, i) => li.classList.toggle('active', i === activeIdx));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const active = dropdown.querySelector('li.active[data-id]');
            if (active) addMove(active.dataset.id, active.dataset.label, box, input, dropdown, onChangeCallback);
        } else if (e.key === 'Backspace' && input.value === '' && selectedMoves.length > 0) {
            // Borrar último chip
            const last = selectedMoves[selectedMoves.length - 1];
            removeMove(last.id, box, input, onChangeCallback);
            hideDropdown(dropdown);
        } else if (e.key === 'Escape') {
            hideDropdown(dropdown);
        }
    });

    // 6. Clic fuera → cerrar dropdown
    document.addEventListener('click', (e) => {
        if (!box.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown(dropdown);
        }
    });
}

// ── Filtrado de Pokémon ────────────────────────────────────────────────────
// Dado un pokémon y movesCache (moves_data), devuelve true si tiene TODOS
// los movimientos seleccionados (en cualquier categoría)
export function matchesMoveFilter(pokemonId, movesCache) {
    if (selectedMoves.length === 0) return true;
    const pkm = movesCache?.[pokemonId];
    if (!pkm) return false;

    const allMoveIds = new Set([
        ...(pkm.nivel  || []).map(m => m.nombre),
        ...(pkm.mt     || []).map(m => m.nombre),
        ...(pkm.huevo  || []).map(m => m.nombre),
    ]);

    return selectedMoves.every(sel => allMoveIds.has(sel.id));
}

// ── Helpers internos ───────────────────────────────────────────────────────
function renderDropdown(query, dropdown) {
    if (!query) { hideDropdown(dropdown); return; }

    const q = query.toLowerCase();
    const results = Object.entries(moveCatalog)
        .filter(([id, info]) =>
            !selectedMoves.some(s => s.id === id) &&           // no repetir
            (info.label.toLowerCase().includes(q) || id.toLowerCase().includes(q))
        )
        .slice(0, 12); // máximo 12 sugerencias

    if (!results.length) {
        dropdown.innerHTML = `<li class="mv-nomatch">Sin resultados para "${query}"</li>`;
        dropdown.classList.remove('hidden');
        return;
    }

    const typeColor = (tipo) => TYPE_MAP[tipo]?.color || '#555';

    dropdown.innerHTML = results.map(([id, info]) => `
        <li data-id="${id}" data-label="${escHtml(info.label)}">
            <span class="mv-type" style="background:${typeColor(info.tipo)}">${TYPE_MAP[info.tipo]?.esp || info.tipo}</span>
            <span class="mv-name">${escHtml(info.label)}</span>
            <span class="mv-cat" style="color:${CAT_COLOR[info.cat]}">${CAT_LABEL[info.cat] || ''}</span>
        </li>
    `).join('');

    dropdown.querySelectorAll('li[data-id]').forEach(li => {
        li.addEventListener('mousedown', (e) => {
            e.preventDefault(); // evitar que el input pierda foco antes del click
            const box    = document.getElementById('move-filter-box');
            const input  = document.getElementById('move-search-input');
            addMove(li.dataset.id, li.dataset.label, box, input, dropdown,
                    window.__moveFilterCallback);
        });
    });

    dropdown.classList.remove('hidden');
}

function addMove(id, label, box, input, dropdown, onChangeCallback) {
    if (selectedMoves.some(s => s.id === id)) return;
    selectedMoves.push({ id, label });
    input.value = '';
    hideDropdown(dropdown);
    renderChips(box, input, onChangeCallback);
    onChangeCallback?.();
}

function removeMove(id, box, input, onChangeCallback) {
    selectedMoves = selectedMoves.filter(s => s.id !== id);
    renderChips(box, input, onChangeCallback);
    onChangeCallback?.();
}

function renderChips(box, input, onChangeCallback) {
    // Eliminar chips previos (mantener el input)
    box.querySelectorAll('.move-chip').forEach(c => c.remove());

    selectedMoves.forEach(({ id, label }) => {
        const chip = document.createElement('span');
        chip.className = 'move-chip';
        chip.innerHTML = `${escHtml(label)}<button title="Quitar" aria-label="Quitar ${escHtml(label)}">×</button>`;
        chip.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            removeMove(id, box, input, onChangeCallback);
        });
        box.insertBefore(chip, input);
    });
}

function hideDropdown(dropdown) {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
}

function escHtml(str) {
    return str.replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// Guardar callback globalmente para el mousedown del dropdown
export function setMoveFilterCallback(fn) {
    window.__moveFilterCallback = fn;
}
