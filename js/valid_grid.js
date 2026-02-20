// valid_grid.js
// Handles the validation of user CSS input against level target base on output-based validation (geometry), allows multiples correct answers

// Validation Settings
const DEFAULT_VALIDATION = {
    type: "overlapEntity",
    minOverlapRatio: 0.98,
    tolerancePx: 2
};

// Function: Calculate the area of a DOMRect
function area(r) {
    return Math.max(0, r.width) * Math.max(0, r.height);
}

// Function: Calculate the intersection area of two DOMRects
function intersectionArea(a, b) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
}

// Function: Calculate the Intersection over Union (IoU) of two DOMRects
function toRelativeRect(rect, containerRect) {
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    const right = rect.right - containerRect.left;
    const bottom = rect.bottom - containerRect.top;
    return { left, right, top, bottom, width: right - left, height: bottom - top };
}

// Function: Expand a DOMRect by a certain number of pixels in all directions
function expandRect(r, px) {
    return {
        left: r.left - px,
        top: r.top - px,
        right: r.right + px,
        bottom: r.bottom + px,
        width: r.width + px * 2,
        height: r.height + px * 2
    };
}

// Function: Validate the user's CSS input against the level's target using output-based validation (geometry)
export function validateLevel(level) {
    // Validation Variables
    const gridEl = document.querySelector(".grid");
    const win = {
        ...DEFAULT_VALIDATION,
        ...(level?.winCondition || {})
    };

    // Missing Grid Section
    if (!gridEl) {
        return {
            ok: false,
            code: "MISSING_GRID",
            title: "Grid not found",
            messages: ["The .grid element is missing from the page."]
        };
    }

    // Entite Varibles
    const playerEl = gridEl.querySelector(`[data-entity-id="${win.movingEntityId}"]`);
    const targetEl = gridEl.querySelector(`[data-entity-id="${win.targetEntityId}"]`);

    // Missing Entite Varibles
    if (!playerEl || !targetEl) {
        return {
            ok: false,
            code: "MISSING_ELEMENTS",
            title: "Level setup issue",
            messages: [
                !playerEl ? `Missing moving entity: ${win.movingEntityId}` : null,
                !targetEl ? `Missing target entity: ${win.targetEntityId}` : null
            ].filter(Boolean)
        };
    }

    // Get bounding rects relative to grid container
    const containerRect = gridEl.getBoundingClientRect();
    const movingRect = toRelativeRect(playerEl.getBoundingClientRect(), containerRect);
    const targetRectRaw = toRelativeRect(targetEl.getBoundingClientRect(), containerRect);

    // Validation Settings
    const tolerancePx = Number(win.tolerancePx);
    const minOverlapRatio = Number(win.minOverlapRatio);

    // Expand target rect by tolerance for hit testing
    const targetRectForHitTest = expandRect(targetRectRaw, tolerancePx);
    const interA = intersectionArea(movingRect, targetRectForHitTest);
    const hasContact = interA > 0;

    // Areas for coverage and spill calculations
    const targetA = area(targetRectRaw);
    const movingA = area(movingRect);

    const coverage = targetA > 0 ? interA / targetA : 0; // How much of target is covered?
    const spillSafe = movingA > 0 ? interA / movingA : 0; // How much of moving element lies on target?

    const ok = coverage >= minOverlapRatio && spillSafe >= minOverlapRatio;

    // Valid Message
    if (ok) {
        return {
            ok: true,
            code: "OK",
            title: "Correct!",
            messages: ["Perfect placement — level completed."],
            hasContact
        };
    }

    const notCoveringEnough = coverage < minOverlapRatio;
    const coveringTooMuch = spillSafe < minOverlapRatio;

    // Default Error Message
    let title = "Try again";
    let messages = ["Adjust the vehicle placement and try again."];

    // Check if the user is not covering enough of the target
    if (notCoveringEnough && !coveringTooMuch) {
        title = "Not covering enough";
        messages = ["You’re not covering enough of the target space."];
        // Check if the user is covering too much of the target
    } else if (coveringTooMuch && !notCoveringEnough) {
        title = "Covering too much";
        messages = ["Too much of the vehicle is spilling outside the target."];
        // Check if the user is both not covering enough and covering too much
    } else if (notCoveringEnough && coveringTooMuch) {
        title = "Try again";
        messages = ["Adjust the vehicle placement and try again."];
    }

    // Error Message
    return {
        ok: false,
        code: "NOT_CORRECT",
        title,
        messages,
        hasContact,
        debug: { coverage, spillSafe, minOverlapRatio, tolerancePx }
    };
}