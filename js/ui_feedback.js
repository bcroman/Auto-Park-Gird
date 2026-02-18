// ui_feedback.js
// Handles displaying feedback messages

// Feedback Element Selectors
const FEEDBACK_SELECTORS = {
    feedback: "#feedback",
    success: "#success",
    error: "#error",
    list: "#feedbackList"
};

// Helper: Get feedback elements
function getFeedbackElements() {
    const feedbackEl = document.querySelector(FEEDBACK_SELECTORS.feedback);
    const successEl = document.querySelector(FEEDBACK_SELECTORS.success);
    const errorEl = document.querySelector(FEEDBACK_SELECTORS.error);
    const listEl = document.querySelector(FEEDBACK_SELECTORS.list);

    if (!feedbackEl || !successEl || !errorEl || !listEl) return null;

    return { feedbackEl, successEl, errorEl, listEl };
}

// Function: Clear Feedback Messages
export function clearFeedback() {
    const els = getFeedbackElements();
    if (!els) return;

    const { feedbackEl, successEl, errorEl, listEl } = els;

    // Hide feedback container and reset messages
    feedbackEl.style.display = "none";
    successEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    listEl.innerHTML = "";
    listEl.style.display = "none";
}

// Function: Show Feedback Messages
export function showFeedback(result) {
    const els = getFeedbackElements();

    // If feedback elements are missing, fallback to alert
    if (!els) {
        alert(result?.ok ? "Correct!" : "Try again.");
        return;
    }

    const { feedbackEl, successEl, errorEl, listEl } = els;

    // Show feedback container
    feedbackEl.style.display = "block";

    successEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    listEl.innerHTML = "";

    successEl.textContent = `✔ ${result.title || "Correct!"}`;
    errorEl.textContent = `✖ ${result.title || "Try again."}`;

    // Show Success MessaGE
    if (result.ok) {
        listEl.style.display = "none";
        successEl.classList.remove("hidden");
        return;
    }

    // Show Error Message and Details
    errorEl.classList.remove("hidden");
    listEl.style.display = "block";

    // Show list of error details
    const messages = result.messages?.length ? result.messages : [result.title || "Try again."];
    for (const msg of messages) {
        const li = document.createElement("li");
        li.textContent = msg;
        listEl.appendChild(li);
    }
}

// Function: Show CSS Validation Errors
export function showCssErrors(errors) {
    if (!errors || errors.length === 0) {
        clearFeedback();
        return;
    }

    showFeedback({
        ok: false,
        title: "CSS Validation Errors",
        messages: errors
    });
}
