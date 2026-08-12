import {onLanguageChange, t} from './i18n.js';

export function createLegal() {
    const overlay = document.getElementById('legal-overlay');
    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('legal-title');
    const body = document.getElementById('legal-body');

    let current = 'impressum';

    const isOpen = () => overlay.classList.contains('open');
    const close = () => overlay.classList.remove('open');

    const open = (doc) => {
        current = doc;
        render();
        overlay.classList.toggle('doc-privacy', doc === 'privacy');
        overlay.classList.add('open');
        modal.scrollTop = 0;
    };

    document.getElementById('impressum-link').addEventListener('click', () => open('impressum'));
    document.getElementById('privacy-link').addEventListener('click', () => open('privacy'));
    document.getElementById('legal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    const render = () => {
        title.textContent = t()[current];
        body.innerHTML = t()[`${current}_html`];
    };
    onLanguageChange(render);
    render();

    return {open, close, isOpen};
}
