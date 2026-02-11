// Validation.js
// Handles the validation of user CSS input against level target base on output-based validation (geometry), allows multiples correct answers

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

    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    return { left, right, top, bottom, width, height };
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
    // Check for Elements 
}


