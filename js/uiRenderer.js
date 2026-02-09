// UI Renderer.js
// Handles updating game UI from level data.

// Game Page Elements
const selectors = {
    levelTitle: ".content h1",
    levelLead: ".content .lead",
    conceptTitle: ".instructions h2",
    conceptText: ".instructions p",
    cssInput: "#cssInput",
    grid: ".grid",
    hintBtn: "#hint"
}

// Helper: Check for game page elements
function must(selectors) {
    const el = document.querySelector(selectors);
    if (!el) {
        console.error(`Element ${selectors} not found!`);
        throw new Error(`Element ${selectors} not found!`);
    }
    return el;
}

// Function: Render grid from level data
export function renderGrid(level) {
    const gridEl = must(selectors.grid);

    gridEl.innerHTML = ""; // Clear existing grid

    const entities = level?.entities ?? [];
    const initialLayout = level?.layout?.initial ?? {};

    // Create grid cells for each entity
    for (const entity of entities) {
        const el = document.createElement("div");

        // Set class and data attributes
        el.className = entity.className || "";
        el.dataset.entityId = entity.id || "";

        // Apply base CSS if provided
        if (entity.baseCss) {
            el.style.cssText = entity.baseCss;
        }

        // Apply Grid Placement
        const pos = entity.id ? initialLayout[entity.id] : null;
        if (pos?.gridColumn) el.style.gridColumn = pos.gridColumn;
        if (pos?.gridRow) el.style.gridRow = pos.gridRow;

        gridEl.appendChild(el);
    }
}

// Function: Render level details
export function renderLevel(level) {
    // Update level title and lead
    must(selectors.levelTitle).textContent = level.title ?? "Untitled Level";
    must(selectors.levelLead).textContent = level?.ui?.prompt ?? "";

    const conceptLabel = level?.concept?.name
        ? `Concept - ${level.concept.name}`
        : "Concept";

    // Update concept title and text
    must(selectors.conceptTitle).textContent = conceptLabel;
    must(selectors.conceptText).textContent = level?.concept?.explain ?? "";

    // Update starter CSS input
    must(selectors.cssInput).value = level?.ui?.starterCss ?? "";

    renderGrid(level); // Build Grid Preview
}

// Function: Wire up hints
export function wireHints(level) {
    const btn = document.querySelector(selectors.hintBtn);
    if (!btn) return; // No hint button, skip

    const hints = level?.ui?.hints ?? [];
    btn.disabled = hints.length === 0; // Disable if no hints

    let hintIndex = 0;

    btn.onclick = () => {
        if (!hints.length) return;
        alert(hints[hintIndex % hints.length]); // Show current hint
        hintIndex++;
    };
}