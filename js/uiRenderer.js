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

        // Position non-player entities based on initial layout
        const pos = entity.id ? initialLayout[entity.id] : null;
        const isPlayer = entity.type === "player" || entity.id === "car";

        // Not PLayer Entities get Fix Grid Placement
        if (!isPlayer) {
            if (pos?.gridColumn) el.style.gridColumn = pos.gridColumn;
            if (pos?.gridRow) el.style.gridRow = pos.gridRow;
        }

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

    setupLivePreview(); // Setup live CSS preview
}

// Function: Wire up hints
export function wireHints(level) {
    const btn = document.getElementById("hint");
    const hintPanel = document.getElementById("hintPanel");
    const hintText = document.getElementById("hintText");

    if (!btn || !hintPanel || !hintText) return;

    const hints = level?.ui?.hints ?? [];

    // Disable button if no hints
    btn.disabled = hints.length === 0;

    let hintIndex = 0;

    // Reset panel on level load
    hintPanel.classList.add("hidden");
    hintText.textContent = "";

    // Show hints on button click
    btn.onclick = () => {
        if (!hints.length) return;

        // Show current hint
        hintText.textContent = `Hint ${hintIndex + 1} of ${hints.length}: ${hints[hintIndex]}`;

        hintPanel.classList.remove("hidden");

        // Move to next hint (but stop at last one)
        if (hintIndex < hints.length - 1) {
            hintIndex++;
        }
    };
}

// Function: Apply CSS From User Input
function applyCSS(css) {
    // Find existing style tag or create a new one
    let styleTag = document.getElementById("userStyles");

    // Create style tag if it doesn't exist
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "userStyles";
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
}

// Function: Setup live CSS preview
function setupLivePreview() {
    // Get the CSS input element
    const input = must(selectors.cssInput);

    // Apply initial contents on load
    applyCSS(input.value);

    // Apply on every keystroke
    input.addEventListener("input", () => {
        applyCSS(input.value);
    });
}