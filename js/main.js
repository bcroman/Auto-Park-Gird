// Main.js
// Handles the main game logic and initialization

// Import Files and Functions
import { loadAllLevelPacks } from "./level_loader.js";
import { renderLevel, wireHints } from "./ui_renderer.js";
import { clearFeedback } from "./ui_feedback.js";
import { loadProgress, saveProgress } from "./progress_store.js";

const STORAGE_PREFIX = "apg.progress.";
const ACHIEVEMENT_FLASH_DURATION_MS = 5000;
let achievementFlashTimer = null;

// Function: Keep game page anchored to top on load
function ensureStartAtTop() {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    scrollTop();
    requestAnimationFrame(scrollTop);
}

// Function: Initialize the game
function clamp(index, length) {
    if (length <= 0) return 0;
    return Math.max(0, Math.min(index, length - 1));
}

// Function: Build a stable key per level
function levelKey(level) {
    return level?.id ?? level?.title ?? "";
}

// Function: Get achievement flash elements
function getAchievementElements() {
    const flash = document.querySelector("#achievementFlash");
    const percentText = document.querySelector("#achievementPercent");

    if (!flash || !percentText) return null;
    return { flash, percentText };
}

// Function: Hide achievement flash
function hideAchievementFlash() {
    const elements = getAchievementElements();
    if (!elements) return;

    elements.flash.classList.add("hidden");
    elements.flash.setAttribute("aria-hidden", "true");
}

// Function: Get pack transition popup elements
function getPackTransitionElements() {
    const panel = document.querySelector("#packTransition");
    const titleEl = document.querySelector("#packTransitionTitle");
    const messageEl = document.querySelector("#packTransitionMessage");
    const closeBtn = document.querySelector("#packTransitionClose");

    if (!panel || !titleEl || !messageEl || !closeBtn) return null;
    return { panel, titleEl, messageEl, closeBtn };
}

// Function: Hide pack transition popup
function hidePackTransition() {
    const elements = getPackTransitionElements();
    if (!elements) return;

    elements.panel.classList.add("hidden");
    elements.panel.setAttribute("aria-hidden", "true");
}

// Function: Show pack transition popup until player closes it
function showPackTransition(topic, message) {
    const elements = getPackTransitionElements();
    if (!elements || !topic || !message) return;

    elements.titleEl.textContent = `Achievement: ${topic}`;
    elements.messageEl.textContent = message;
    elements.panel.classList.remove("hidden");
    elements.panel.setAttribute("aria-hidden", "false");
}

// Function: Build pack index ranges from loaded packs
function buildPackRanges(packs = []) {
    const ranges = [];
    let start = 0;

    for (const pack of packs) {
        const count = Array.isArray(pack?.levels) ? pack.levels.length : 0;
        if (count <= 0) continue;

        ranges.push({
            start,
            end: start + count - 1,
            source: String(pack?.source || "")
        });

        start += count;
    }

    return ranges;
}

// Function: Resolve pack index from flattened level index
function getPackIndexForLevel(levelIndex, packRanges = []) {
    for (let i = 0; i < packRanges.length; i++) {
        const range = packRanges[i];
        if (levelIndex >= range.start && levelIndex <= range.end) {
            return i;
        }
    }

    return -1;
}

// Function: Build a stable transition key for first-time pack popup display
function getPackTransitionKey(destinationPack = {}) {
    const source = String(destinationPack?.source || "").trim().toLowerCase();
    if (!source) return "";
    return `pack:${source}`;
}

// Function: Provide transition message based on destination pack
function getPackTransitionMessage(destinationPack = {}) {
    const source = String(destinationPack?.source || "").toLowerCase();

    // Customize messages based on pack source
    if (source.includes("pack-tracks")) {
        return "So far you've been placing items in the grid. Now let's control the size of the grid itself using grid tracks.";
    }
    if (source.includes("pack-gaps")) {
        return "Great work with grid tracks! Now let's add some space between those tracks using gaps.";
    }
    if (source.includes("pack-alignment")) {
        return "Looking good! Now let's align items within the grid and control how they stretch.";
    }
    if (source.includes("pack-implicit-explicit")) {
        return "Awesome! So far you've been working with an explicit grid. Now let's explore how the grid can grow implicitly as you place items.";
    }
    if (source.includes("pack-auto-fill-fit")) {
        return "Great job! Now let's master the powerful auto-fill and auto-fit features to create dynamic grids that adapt to their content.";
    }

    return "Great work. Next levels unlocks a new grid concept."; // Default message for unknown packs
}

// Function: Map pack source path to player-facing topic title
function getPackTopic(destinationPack = {}) {
    const source = String(destinationPack?.source || "").toLowerCase();

    // Customize topics based on pack source
    if (source.includes("pack-spanning")) return "Spanning";
    if (source.includes("pack-tracks")) return "Tracks";
    if (source.includes("pack-gaps")) return "Gaps";
    if (source.includes("pack-alignment")) return "Alignment";
    if (source.includes("pack-implicit-explicit")) return "Implicit vs Explicit";
    if (source.includes("pack-auto-fill-fit")) return "Auto-Fill and Auto-Fit";

    return "New Topic";
}

// Function: Wire popup close interaction
function wirePackTransitionClose() {
    const elements = getPackTransitionElements();
    if (!elements) return;

    elements.closeBtn.onclick = () => {
        hidePackTransition();
    };
}

// Function: Show achievement flash for 100% completion
function showAchievementFlash(levels, state) {
    const elements = getAchievementElements();
    if (!elements || !levels.length) return;

    const completedCount = Math.max(0, Math.min(levels.length, state.completedCount ?? 0));
    const percent = Math.round((completedCount / levels.length) * 100);

    if (percent < 100) return;

    elements.percentText.textContent = `Progress: ${percent}%`;
    elements.flash.classList.remove("hidden");
    elements.flash.setAttribute("aria-hidden", "false");

    if (achievementFlashTimer) {
        clearTimeout(achievementFlashTimer);
    }

    achievementFlashTimer = setTimeout(() => {
        hideAchievementFlash();
    }, ACHIEVEMENT_FLASH_DURATION_MS);
}

// Function: Reset all progress, lock levels, and return to level 1
function resetAllProgress(levels, state, packRanges) {
    // Clear saved progress from localStorage
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${state.gameId || "default"}`);
    } catch {
        console.warn("Failed to clear saved progress.");
    }

    state.highestUnlockedIndex = 0;
    state.completedCount = 0;
    state.index = 0;
    state.seenPackTransitions = [];

    saveProgress(
        levels,
        state.highestUnlockedIndex,
        state.gameId,
        state.completedCount,
        state.seenPackTransitions
    );

    hideAchievementFlash();
    hidePackTransition();
    renderCurrent(levels, state, { previousIndex: state.index, packRanges });
    clearFeedback();
}

// Function: Update navigation state (including lock/unlock state for next button)
function updateNavigationButtons(levels, state) {
    const prevBtn = document.querySelector("#prev");
    const nextBtn = document.querySelector("#next");
    const levelTxt = document.querySelector("#levelTxt");

    const atStart = state.index <= 0;
    const atEnd = state.index >= levels.length - 1;
    const nextUnlocked = state.index < state.highestUnlockedIndex;

    // Disable Previous Button if at the start
    if (prevBtn) prevBtn.disabled = atStart;

    if (levelTxt) {
        levelTxt.textContent = `Level ${state.index + 1}`;
    }

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

// Function: Update the level progress bar and text
function updateProgressUI(levels, state) {
    const progressText = document.querySelector("#progressText");
    const progressFill = document.querySelector("#progressFill");
    const progressTrack = document.querySelector(".progress-track");

    if (!progressText || !progressFill || !progressTrack || !levels.length) return;

    // Calculate completed count and percentage
    const completedCount = Math.max(0, Math.min(levels.length, state.completedCount ?? 0));
    const percent = Math.round((completedCount / levels.length) * 100);

    // Update progress text and bar
    progressText.textContent = `Progress: ${completedCount}/${levels.length} (${percent}%)`;
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
}

// Function: Render the current level based on the state index
function renderCurrent(levels, state, options = {}) {
    const previousIndex = Number.isInteger(options.previousIndex) ? options.previousIndex : state.index;
    const packRanges = Array.isArray(options.packRanges) ? options.packRanges : [];

    const level = levels[clamp(state.index, levels.length)];
    renderLevel(level);
    wireHints(level);
    updateNavigationButtons(levels, state);
    updateProgressUI(levels, state);

    const prevPackIndex = getPackIndexForLevel(clamp(previousIndex, levels.length), packRanges);
    const currentPackIndex = getPackIndexForLevel(clamp(state.index, levels.length), packRanges);
    const movedBetweenPacks = prevPackIndex !== -1 && currentPackIndex !== -1 && prevPackIndex !== currentPackIndex;

    if (movedBetweenPacks) {
        const completedPack = packRanges[prevPackIndex];
        const destinationPack = packRanges[currentPackIndex];
        const transitionKey = getPackTransitionKey(destinationPack);
        const seenTransitions = Array.isArray(state.seenPackTransitions) ? state.seenPackTransitions : [];
        const hasSeenTransition = transitionKey && seenTransitions.includes(transitionKey);

        if (!hasSeenTransition) {
            const topic = getPackTopic(completedPack);
            const message = getPackTransitionMessage(destinationPack);
            showPackTransition(topic, message);

            if (transitionKey) {
                state.seenPackTransitions = [...seenTransitions, transitionKey];
                saveProgress(
                    levels,
                    state.highestUnlockedIndex,
                    state.gameId,
                    state.completedCount,
                    state.seenPackTransitions
                );
            }
        }
    }
}

// Function: Wire reset button to reset the level
function wireReset(levels, state, packRanges) {
    const resetBtn = document.querySelector("#reset");
    if (!resetBtn) return;

    resetBtn.onclick = () => {
        renderCurrent(levels, state, { previousIndex: state.index, packRanges });
        clearFeedback();
    };
}

// Function: Wire the Previous and Next buttons to navigate levels
function wirePrevNext(levels, state, packRanges) {
    const prevBtn = document.querySelector("#prev");
    const nextBtn = document.querySelector("#next");

    // Previous Button Click Handler
    if (prevBtn) {
        prevBtn.onclick = () => {
            const previousIndex = state.index;
            state.index = clamp(state.index - 1, levels.length);
            renderCurrent(levels, state, { previousIndex, packRanges });
            ensureStartAtTop();
            clearFeedback();
        };
    }

    // Next Button Click Handler
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (nextBtn.disabled) return;
            const previousIndex = state.index;
            state.index = clamp(state.index + 1, levels.length);
            renderCurrent(levels, state, { previousIndex, packRanges });
            ensureStartAtTop();
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
        const wasComplete = (state.completedCount ?? 0) >= levels.length;

        // Only unlock next level if validation is successful and for the current level
        if (!detail.ok || detail.levelKey !== currentKey) {
            return;
        }

        // Unlock the next level
        const unlockedUpTo = Math.min(levels.length - 1, state.index + 1);
        state.highestUnlockedIndex = Math.max(state.highestUnlockedIndex, unlockedUpTo);
        state.completedCount = Math.max(state.completedCount, state.index + 1);

        saveProgress(
            levels,
            state.highestUnlockedIndex,
            state.gameId,
            state.completedCount,
            state.seenPackTransitions
        );
        updateNavigationButtons(levels, state);
        updateProgressUI(levels, state);

        const isComplete = (state.completedCount ?? 0) >= levels.length;
        if (!wasComplete && isComplete) {
            showAchievementFlash(levels, state);
        }
    });
}

// Function: Wire reset progress button to clear saved progress and return to level 1
function wireResetProgress(levels, state, packRanges) {
    const btn = document.querySelector("#resetProgress");
    const flashBtn = document.querySelector("#achievementResetProgress");

    const handleReset = () => {
        const shouldReset = window.confirm("Reset all progress? This will lock levels again and return to Level 1.");
        if (!shouldReset) return;
        resetAllProgress(levels, state, packRanges);
    };

    if (btn) btn.onclick = handleReset;
    if (flashBtn) flashBtn.onclick = handleReset;
}

// Update the DOM once it's fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    ensureStartAtTop();

    try {
        const packsURLs = [ // List of Level Packs
            new URL("levels/pack-spanning.json", import.meta.url).href,
            new URL("levels/pack-tracks.json", import.meta.url).href,
            new URL("levels/pack-gaps.json", import.meta.url).href,
            new URL("levels/pack-alignment.json", import.meta.url).href,
            new URL("levels/pack-implicit-explicit.json", import.meta.url).href,
            new URL("levels/pack-auto-fill-fit.json", import.meta.url).href
        ];

        // Load all level packs
        const { levels, packs } = await loadAllLevelPacks(packsURLs);
        if (!levels.length) { //Error handling for no levels found
            throw new Error("No levels found!");
        }

        const packRanges = buildPackRanges(packs);

        // Determine game ID for progress storage
        const gameId = packs?.[0]?.meta?.gameId || "css-grid-tool";
        const progress = loadProgress(levels, gameId); // Load progress from localStorage
        const startIndex = clamp(progress.highestUnlockedIndex ?? 0, levels.length);

        // Initialize game state
        const state = {
            index: startIndex,
            highestUnlockedIndex: progress.highestUnlockedIndex,
            completedCount: progress.completedCount,
            seenPackTransitions: progress.seenPackTransitions || [],
            gameId
        };

        // Initial render
        renderCurrent(levels, state, { previousIndex: state.index, packRanges });

        // Wire UI controls
        wirePrevNext(levels, state, packRanges);
        wireReset(levels, state, packRanges);
        wireResetProgress(levels, state, packRanges);
        wireLevelUnlocking(levels, state);
        wirePackTransitionClose();

        if ((state.completedCount ?? 0) >= levels.length) {
            showAchievementFlash(levels, state);
        }

        // Debug access in DevTools
        window.__GAME__ = { levels, packs, state, renderLevel };
    } catch (err) {
        console.error(err);
        alert(`Failed to start game: ${err.message}`);
    }
});

window.addEventListener("pageshow", () => {
    ensureStartAtTop();
});
