// Validation.js
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
    const playerEl = gridEl.querySelector(`[data-entity-id="${win.movingEntityId}"]`);
    const targetEl = gridEl.querySelector(`[data-entity-id="${win.targetEntityId}"]`);

    // Basic Validation Checks
    if (!gridEl) {
        console.log("Grid element not found!");
        return false;
    }
    if (!win) {
        console.log("No winCondition Found!");
        return false;
    }
    if (win.type !== "overlapEntity") {
        console.log("Unsupported winCondition type:", win.type);
        return false;
    }
    if (!playerEl) {
        console.log("Player element not found:", win.movingEntityId);
        return false;
    }
    if (!targetEl) {
        console.log("Target element not found:", win.targetEntityId);
        return false;
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

    // Areas for coverage and spill calculations
    const targetA = area(targetRectRaw);
    const movingA = area(movingRect);

    const coverage = targetA > 0 ? interA / targetA : 0; // How much of target is covered?
    const spillSafe = movingA > 0 ? interA / movingA : 0; // How much of moving element lies on target?

    // Debug Logs
    console.log("⚙️ Settings:", { tolerancePx, minOverlapRatio });
    console.log("📐 Results:", { interA, targetA, movingA, coverage, spillSafe });

    const ok = coverage >= minOverlapRatio && spillSafe >= minOverlapRatio;

    return ok;
}

// Function: Provide Level Validation Feedback
export function provideFeedback(isValid) {
    alert(isValid
        ? "Correct Answer!, Level Completed."
        : "Not correct!, Check the hints and try again."
    );
}