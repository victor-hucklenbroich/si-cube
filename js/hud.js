import {t} from './i18n.js';
import {angleBetween, formatMillerIndexHTML} from './miller.js';

export function createHud(faces, selection, {isTouchInput, showAngleCalc, onBeforeRender}) {
    const referenceEl = document.getElementById('current-face');
    const referenceLabelEl = document.getElementById('face-label');
    const referenceIndexEl = document.getElementById('facing-index');
    const referenceFamilyEl = document.getElementById('facing-family');
    const listEl = document.getElementById('angle-list');
    const clearBtn = document.getElementById('clear-btn');

    const familySizes = countFamilies(faces);
    const expanded = new Set();

    listEl.addEventListener('click', (e) => {
        const head = e.target.closest('.group-head');
        if (head) {
            toggleGroup(head.parentElement);
            return;
        }
        const row = e.target.closest('.angle-row');
        if (!row) return;
        e.stopPropagation();
        openAngleCalc(row);
    });

    function toggleGroup(group) {
        const isExpanded = group.classList.toggle('expanded');
        group.querySelector('.group-head').setAttribute('aria-expanded', String(isExpanded));
        if (isExpanded) expanded.add(group.dataset.family);
        else expanded.delete(group.dataset.family);
    }

    function openAngleCalc(row) {
        const ref = faces[selection.referenceIndex()];
        const other = faces[Number(row.dataset.face)];
        showAngleCalc(row, calcHeaderHTML(ref, other), ref.label, other.label);
    }

    function renderReference() {
        const face = faces[selection.referenceIndex()];
        if (!face) {
            referenceEl.style.display = 'none';
            return;
        }

        referenceEl.style.display = '';
        referenceLabelEl.textContent = t().reference;
        referenceIndexEl.innerHTML = formatMillerIndexHTML(face.label);
        referenceFamilyEl.textContent = `{${face.family}}`;
        referenceFamilyEl.className = `family-tag family-${face.family}`;
    }

    function renderAngles() {
        const selected = selection.indices();
        clearBtn.style.visibility = selected.length > 0 ? 'visible' : 'hidden';

        if (selected.length === 0) {
            expanded.clear();
            listEl.innerHTML = hintHTML(isTouchInput() ? t().hint_empty_touch : t().hint_empty);
            return;
        }
        if (selected.length === 1) {
            listEl.innerHTML = hintHTML(t().hint_single);
            return;
        }

        const [refIdx, ...others] = selected;
        const rows = others.map((idx) => ({
            idx,
            face: faces[idx],
            angle: angleBetween(faces[refIdx].label, faces[idx].label),
        }));

        listEl.innerHTML = collapseFamilies(rows, faces[refIdx], familySizes)
            .sort((a, b) => a.angle - b.angle)
            .map((entry) => (entry.family
                ? groupHTML(entry, expanded.has(entry.family))
                : angleRowHTML(entry)))
            .join('');
    }

    function render() {
        onBeforeRender?.();
        renderReference();
        renderAngles();
    }

    return {render};
}

function countFamilies(faces) {
    return faces.reduce((sizes, face) => sizes.set(face.family, (sizes.get(face.family) ?? 0) + 1),
        new Map());
}

function collapseFamilies(rows, refFace, familySizes) {
    const byFamily = new Map();
    rows.forEach((row) => {
        const siblings = byFamily.get(row.face.family) ?? [];
        siblings.push(row);
        byFamily.set(row.face.family, siblings);
    });

    const entries = [];
    byFamily.forEach((siblings, family) => {
        const selectedCount = siblings.length + (refFace.family === family ? 1 : 0);
        if (selectedCount === familySizes.get(family) && siblings.length > 1) {
            siblings.sort((a, b) => a.angle - b.angle || a.idx - b.idx);
            entries.push({family, angle: siblings[0].angle, rows: siblings});
        } else {
            entries.push(...siblings);
        }
    });
    return entries;
}

function calcHeaderHTML(ref, other) {
    return `<span class="dot dot-${ref.family}"></span>` +
        `<span class="idx">${formatMillerIndexHTML(ref.label)}</span>` +
        '<span class="calc-sep">∠</span>' +
        `<span class="dot dot-${other.family}"></span>` +
        `<span class="idx">${formatMillerIndexHTML(other.label)}</span>`;
}

function angleRowHTML({idx, face, angle}) {
    return `
        <div class="angle-row" data-face="${idx}">
            <span class="dot dot-${face.family}"></span>
            <span class="idx">${formatMillerIndexHTML(face.label)}</span>
            <span class="deg">${formatDeg(angle)}</span>
        </div>
    `;
}

function groupHTML({family, rows}, isExpanded) {
    return `
        <div class="angle-group${isExpanded ? ' expanded' : ''}" data-family="${family}">
            <div class="angle-row group-head" role="button" aria-expanded="${isExpanded}">
                <span class="chev">›</span>
                <span class="dot dot-${family}"></span>
                <span class="idx">{${family}}</span>
                <span class="count">×${rows.length}</span>
                <span class="deg">${formatGroupDeg(rows)}</span>
            </div>
            <div class="group-body">
                <div class="group-rows">${rows.map(angleRowHTML).join('')}</div>
            </div>
        </div>
    `;
}

function formatDeg(angle) {
    return `${angle.toFixed(1)}°`;
}

function formatGroupDeg(rows) {
    const low = formatDeg(rows[0].angle);
    const high = formatDeg(rows[rows.length - 1].angle);
    return low === high ? low : '<span class="deg-varies">~</span>';
}

function hintHTML(text) {
    return `<div class="hint-msg">${text}</div>`;
}
