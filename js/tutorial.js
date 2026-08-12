import {onLanguageChange, t} from './i18n.js';

const STORAGE_KEY = 'tutorial';
const SEEN = 'seen';

const FIRST_VISIT_DELAY_MS = 700;
const SLOW_ORBIT_MS = 1600;

const SPOT_PADDING = 6;
const CARD_GAP = 14;
const CARD_MARGIN = 14;

const POSE = {
    hero: {x: 6.2, y: 4.2, z: 6.2},
    spin: {x: -1.8, y: 3.4, z: 6.6},
    reference: {x: 7.4, y: 3.0, z: 4.0},
    compare: {x: 6.0, y: 4.0, z: 5.4},
    wide: {x: 5.4, y: 5.2, z: 8.8},
};

const DEMO = {reference: 0, edge: 6, corner: 18};
const DEMO_PLANES = [DEMO.reference, DEMO.edge, DEMO.corner];

export function createTutorial(app) {
    const dim = document.getElementById('tutorial-dim');
    const card = document.getElementById('tutorial-card');
    const dotsEl = document.getElementById('tutorial-dots');
    const titleEl = document.getElementById('tutorial-title');
    const bodyEl = document.getElementById('tutorial-body');
    const skipBtn = document.getElementById('tutorial-skip');
    const backBtn = document.getElementById('tutorial-back');
    const nextBtn = document.getElementById('tutorial-next');

    const canvasEl = document.getElementById('canvas-container');
    const referenceEl = document.getElementById('current-face');
    const angleTableEl = document.getElementById('angle-table');
    const calcPopup = document.getElementById('calc-popup');
    const toolbarEl = document.getElementById('toolbar');

    const steps = [
        {
            key: 'cube',
            enter() {
                app.select([]);
                app.orbitTo(POSE.hero);
                return canvasEl;
            },
        },
        {
            key: 'view',
            enter() {
                app.select([]);
                app.orbitTo(POSE.spin, SLOW_ORBIT_MS);
                return canvasEl;
            },
        },
        {
            key: 'reference',
            enter() {
                app.select([DEMO.reference]);
                app.orbitTo(POSE.reference);
                return referenceEl;
            },
        },
        {
            key: 'angles',
            enter() {
                app.select(DEMO_PLANES);
                app.orbitTo(POSE.compare);
                return angleTableEl;
            },
        },
        {
            key: 'family',
            enter() {
                app.select(DEMO_PLANES, DEMO.corner);
                app.orbitTo(POSE.wide);
                return angleTableEl;
            },
        },
        {
            key: 'calc',
            enter() {
                app.select(DEMO_PLANES, DEMO.corner);
                const row = app.openCalc(DEMO.edge);
                if (!row) return angleTableEl;
                // KaTeX is loaded from a CDN; without it there is no popup to point at
                return calcPopup.classList.contains('open') ? [row, calcPopup] : row;
            },
        },
        {
            key: 'controls',
            enter() {
                app.select([]);
                app.orbitTo(POSE.hero);
                return toolbarEl;
            },
        },
    ];

    let index = -1;
    let targets = [];
    let restore = null;

    const isOpen = () => index >= 0;

    function start() {
        if (isOpen()) return;
        localStorage.setItem(STORAGE_KEY, SEEN);
        restore = {planes: app.planes(), camera: app.cameraPose()};
        document.body.classList.add('tutorial-open');
        showStep(0);
        // Position first, fade in second, so nothing slides in from the last run
        requestAnimationFrame(() => {
            if (!isOpen()) return;
            dim.classList.add('open');
            card.classList.add('open');
            focusNext();
        });
    }

    function stop() {
        if (!isOpen()) return;
        index = -1;
        targets = [];
        dim.classList.remove('open');
        card.classList.remove('open');
        document.body.classList.remove('tutorial-open');

        app.closePopups();
        app.select(restore.planes);
        app.orbitTo(restore.camera);
        restore = null;
    }

    function showStep(next) {
        index = Math.max(0, Math.min(next, steps.length - 1));
        targets = [].concat(steps[index].enter()).filter(Boolean);
        renderCard();
        layout();
        focusNext();
    }

    function focusNext() {
        if (card.classList.contains('open')) nextBtn.focus({preventScroll: true});
    }

    function renderCard() {
        const last = index === steps.length - 1;

        dotsEl.innerHTML = steps
            .map((_, i) => `<span class="${i === index ? 'on' : ''}"></span>`)
            .join('');
        titleEl.textContent = stepText('title');
        bodyEl.innerHTML = stepText('body');

        backBtn.hidden = index === 0;
        skipBtn.hidden = last;
        nextBtn.textContent = last ? t().tutorial_done : t().tutorial_next;
    }

    function stepText(part) {
        const strings = t();
        const touch = strings[`tutorial_${steps[index].key}_${part}_touch`];
        return (app.isTouchInput() && touch) || strings[`tutorial_${steps[index].key}_${part}`];
    }

    function layout() {
        const rects = targets.map((el) => el.getBoundingClientRect());
        if (rects.length === 0) return;
        placeSpotlight(rects[0]);
        placeCard(union(rects));
    }

    function placeSpotlight(rect) {
        dim.style.left = `${rect.left - SPOT_PADDING}px`;
        dim.style.top = `${rect.top - SPOT_PADDING}px`;
        dim.style.width = `${rect.width + 2 * SPOT_PADDING}px`;
        dim.style.height = `${rect.height + 2 * SPOT_PADDING}px`;
    }

    function placeCard(rect) {
        const size = {width: card.offsetWidth, height: card.offsetHeight};
        const viewport = {width: window.innerWidth, height: window.innerHeight};
        const {left, top} = cardPlacement(rect, size, viewport);
        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
    }

    function startOnFirstVisit() {
        if (localStorage.getItem(STORAGE_KEY) === SEEN) return;
        setTimeout(start, FIRST_VISIT_DELAY_MS);
    }

    skipBtn.addEventListener('click', stop);
    backBtn.addEventListener('click', () => showStep(index - 1));
    nextBtn.addEventListener('click', () => {
        if (index === steps.length - 1) stop();
        else showStep(index + 1);
    });
    card.addEventListener('click', (e) => e.stopPropagation());

    window.addEventListener('keydown', (e) => {
        if (!isOpen()) return;
        if (e.key === 'ArrowRight') showStep(index + 1);
        else if (e.key === 'ArrowLeft') showStep(index - 1);
    });
    window.addEventListener('resize', () => {
        if (isOpen()) layout();
    });
    onLanguageChange(() => {
        if (!isOpen()) return;
        requestAnimationFrame(() => {
            if (isOpen()) showStep(index);
        });
    });

    return {start, stop, isOpen, startOnFirstVisit};
}

export function cardPlacement(target, card, viewport) {
    const room = {
        left: target.left - CARD_GAP - CARD_MARGIN,
        right: viewport.width - target.right - CARD_GAP - CARD_MARGIN,
        above: target.top - CARD_GAP - CARD_MARGIN,
        below: viewport.height - target.bottom - CARD_GAP - CARD_MARGIN,
    };
    const needed = (side) => (side === 'left' || side === 'right' ? card.width : card.height);
    const side = Object.keys(room)
        .filter((key) => room[key] >= needed(key))
        .sort((a, b) => room[b] - room[a])[0];

    let left, top;
    if (side === 'left' || side === 'right') {
        left = side === 'left' ? target.left - CARD_GAP - card.width : target.right + CARD_GAP;
        top = target.top + (target.height - card.height) / 2;
    } else if (side) {
        left = target.left + (target.width - card.width) / 2;
        top = side === 'above'
            ? target.top - CARD_GAP - card.height
            : target.bottom + CARD_GAP;
    } else {
        const roomy = target.width >= card.width + 2 * CARD_GAP
            && target.height >= card.height + 2 * CARD_GAP;
        const box = roomy ? target : {left: 0, width: viewport.width, bottom: viewport.height};
        left = box.left + (box.width - card.width) / 2;
        top = box.bottom - card.height - CARD_GAP - CARD_MARGIN;
    }

    return {
        left: clampToViewport(left, card.width, viewport.width),
        top: clampToViewport(top, card.height, viewport.height),
    };
}

function union(rects) {
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return {left, top, right, bottom, width: right - left, height: bottom - top};
}

function clampToViewport(value, size, viewport) {
    return Math.max(CARD_MARGIN, Math.min(value, viewport - size - CARD_MARGIN));
}
