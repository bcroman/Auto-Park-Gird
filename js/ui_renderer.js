//ui_renderer.js
// Handles updating game UI from level data.

// Import Files and Functions
import { validateCSS } from "./valid_css.js";
import { validateLevel } from "./valid_grid.js";
import { clearFeedback, showCssErrors, showFeedback } from "./ui_feedback.js";

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

const DEFAULT_GRID_SIZE = 7;

// Helper: Check for game page elements
function must(selectors) {
    const el = document.querySelector(selectors);
    if (!el) {
        console.error(`Element ${selectors} not found!`);
        throw new Error(`Element ${selectors} not found!`);
    }
    return el;
}

// Helper: Count track sizes in a computed grid-template-* string
function countTracks(trackList) {
    if (!trackList || trackList === "none") return 0;

    let depth = 0;
    let inToken = false;
    let count = 0;

    // Loop through each character to count tracks while ignoring nested functions
    for (const ch of trackList) {
        if (ch === "(") depth++;
        if (ch === ")") depth = Math.max(0, depth - 1);

        // Check for space outside of nested functions
        const isSpace = /\s/.test(ch);
        if (isSpace && depth === 0) {
            if (inToken) {
                count++;
                inToken = false;
            }
            continue;
        }

        inToken = true;
    }

    if (inToken) count++;
    return count;
}

// Helper: Keep visual parking surface matched to actual computed grid tracks
function syncGridSurface(gridEl, fallbackColumns = 7, fallbackRows = 7) {
    const bgLayer = gridEl.querySelector(".grid-surface");
    if (!bgLayer) return;

    // Get computed styles to determine actual grid layout
    const styles = getComputedStyle(gridEl);
    const templateColumns = styles.gridTemplateColumns;
    const templateRows = styles.gridTemplateRows;
    const gap = styles.gap;

    // Apply grid layout to background layer
    bgLayer.style.gridTemplateColumns = templateColumns;
    bgLayer.style.gridTemplateRows = templateRows;
    bgLayer.style.gap = gap;

    // Count tracks to determine how many background cells are needed
    let columns = countTracks(templateColumns);
    let rows = countTracks(templateRows);

    // Fallback to default if counting fails
    if (columns <= 0) columns = fallbackColumns;
    if (rows <= 0) rows = fallbackRows;

    // Determine total number of background cells needed
    const totalCells = Math.min(900, columns * rows);
    const currentCells = bgLayer.children.length;

    // Add or remove background cells to match total needed
    if (currentCells < totalCells) {
        for (let i = currentCells; i < totalCells; i++) {
            const bgCell = document.createElement("div");
            bgCell.className = "grid-cell";
            bgLayer.appendChild(bgCell);
        }
        // Remove excess cells if grid shrinks
    } else if (currentCells > totalCells) {
        for (let i = currentCells - 1; i >= totalCells; i--) {
            bgLayer.children[i].remove();
        }
    }
}

// Helper: Enforce minimum grid size for learning tasks
function getGridSizeError(gridEl, minColumns = 5, minRows = 5) {
    const styles = getComputedStyle(gridEl);
    const columns = countTracks(styles.gridTemplateColumns);
    const rows = countTracks(styles.gridTemplateRows);

    // Check if grid meets minimum size requirements
    if (columns < minColumns || rows < minRows) {
        return `Grid is too small (${columns} x ${rows}). Use at least ${minColumns} x ${minRows}.`;
    }

    return null;
}

// Helper: Reset preview grid to a safe default size
function resetGridToDefault(gridEl) {
    gridEl.style.gridTemplateColumns = "";
    gridEl.style.gridTemplateRows = "";
    gridEl.style.setProperty("--level-grid-columns", `repeat(${DEFAULT_GRID_SIZE}, 60px)`);
    gridEl.style.setProperty("--level-grid-rows", `repeat(${DEFAULT_GRID_SIZE}, 60px)`);
    syncGridSurface(gridEl, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE);
}

// Function: Render grid from level data
export function renderGrid(level) {
    const gridEl = must(selectors.grid);

    gridEl.innerHTML = ""; // Clear existing grid

    // Default to 7x7 grid 
    const columns = Number(level?.grid?.columns) || 7;
    const rows = Number(level?.grid?.rows) || 7;
    gridEl.style.gridTemplateColumns = "";
    gridEl.style.gridTemplateRows = "";
    gridEl.style.setProperty("--level-grid-columns", `repeat(${columns}, 60px)`);
    gridEl.style.setProperty("--level-grid-rows", `repeat(${rows}, 60px)`);

    // Add visual-only background layer (does not affect item placement)
    const bgLayer = document.createElement("div");
    bgLayer.className = "grid-surface";
    bgLayer.setAttribute("aria-hidden", "true");

    gridEl.appendChild(bgLayer);

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

        // Not Player Entities get Fix Grid Placement
        if (!isPlayer) {
            if (pos?.gridColumn) el.style.gridColumn = pos.gridColumn;
            if (pos?.gridRow) el.style.gridRow = pos.gridRow;
        }

        gridEl.appendChild(el);
    }

    syncGridSurface(gridEl, columns, rows);
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

    setupLivePreview(level); // Setup live CSS preview
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
    btn.textContent = hints.length === 0 ? "No Hints" : "Show Hint";

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
            btn.textContent = "Show Next Hint";
            return;
        }

        btn.textContent = "No More Hints";
        btn.disabled = true;
    };
}

// Function: Apply CSS From User Input
function applyCSS(css, level) {
    // Validate CSS first
    const validation = validateCSS(css);

    const feedbackEl = document.querySelector("#feedback");
    const errorEl = document.querySelector("#error");
    const listEl = document.querySelector("#feedbackList");
    const gridEl = must(selectors.grid);

    // If CSS is invalid, show errors and don't apply
    if (!validation.valid) {
        const existingStyleTag = document.getElementById("userStyles");
        if (existingStyleTag) existingStyleTag.textContent = "";
        resetGridToDefault(gridEl);

        if (feedbackEl && errorEl && listEl) {
            showCssErrors(validation.errors);
        } else {
            console.warn("CSS Validation Error:", validation.errors);
        }
        // Don't apply invalid CSS
        return;
    }

    // Find existing style tag or create a new one
    let styleTag = document.getElementById("userStyles");

    // Create style tag if it doesn't exist
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "userStyles";
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;

    // Sync grid surface to match any changes in grid layout from CSS
    syncGridSurface(gridEl);

    // Check for grid size issues and show feedback if too small
    const gridSizeError = getGridSizeError(gridEl, 5, 5);
    if (gridSizeError) {
        styleTag.textContent = "";
        resetGridToDefault(gridEl);
        showCssErrors([gridSizeError]);
        return;
    }

    // Validate level automatically after applying valid CSS
    if (level) {
        const result = validateLevel(level);
        const levelKey = level?.id ?? level?.title ?? "";

        // Dispatch custom event with validation result and level key
        window.dispatchEvent(new CustomEvent("level-validation", {
            detail: {
                ok: result.ok,
                levelKey
            }
        }));

        // Only show grid validation feedback after player first overlaps target area
        if (result.ok || result.hasContact) {
            showFeedback(result);
        } else {
            clearFeedback();
        }
    }
}

// Function: Setup live CSS preview
function setupLivePreview(level) {
    // Get the CSS input element
    const input = must(selectors.cssInput);

    // Apply initial contents on load
    applyCSS(input.value, level);

    // Apply on every keystroke
    input.oninput = () => {
        applyCSS(input.value, level);
    };
}