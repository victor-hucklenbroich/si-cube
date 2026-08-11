import {buildCube} from './cube.js';
import {createHud} from './hud.js';
import {applyLanguage, onLanguageChange, toggleLanguage} from './i18n.js';
import {createImpressum} from './impressum.js';
import {attachInput, onInputModeChange} from './input.js';
import {renderFormula, setupAngleCalcPopover, setupFormulaPopover} from './popover.js';
import {createSelection} from './selection.js';
import {applyTheme, onThemeChange, toggleTheme} from './theme.js';
import {createViewer} from './viewer.js';

async function init() {
    applyLanguage();
    applyTheme();

    const data = await fetch('data/cube.json').then((resp) => resp.json());

    const viewer = createViewer(document.getElementById('canvas-container'));
    const cube = buildCube(data);
    const selection = createSelection();
    const hud = createHud(cube.faces, selection);
    const impressum = createImpressum();
    viewer.add(cube.group);

    function selectionChanged() {
        cube.refreshTextures(selection);
        hud.render();
    }

    function clearSelection() {
        if (selection.isEmpty()) return;
        selection.clear();
        selectionChanged();
    }

    const faceMeshes = cube.faces.map((face) => face.mesh);

    attachInput(viewer.canvas, {
        onSelect(clientX, clientY, wholeFamily) {
            const hit = viewer.pick(clientX, clientY, faceMeshes);
            if (!hit) {
                clearSelection();
                return;
            }
            const idx = hit.userData.faceIndex;
            if (wholeFamily) selection.toggleFamily(cube.faces, idx);
            else selection.toggleFace(idx);
            selectionChanged();
        },
    });

    onInputModeChange(() => hud.render());
    onLanguageChange(() => hud.render());
    onThemeChange(() => {
        viewer.applyTheme();
        cube.applyTheme(selection);
    });

    document.getElementById('btn-lang').addEventListener('click', toggleLanguage);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    document.getElementById('clear-btn').addEventListener('click', clearSelection);
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (impressum.isOpen()) impressum.close();
        else clearSelection();
    });

    hud.render();
    renderFormula();
    setupFormulaPopover();
    setupAngleCalcPopover();

    viewer.start(() => cube.pulseReference(selection));
}

init().catch(console.error);
