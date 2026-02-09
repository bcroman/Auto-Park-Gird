// UI Renderer.js
// Handles updating game UI from level data.

// Game Page Elements
const elements = {
    levelTitle: ".content h1",
    levelLead: ".content .lead",
    conceptTitle: ".instructions h2",
    conceptText: ".instructions p",
    cssInput: "#cssInput",
    gird: ".grid",
}

// Helper: Check for game page elements
function must(elements) {
    const el = document.querySelector(elements);
    if (!el) {
        console.error(`Element ${elements} not found!`);
        throw new Error(`Element ${elements} not found!`);
    }
    return el;
}

// Function: Render Gird from level data
export function renderGird(level) {
    const gridEl = must(elements.gird);

    gridEl.innnerHTML = ""; // Clear existing grid

    for (const entity of entites) {
        const el = document.createElement("div");

        // Set class and data attributes
        el.className = entity.class || "";
        el.dataset.entityId = entity.id || "";

        // Apply base CSS if provided
        if (entity.baseCss) {
            el.style.cssText = entity.baseCss;
        }

        // Apply Grid Placement
        const pos = entity.id ? initalLayout[entity.id] : null;
        if (pos?.gridColumn) el.style.gridColumn = pos.gridColumn;
        if (pos?.gridRow) el.style.gridRow = pos.gridRow;

        gridEl.appendChild(el);
    }
}

// Function: Render level details
export function renderLevel(level) {
    // Update level title and lead
    must(elements.levelTitle).textContent = level.title ?? "Untitled Level";
    must(elements.levelLead).textContent = level?.ui?.prompt ?? "";

    const conceptLabel = level?.concept?.name
        ? `Concept - ${level.concept.name}`
        : "Concept";

    // Update concept title and text
    must(elements.conceptTitle).textContent = conceptLabel;
    must(elements.conceptText).textContent = level?.concept?.explain ?? "";

    // Update starter CSS input
    must(elements.cssInput).value = level?.ui?.starterCss ?? "";

    renderGrid(level); // Build Grid Preview
}

// Function: Wire up hints
export function wireHints(level) {
    const btn = document.querySelector(elements);
    if (!btn) return; // No hint button, skip

    const hintts = level?.ui?.hints ?? [];
    btn.disabled = hintts.length === 0; // Disable if no hints

    let hintIndex = 0;

    btn.onclick = () => {
        if (!hints.length) return;
        alert(hints[hintIndex % hints.length]); // Show current hint
        hintIndex++;
    };
}