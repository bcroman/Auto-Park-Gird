// valid_css.js
// Handles the user's CSS input validation and prevents breaking the website

// Allowed CSS Properties
const SAFE_PROPERTIES = new Set([
    "grid-column",
    "grid-row",
    "grid-area",
    "grid-column-start",
    "grid-column-end",
    "grid-row-start",
    "grid-row-end"
]);

// Blocked CSS Properties
const DANGEROUS_PROPERTIES = new Set([
    "position", "top", "bottom", "left", "right", "z-index",
    "display: none", "visibility", 
    "overflow", "overflow-x", "overflow-y",
    "transform", "transform-origin", "perspective", "clip", "clip-path",
    "@import", "@font-face", "@keyframes"
]);

// Blocked Selectors
const DANGEROUS_SELECTORS = [
    /^\s*\*\s*/,
    /body/i, /html/i, /main/i, /nav/i, /head/i, /script/i, /style/i,
    /textarea/i, /button/i, /input/i,
    /\.controls/i, /\.content/i, /\.instructions/i, /\.editor/i, /\.game-layout/i, /\.feedback/i,
    /#cssInput/, /#check/, /#reset/, /#hint/, /#prev/, /#next/
];

// Allowed Selectors (Whitelist)
const ALLOWED_SELECTOR_PATTERNS = [
    /^\s*\.car\s*$/,
    /^\s*\.car\s*:/
];

// Helper: Parse CSS rules from input
function parseCSSRules(css) {
    const rules = [];
    const ruleRegex = /([^{}]+)\s*\{\s*([^}]*)\s*\}/g;
    let match;

    // Loop through all CSS rule matches found in the input
    while ((match = ruleRegex.exec(css)) !== null) {
        rules.push({
            selector: match[1].trim(),
            declarations: match[2].trim()
        });
    }

    return rules;
}

// Helper: Parse CSS declarations into property-value pairs
function parseDeclarations(declarations) {
    const properties = [];
    const parts = declarations.split(';').filter(p => p.trim());

    // Loop through each CSS declaration (property: value pair)
    for (const part of parts) {
        const colonIndex = part.indexOf(':');

        // Skip declarations that don't have a colon
        if (colonIndex === -1) continue;

        properties.push({
            property: part.substring(0, colonIndex).trim().toLowerCase(),
            value: part.substring(colonIndex + 1).trim()
        });
    }

    return properties;
}

// Helper: Check if selector is allowed
function isDangerousSelector(selector) {
    // Check if selector matches any dangerous patterns
    for (const pattern of DANGEROUS_SELECTORS) {
        if (pattern.test(selector)) return true;
    }

    // Check if selector matches any allowed patterns
    for (const pattern of ALLOWED_SELECTOR_PATTERNS) {
        if (pattern.test(selector)) return false;
    }

    // reject unknown selectors
    return true;
}

// Helper: Validate a single property-value pair
function validateProperty(property, value) {
    const errors = [];

    // Check if value uses !important flag (not allowed)
    if (value.includes('!important')) {
        errors.push(`Cannot use !important flag in ${property}`);
    }

    // Check if property is in the dangerous blacklist
    if (DANGEROUS_PROPERTIES.has(property)) {
        errors.push(`Property "${property}" is blocked`);
        return errors;
    }

    // Check if property is in the safe whitelist
    if (!SAFE_PROPERTIES.has(property)) {
        errors.push(`Property "${property}" is not allowed`);
    }

    return errors;
}

// Function: Validate CSS input
export function validateCSS(css) {
    const errors = [];

    // Allow empty CSS input
    if (!css || css.trim() === '') {
        return { valid: true, errors: [] };
    }

    // Check for external imports and URLs
    if (css.includes('@import') || css.includes('url(')) {
        errors.push("External imports and URLs are not allowed");
    }

    const rules = parseCSSRules(css);

    // Ensure at least one CSS rule was found
    if (rules.length === 0) {
        errors.push("No valid CSS rules found");
    }

    // Loop through each CSS rule
    for (const rule of rules) {
        // Check if selector is allowed
        if (isDangerousSelector(rule.selector)) {
            errors.push(`Selector "${rule.selector}" is not allowed. Only .car selector is permitted.`);
        }

        const properties = parseDeclarations(rule.declarations);
        // Loop through each property in the rule
        for (const prop of properties) {
            const propErrors = validateProperty(prop.property, prop.value);
            errors.push(...propErrors);
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Function: Get user-friendly error message
export function getValidationMessage(result) {
    if (result.valid) {
        return "✔ CSS is valid!";
    }

    const errorList = result.errors.slice(0, 5);
    const moreCount = result.errors.length - 5;

    let message = "✖ CSS Issues:\n";
    // Loop through each error and add it to the message
    errorList.forEach((err, i) => {
        message += `${i + 1}. ${err}\n`;
    });

    // Show count of remaining errors if more than 5
    if (moreCount > 0) {
        message += `\n+ ${moreCount} more errors`;
    }

    return message;
}
