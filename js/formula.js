const FORMULA_FRAC = String.raw`\dfrac{h\,h'+k\,k'+l\,l'}{\sqrt{(h^2+k^2+l^2)\,(h'^2+k'^2+l'^2)}}`;
const FORMULA_LATEX = String.raw`\begin{aligned}
\cos(\alpha) &= ${FORMULA_FRAC} \\[6pt]
\Rightarrow\quad \alpha &= \cos^{-1}\!\left(${FORMULA_FRAC}\right)
\end{aligned}`;

export function renderFormula() {
    const el = document.getElementById('formula');
    if (!el || !window.katex) return;
    katex.render(FORMULA_LATEX, el, {throwOnError: false, displayMode: true});
    fitFormula(el);
}

// Shrink rendered formula so it never overflows the popup width
function fitFormula(el) {
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
        fitFormula(document.getElementById('formula'));
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

// Angle calculation popover
let calcPopup, calcHeaderEl, calcFormulaEl, calcAnchor;

function buildAngleLatex(ref, other) {
    const [h, k, l] = ref;
    const [hp, kp, lp] = other;
    const prod = (a, b) => `(${a})(${b})`;
    const sq = (v) => `${v < 0 ? `(${v})` : v}^2`;

    const num = h * hp + k * kp + l * lp;
    const a = h * h + k * k + l * l;
    const b = hp * hp + kp * kp + lp * lp;
    const cosVal = Math.abs(num) / Math.sqrt(a * b);
    const angle = Math.acos(Math.min(1, cosVal)) * 180 / Math.PI;

    return String.raw`\begin{aligned}
\cos(\alpha) &= \frac{\left|\,${prod(h, hp)}+${prod(k, kp)}+${prod(l, lp)}\,\right|}{\sqrt{(${sq(h)}+${sq(k)}+${sq(l)})(${sq(hp)}+${sq(kp)}+${sq(lp)})}} \\[6pt]
&= \frac{${Math.abs(num)}}{\sqrt{${a}\cdot ${b}}} = ${cosVal.toFixed(4)} \\[6pt]
\alpha &= \cos^{-1}(${cosVal.toFixed(4)}) = ${angle.toFixed(1)}^{\circ}
\end{aligned}`;
}

function positionCalc(anchor) {
    const r = anchor.getBoundingClientRect();
    const margin = 14;
    const w = calcPopup.offsetWidth;
    const h = calcPopup.offsetHeight;
    // Prefer placing the popover to the left of the panel; fall back to the right.
    let left = r.left - w - 12;
    if (left < margin) left = r.right + 12;
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    let top = r.top + r.height / 2 - h / 2;
    top = Math.max(margin, Math.min(top, window.innerHeight - h - margin));
    calcPopup.style.left = left + 'px';
    calcPopup.style.top = top + 'px';
}

export function closeAngleCalc() {
    if (calcPopup) calcPopup.classList.remove('open');
    calcAnchor = null;
}

export function setupAngleCalcPopover() {
    calcPopup = document.getElementById('calc-popup');
    calcHeaderEl = document.getElementById('calc-header');
    calcFormulaEl = document.getElementById('calc-formula');
    if (!calcPopup) return;

    document.addEventListener('click', (e) => {
        if (calcPopup.classList.contains('open') &&
            !calcPopup.contains(e.target) &&
            !e.target.closest('.angle-row')) {
            closeAngleCalc();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAngleCalc();
    });
    window.addEventListener('resize', () => {
        if (calcPopup.classList.contains('open') && calcAnchor) positionCalc(calcAnchor);
    });
}

export function showAngleCalc(anchor, headerHTML, ref, other) {
    if (!calcPopup || !window.katex) return;
    calcHeaderEl.innerHTML = headerHTML;
    katex.render(buildAngleLatex(ref, other), calcFormulaEl, {throwOnError: false, displayMode: true});
    calcPopup.classList.add('open');
    fitFormula(calcFormulaEl);
    positionCalc(anchor);
    calcAnchor = anchor;
}
