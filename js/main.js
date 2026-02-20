// Main.js
// Handles the main game logic and initialization

// Import Files and Functions
import { loadAllLevelPacks } from "./level_loader.js";
import { renderLevel, wireHints } from "./ui_renderer.js";
import { clearFeedback } from "./ui_feedback.js";
import { loadProgress, saveProgress } from "./progress_store.js";

// Function: Initialize the game
function clamp(index, length) {
    if (length <= 0) return 0;
    return Math.max(0, Math.min(index, length - 1));
}

// Function: Build a stable key per level
function levelKey(level) {
    return level?.id ?? level?.title ?? "";
}

// Function: Update navigation state (including lock/unlock state for next button)
function updateNavigationButtons(levels, state) {
    const prevBtn = document.querySelector("#prev");
    const nextBtn = document.querySelector("#next");

    const atStart = state.index <= 0;
    const atEnd = state.index >= levels.length - 1;
    const nextUnlocked = state.index < state.highestUnlockedIndex;

    // Disable Previous Button if at the start
    if (prevBtn) prevBtn.disabled = atStart;

    // Disable Next Button if at the end or next level is locked
    if (nextBtn) {
        nextBtn.disabled = atEnd || !nextUnlocked;

        nextBtn.classList.toggle("next-locked", !atEnd && !nextUnlocked);
        nextBtn.classList.toggle("next-unlocked", !atEnd && nextUnlocked);

        // Show tooltip if next level is locked
        if (!atEnd && !nextUnlocked) {
            nextBtn.title = "Complete this level to unlock the next one.";
        } else {
            nextBtn.title = "";
        }
    }
}

// Function: Render the current level based on the state index
function renderCurrent(levels, state) {
    const level = levels[clamp(state.index, levels.length)];
    renderLevel(level);
    wireHints(level);
    updateNavigationButtons(levels, state);
}

// Function: Wire reset button to reset the level
function wireReset(levels, state) {
    const resetBtn = document.querySelector("#reset");
    if (!resetBtn) return;

    resetBtn.onclick = () => {
        renderCurrent(levels, state);
        clearFeedback();
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
            clearFeedback();
        };
    }

    // Next Button Click Handler
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (nextBtn.disabled) return;
            state.index = clamp(state.index + 1, levels.length);
            renderCurrent(levels, state);
            clearFeedback();
        };
    }
}

// Function: Unlock next level when current level becomes correct
function wireLevelUnlocking(levels, state) {
    // Listen for custom "level-validation" events dispatched from validation logic
    window.addEventListener("level-validation", (event) => {
        const detail = event?.detail || {};
        const currentLevel = levels[clamp(state.index, levels.length)];
        const currentKey = levelKey(currentLevel);

        // Only unlock next level if validation is successful and for the current level
        if (!detail.ok || detail.levelKey !== currentKey) {
            return;
        }

        // Unlock the next level
        const unlockedUpTo = Math.min(levels.length - 1, state.index + 1);
        state.highestUnlockedIndex = Math.max(state.highestUnlockedIndex, unlockedUpTo);
        saveProgress(levels, state.highestUnlockedIndex, state.gameId);
        updateNavigationButtons(levels, state);
    });
}

// Update the DOM once it's fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const packsURLs = [ // List of Level Packs
            new URL("levels.json", import.meta.url).href
        ];

        // Load all level packs
        const { levels, packs } = await loadAllLevelPacks(packsURLs);
        if (!levels.length) { //Error handling for no levels found
            throw new Error("No levels founds!");
        };

        // Determine game ID for progress storage
        const gameId = packs?.[0]?.meta?.gameId || "css-grid-tool";
        const progress = loadProgress(levels, gameId); // Load progress from localStorage
        
        // Initialize game state
        const state = {
            index: 0,
            highestUnlockedIndex: progress.highestUnlockedIndex,
            gameId
        };

        // Get Current Level based on the state index 
        const getCurrentLevel = () =>
            levels[clamp(state.index, levels.length)];

        // Initial render
        renderCurrent(levels, state);

        // Wire UI controls
        wirePrevNext(levels, state);
        wireReset(levels, state);
        wireLevelUnlocking(levels, state);

        // Debug access in DevTools
        window.__GAME__ = { levels, state, renderLevel };
    } catch (err) {
        console.error(err);
        alert(`Failed to start game: ${err.message}`);
    }
});