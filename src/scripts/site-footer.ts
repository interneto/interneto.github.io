/**
 * Site Footer
 * Injects a consistent page footer on all pages.
 */

const REPO_URL = 'https://github.com/interneto/interneto.github.io';

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
    `;
    document.body.append(footer);
}
