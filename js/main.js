// Main.js
// Handles the main game logic and initialization

//Import Functions
import { loadAllLevelPacks } from "./levelLoader.js";
import { renderLevel, wireHints } from "./uiRenderer.js";

// Function: Initialize the game
function clamp(index, length) {
    if (length <= 0) return 0;
    return Math.max(0, Math.min(index, length - 1));
}

// Function: Render the current level based on the state index
function renderCurrent(levels, state) {
  const level = levels[clamp(state.index, levels.length)];
  renderLevel(level);
  wireHints(level);

  // Disable prev/next when at ends of level list
  const prevBtn = document.querySelector("#prev");
  const nextBtn = document.querySelector("#next");
  if (prevBtn) prevBtn.disabled = state.index <= 0;
  if (nextBtn) nextBtn.disabled = state.index >= levels.length - 1;
}

// Function: Wire reset button to reset the level
function wireReset(levels, state) {
    const resetBtn = document.querySelector("#reset");
    if (!resetBtn) return;

    resetBtn.onclick = () => {
        renderCurrent(levels, state);
    };
}

// Function: Wire the Check Button
function wireCheck() {
    const checkBtn = document.querySelector("#check");
    if (!checkBtn) return;

    checkBtn.onclick = () => {
        alert("Check functionality is not implemented yet.");
    };
}

// Function: Wire the Previous and Next buttons to navigate levels
function wirePrevNext(levels, state) {
    const prevBtn = document.querySelector("#prev");
    const nextBtn = document.querySelector("#next");

    // Previous Button Click Handler
    if (prevBtn) {
        prevBtn.onclick = () => {
            state.index = clamp(state.index - 1, levels.length);
            renderCurrent(levels, state);
        };
    }

    // Next Button Click Handler
    if (nextBtn) {
        nextBtn.onclick = () => {
            state.index = clamp(state.index + 1, levels.length);
            renderCurrent(levels, state);
        };
    }
}

// Update the DOM once it's fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const packsURLs = [ // List of Level Packs
            new URL("levels.json", import.meta.url).href
        ];

        // Load all level packs
        const { levels } = await loadAllLevelPacks(packsURLs);
        if (!levels.length) { //Error handling for no levels found
            throw new Error("No levels founds!");
        };

        const state = { index: 0 };

        // Get Current Level based on the state index 
        const getCurrentLevel = () =>
            levels[clamp(state.index, levels.length)];

        // Initial render
        const firstLevel = getCurrentLevel();
        renderCurrent(levels, state);

        // Wire UI controls
        wireCheck();
        wirePrevNext(levels, state);
        wireReset(levels, state);

        // Debug access in DevTools
        window.__GAME__ = { levels, state, renderLevel };
    } catch (err) {
        console.error(err);
        alert(`Failed to start game: ${err.message}`);
    }
});