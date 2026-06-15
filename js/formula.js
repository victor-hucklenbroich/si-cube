const FORMULA_FRAC = String.raw`\dfrac{h\,h'+k\,k'+l\,l'}{\sqrt{(h^2+k^2+l^2)\,(h'^2+k'^2+l'^2)}}`;
const FORMULA_LATEX = String.raw`\begin{aligned}
\cos(\alpha) &= ${FORMULA_FRAC} \\[6pt]
\Rightarrow\quad \alpha &= \cos^{-1}\!\left(${FORMULA_FRAC}\right)
\end{aligned}`;

export function renderFormula() {
    const el = document.getElementById('formula');
    if (!el || !window.katex) return;
    katex.render(FORMULA_LATEX, el, {throwOnError: false, displayMode: true});
    fitFormula();
}

// Shrink the rendered formula so it never overflows the popup width
function fitFormula() {
    const el = document.getElementById('formula');
    if (!el) return;
    el.style.fontSize = '';
    const k = el.querySelector('.katex-display') || el.firstElementChild;
    if (!k) return;
    const avail = el.clientWidth;
    if (avail > 0 && k.scrollWidth > avail) {
        const base = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = (base * avail / k.scrollWidth * 0.97) + 'px';
    }
}

export function setupFormulaPopover() {
    const btn = document.querySelector('.info-btn');
    const popup = document.querySelector('.info-popup');
    if (!btn || !popup) return;

    const position = () => {
        const r = btn.getBoundingClientRect();
        const margin = 14;
        const w = popup.offsetWidth;
        let left = r.left + r.width / 2 - w / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
        popup.style.left = left + 'px';
        popup.style.top = (r.bottom + 10) + 'px';
    };

    const open = () => {
        fitFormula();
        position();
        popup.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
        popup.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', (e) => {
        if (popup.classList.contains('open') && !popup.contains(e.target)) close();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
        if (popup.classList.contains('open')) position();
    });
}
