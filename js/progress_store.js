// progress_store.js
// Persists level unlock progress using localStorage.

// Prefix for all saved progress keys
const STORAGE_PREFIX = "apg.progress";

// Function: Build the storage key
function storageKey(gameId) {
    const safeId = gameId || "default";
    return `${STORAGE_PREFIX}.${safeId}`;
}

// Function: Safely parse JSON without crashing
function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// Function: Ensure unlocked IDs are valid and at least the first level is unlocked
function normalizeUnlockedIds(levels, unlockedIds) {
    const levelIds = new Set(levels.map(level => level?.id ?? level?.title ?? ""));
    const filtered = (unlockedIds || []).filter(id => levelIds.has(id));

    // If no valid unlocked IDs, default to unlocking the first level
    if (filtered.length === 0 && levels.length > 0) {
        const firstId = levels[0]?.id ?? levels[0]?.title ?? "";
        if (firstId) filtered.push(firstId);
    }

    return filtered;
}

// Function: Convert unlocked IDs to the highest unlocked index
function unlockedIdsToHighestIndex(levels, unlockedIds) {
    let highest = 0;

    // Find the highest index of the unlocked levels
    unlockedIds.forEach(id => {
        const idx = levels.findIndex(level => (level?.id ?? level?.title ?? "") === id);
        if (idx > highest) highest = idx;
    });

    return highest;
}

// Function: Load saved progress from localStorage
export function loadProgress(levels, gameId) {
    // Validate levels input
    if (!Array.isArray(levels) || levels.length === 0) {
        return { unlockedIds: [], highestUnlockedIndex: 0, completedCount: 0 };
    }

    const key = storageKey(gameId);

    // Try to load and parse progress
    try {
        const raw = localStorage.getItem(key);
        const data = raw ? safeParse(raw) : null;
        const unlockedIds = normalizeUnlockedIds(levels, data?.unlockedIds);
        const highestUnlockedIndex = unlockedIdsToHighestIndex(levels, unlockedIds);

        const parsedCompleted = Number(data?.completedCount);
        const completedCount = Number.isFinite(parsedCompleted)
            ? Math.max(0, Math.min(parsedCompleted, levels.length))
            : Math.max(0, Math.min(highestUnlockedIndex, levels.length));

        return {
            unlockedIds,
            highestUnlockedIndex,
            completedCount
        };
    } catch {
        // On error, default to unlocking the first level
        const firstId = levels[0]?.id ?? levels[0]?.title ?? "";
        return {
            unlockedIds: firstId ? [firstId] : [],
            highestUnlockedIndex: 0,
            completedCount: 0
        };
    }
}

// Function: Save progress to localStorage
export function saveProgress(levels, highestUnlockedIndex, gameId, completedCount) {
    if (!Array.isArray(levels) || levels.length === 0) return;

    const key = storageKey(gameId);
    const capIndex = Math.max(0, Math.min(highestUnlockedIndex, levels.length - 1));

    // Get the IDs of all unlocked levels up to the highest index
    const unlockedIds = levels
        .slice(0, capIndex + 1)
        .map(level => level?.id ?? level?.title ?? "")
        .filter(Boolean);

    // Create the payload to save
    const payload = {
        unlockedIds,
        completedCount: Math.max(0, Math.min(Number(completedCount) || 0, levels.length)),
        updatedAt: new Date().toISOString()
    };

    try {
        // Save the progress as a JSON string in localStorage
        localStorage.setItem(key, JSON.stringify(payload));
    } catch {
        // Error saving progress message
        console.warn("Failed to save progress:", key);
    }
}
