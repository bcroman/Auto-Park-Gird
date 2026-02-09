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

// Function: Wire reset button to reset the level
function wireReset(getCurrentLevel) {
    const resetBtn = document.querySelector("#reset");
    if (!resetBtn) return;

    resetBtn.onclick = () => {
        const level = getCurrentLevel();
        renderLevel(level);
        wireHints(level);
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
        renderLevel(firstLevel);
        wireHints(firstLevel);

        // Wire UI controls
        wireReset(getCurrentLevel);
        wireCheck();

        // Debug access in DevTools
        window.__GAME__ = { levels, state, renderLevel };
    } catch (err) {
        console.error(err);
        alert(`Failed to start game: ${err.message}`);
    }
});