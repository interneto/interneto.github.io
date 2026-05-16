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
                    <span class="pkg-count" id="pkgCount" aria-live="polite"></span>
                    <div class="command-actions">
                        <button type="button" class="copy-btn" id="copyListBtn"
                            title="Copy package names" aria-label="Copy package names as list">📝 Names</button>
                        <button type="button" class="copy-btn" id="copyCommandBtn"
                            title="Copy install command" aria-label="Copy install command">📋 Copy</button>
                    </div>
                </div>
                <code id="installation-command" aria-live="polite">${initialText}</code>
            </div>
        </div>`;

    document.body.appendChild(footer);
    return footer;
}
