/**
 * Site Footer
 * Injects a consistent page footer on all pages.
 */

const REPO_URL = 'https://github.com/David7ce/toolbox-installer';

export function createSiteFooter() {
    if (document.getElementById('siteFooter')) return;

    const year = new Date().getFullYear();
    const footer = document.createElement('footer');
    footer.id = 'siteFooter';
    footer.className = 'site-footer';
    footer.innerHTML = `
        <span>&copy; ${year} <a href="${REPO_URL}" target="_blank" rel="noopener">Toolbox Installer</a></span>
        <span class="site-footer-sep" aria-hidden="true">·</span>
        <span>Data sourced from community package lists</span>
        <span class="site-footer-sep" aria-hidden="true">·</span>
        <a href="${REPO_URL}/issues" target="_blank" rel="noopener">Report an issue</a>
        <span class="site-footer-sep" aria-hidden="true">·</span>
        <a href="https://david7ce.github.io/toolbox-installer/lib" target="_blank" rel="noopener">Source code</a>
    `;
    document.body.appendChild(footer);
}
