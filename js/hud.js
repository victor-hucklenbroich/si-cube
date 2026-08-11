import {t} from './i18n.js';
import {angleBetween, formatMillerIndexHTML} from './miller.js';

export function createHud(faces, selection, {isTouchInput, showAngleCalc, onBeforeRender}) {
    const referenceEl = document.getElementById('current-face');
    const referenceLabelEl = document.getElementById('face-label');
    const referenceIndexEl = document.getElementById('facing-index');
    const referenceFamilyEl = document.getElementById('facing-family');
    const listEl = document.getElementById('angle-list');
    const clearBtn = document.getElementById('clear-btn');

    listEl.addEventListener('click', (e) => {
        const row = e.target.closest('.angle-row');
        if (!row) return;
        e.stopPropagation();
        openAngleCalc(row);
    });

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
            listEl.innerHTML = hintHTML(isTouchInput() ? t().hint_empty_touch : t().hint_empty);
            return;
        }
        if (selected.length === 1) {
            listEl.innerHTML = hintHTML(t().hint_single);
            return;
        }

        const [refIdx, ...others] = selected;
        listEl.innerHTML = others
            .map((idx) => ({
                idx,
                face: faces[idx],
                angle: angleBetween(faces[refIdx].label, faces[idx].label),
            }))
            .sort((a, b) => a.angle - b.angle)
            .map(angleRowHTML)
            .join('');
    }

    function render() {
        onBeforeRender?.();
        renderReference();
        renderAngles();
    }

    return {render};
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
            <span class="deg">${angle.toFixed(1)}°</span>
        </div>
    `;
}

function hintHTML(text) {
    return `<div class="hint-msg">${text}</div>`;
}
