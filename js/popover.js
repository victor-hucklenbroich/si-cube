const FORMULA_FRAC = String.raw`\dfrac{h\,h'+k\,k'+l\,l'}{\sqrt{(h^2+k^2+l^2)\,(h'^2+k'^2+l'^2)}}`;
const FORMULA_LATEX = String.raw`\begin{aligned}
\cos(\alpha) &= ${FORMULA_FRAC} \\[6pt]
\Rightarrow\quad \alpha &= \cos^{-1}\!\left(${FORMULA_FRAC}\right)
\end{aligned}`;

const MARGIN = 14;

export function createPopovers() {
    // Only one popover at a time
    const formula = createFormulaPopover({onOpen: () => calc.close()});
    const calc = createAngleCalcPopover({onOpen: () => formula.close()});

    function closeAll() {
        formula.close();
        calc.close();
    }

    return {closeAll, showAngleCalc: calc.show};
}

function createFormulaPopover({onOpen}) {
    const btn = document.querySelector('.info-btn');
    const popup = document.getElementById('formula-popup');
    const formulaEl = document.getElementById('formula');

    const isOpen = () => popup.classList.contains('open');

    function position() {
        const r = btn.getBoundingClientRect();
        const gap = 10;
        const w = popup.offsetWidth;
        const h = popup.offsetHeight;

        const roomBelow = window.innerHeight - r.bottom - gap - MARGIN;
        const roomAbove = r.top - gap - MARGIN;
        const top = (h <= roomBelow || roomBelow >= roomAbove) ? r.bottom + gap : r.top - gap - h;

        popup.style.left = clampToViewport(r.left + r.width / 2 - w / 2, w, window.innerWidth) + 'px';
        popup.style.top = clampToViewport(top, h, window.innerHeight) + 'px';
    }

    function open() {
        onOpen();
        fitFormula(formulaEl);
        position();
        popup.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
        popup.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen() ? close() : open();
    });
    document.addEventListener('click', (e) => {
        if (isOpen() && !popup.contains(e.target)) close();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
        if (isOpen()) position();
    });

    const ro = new ResizeObserver(() => {
        if (isOpen()) position();
    });
    ['#side-panel', '#angle-table'].forEach((sel) => ro.observe(document.querySelector(sel)));

    if (window.katex) {
        katex.render(FORMULA_LATEX, formulaEl, {throwOnError: false, displayMode: true});
        fitFormula(formulaEl);
    }

    return {close};
}

function createAngleCalcPopover({onOpen}) {
    const popup = document.getElementById('calc-popup');
    const headerEl = document.getElementById('calc-header');
    const formulaEl = document.getElementById('calc-formula');
    let anchor = null;

    const isOpen = () => popup.classList.contains('open');

    function position() {
        const r = anchor.getBoundingClientRect();
        const w = popup.offsetWidth;
        const h = popup.offsetHeight;
        const left = r.left - w - 12 < MARGIN ? r.right + 12 : r.left - w - 12;

        popup.style.left = clampToViewport(left, w, window.innerWidth) + 'px';
        popup.style.top = clampToViewport(r.top + r.height / 2 - h / 2, h, window.innerHeight) + 'px';
    }

    function show(row, headerHTML, ref, other) {
        if (!window.katex) return;
        onOpen();
        anchor = row;
        headerEl.innerHTML = headerHTML;
        katex.render(buildAngleLatex(ref, other), formulaEl, {throwOnError: false, displayMode: true});
        popup.classList.add('open');
        fitFormula(formulaEl);
        position();
    }

    function close() {
        popup.classList.remove('open');
        anchor = null;
    }

    document.addEventListener('click', (e) => {
        if (isOpen() && !popup.contains(e.target) && !e.target.closest('.angle-row[data-face]')) close();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
        if (isOpen()) position();
    });

    return {close, show};
}

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
    const cosStr = trimZeros(cosVal.toFixed(4));

    return String.raw`\begin{aligned}
\cos(\alpha) &= \frac{\left|\,${prod(h, hp)}+${prod(k, kp)}+${prod(l, lp)}\,\right|}{\sqrt{(${sq(h)}+${sq(k)}+${sq(l)})(${sq(hp)}+${sq(kp)}+${sq(lp)})}} \\[6pt]
&= \frac{${Math.abs(num)}}{\sqrt{${a}\cdot ${b}}} = ${cosStr} \\[6pt]
\alpha &= \cos^{-1}(${cosStr}) = ${angle.toFixed(1)}^{\circ}
\end{aligned}`;
}

function trimZeros(str) {
    return str.includes('.') ? str.replace(/0+$/, '').replace(/\.$/, '') : str;
}

function fitFormula(el) {
    el.style.fontSize = '';
    const k = el.querySelector('.katex-display') || el.firstElementChild;
    if (!k) return;
    const avail = el.clientWidth;
    if (avail > 0 && k.scrollWidth > avail) {
        const base = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = (base * avail / k.scrollWidth * 0.97) + 'px';
    }
}

function clampToViewport(value, size, viewport) {
    return Math.max(MARGIN, Math.min(value, viewport - size - MARGIN));
}
