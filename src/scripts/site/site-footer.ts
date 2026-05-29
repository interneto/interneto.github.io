/**
 * Site Footer
 * Injects a consistent page footer on all pages.
 */

const REPO_URL = 'https://github.com/interneto/interneto.github.io';
const RAINDROP_URL = 'https://interneto.raindrop.page/';
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function createSiteFooter(): void {
    if (document.getElementById('siteFooter')) return;

    const year = new Date().getFullYear();
    const footer = document.createElement('footer');
    footer.id = 'siteFooter';
    footer.className = 'site-footer';
    footer.innerHTML = `
        <span>&copy; ${year} <a href="${REPO_URL}" target="_blank" rel="noopener">Interneto</a></span>
        <span class="site-footer-sep" aria-hidden="true">&bull;</span>
        <span>Made with &#10084;&#65039; and <a href="https://astro.build" target="_blank" rel="noopener">Astro</a></span>
        <span class="site-footer-sep" aria-hidden="true">&bull;</span>
        <span class="site-footer-social">
            <a href="${RAINDROP_URL}" target="_blank" rel="noopener" aria-label="Raindrop" title="Raindrop">
                <img src="${BASE}img/software/apps/raindrop-io.svg" alt="Raindrop" width="16" height="16" loading="lazy">
            </a>
            <a href="${REPO_URL}" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
                <img class="site-footer-icon-github" src="${BASE}img/software/apps/github.svg" alt="GitHub" width="16" height="16" loading="lazy">
            </a>
        </span>
    `;
    document.body.append(footer);
}
