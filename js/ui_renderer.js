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

    // Default to 7x7 grid 
    const columns = Number(level?.grid?.columns) || 7;
    const rows = Number(level?.grid?.rows) || 7;
    gridEl.style.gridTemplateColumns = "";
    gridEl.style.gridTemplateRows = "";
    gridEl.style.setProperty("--level-grid-columns", `repeat(${columns}, 60px)`);
    gridEl.style.setProperty("--level-grid-rows", `repeat(${rows}, 60px)`);

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

    // If CSS is invalid, show errors and don't apply
    if (!validation.valid) {
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