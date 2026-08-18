// Switches between the "installer" and "compat" view panels on a merged
// toolbox platform page (#installerView / #compatView), and honors a
// #compat URL hash so old *-compatibility/ links still land on that view.

function setupViewToggle(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.view-toggle-btn');
    const installerView = document.getElementById('installerView');
    const compatView = document.getElementById('compatView');
    if (!buttons.length || !installerView || !compatView) return;

    function setView(view: string): void {
        installerView!.hidden = view !== 'installer';
        compatView!.hidden = view !== 'compat';
        buttons.forEach((b) => {
            const active = b.dataset.view === view;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', String(active));
        });
    }

    buttons.forEach((b) => {
        b.addEventListener('click', () => {
            const view = b.dataset.view;
            if (!view) return;
            setView(view);
            history.replaceState(null, '', view === 'compat' ? '#compat' : window.location.pathname);
        });
    });

    setView(window.location.hash === '#compat' ? 'compat' : 'installer');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupViewToggle);
} else {
    setupViewToggle();
}
