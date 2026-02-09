//Level Loader.js
// Handles Loading and storing into an array

export async function loadLevelPack(url) {
    // Fetch the level pack JSON file
    const response = await fetch(url);

    // Check if the response is successful
    if (!response.ok) {
        throw new Error(`Failed to load level pack: ${response.statusText}`);
    }

    // Cobvert the response to JSON Object
    const json = await response.json();

    // Ensure the levels is always an array
    const levels = Array.isArray(json.levels) ? json.levels : [];

    // Return the levels array
    return {
        meta: json.meta || {},
        levels,
        source: url
    };
}

// Load Multiple Level Packs & Merge
export async function loadAllLevelPacks(urls = []) {
    // Load all level packs concurrently
    const packs = await Promise.all(urls.map(loadLevelPack));

    // Merge all levels into a single array
    const allLevels = packs.flatMap(pack => pack.levels);

    // Resturn the merge array 
    return {
        packs,
        levels: allLevels
    };
}