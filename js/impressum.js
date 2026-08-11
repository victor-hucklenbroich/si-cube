import {onLanguageChange, t} from './i18n.js';

export function createImpressum() {
    const overlay = document.getElementById('impressum-overlay');
    const body = document.getElementById('impressum-body');

    const isOpen = () => overlay.classList.contains('open');
    const open = () => overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');

    document.getElementById('impressum-link').addEventListener('click', open);
    document.getElementById('impressum-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    const renderBody = () => {
        body.innerHTML = t().impressum_html;
    };
    onLanguageChange(renderBody);
    renderBody();

    return {open, close, isOpen};
}
