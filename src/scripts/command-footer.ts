/**
 * Command Footer Module
 * Creates and manages the shared sticky command footer.
 * Call createCommandFooter() once at page init — it injects the footer into document.body.
 */

/**
 * @param {Object} [options]
 * @param {string} [options.ariaLabel]       - ARIA region label
 * @param {string} [options.commandLabel]    - Text shown in the header bar
 * @param {boolean} [options.hasLangId]      - Whether to add id="commandLanguage" to the label span
 * @param {string} [options.initialText]     - Initial placeholder inside <code>
 * @returns {HTMLElement} The created footer element
 */
export function createCommandFooter({
    ariaLabel = 'Install command',
    commandLabel = 'Install command:',
    hasLangId = false,
    initialText = 'Select packages to generate install command...',
} = {}) {
    const footer = document.createElement('div');
    footer.className = 'command-footer';
    footer.id = 'commandFooter';
    footer.hidden = true;
    footer.setAttribute('role', 'region');
    footer.setAttribute('aria-label', ariaLabel);

    const langId = hasLangId ? ' id="commandLanguage"' : '';

    footer.innerHTML = `
        <div class="command-container">
            <div class="command-output">
                <div class="command-header">
                    <span class="command-language"${langId}>${commandLabel}</span>
                    <button type="button" class="copy-btn" id="copyCommandBtn"
                        title="Copy to clipboard" aria-label="Copy to clipboard">📋 Copy</button>
                </div>
                <code id="installation-command" aria-live="polite">${initialText}</code>
            </div>
        </div>`;

    document.body.appendChild(footer);
    return footer;
}
