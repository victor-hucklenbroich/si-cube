import {buildCube} from './cube.js';
import {createHud} from './hud.js';
import {applyLanguage, onLanguageChange, toggleLanguage} from './i18n.js';
import {createLegal} from './legal.js';
import {createInput} from './input.js';
import {createPopovers} from './popover.js';
import {createSelection} from './selection.js';
import {applyTheme, onThemeChange, toggleTheme} from './theme.js';
import {createViewer} from './viewer.js';

async function init() {
    applyLanguage();
    applyTheme();

    const data = await fetch('data/cube.json').then((resp) => resp.json());

    const viewer = createViewer(document.getElementById('canvas-container'));
    const cube = buildCube(data);
    const selection = createSelection(cube.faces);
    const popovers = createPopovers();
    const legal = createLegal();
    viewer.add(cube.group);

    const faceMeshes = cube.faces.map((face) => face.mesh);

    const input = createInput(viewer.canvas, {
        onSelect(clientX, clientY, wholeFamily) {
            const hit = viewer.pick(clientX, clientY, faceMeshes);
            if (!hit) {
                clearSelection();
                return;
            }
            const idx = hit.userData.faceIndex;
            if (wholeFamily) selection.toggleFamily(idx);
            else selection.toggleFace(idx);
            selectionChanged();
        },
        onModeChange: () => hud.render(),
    });

    const hud = createHud(cube.faces, selection, {
        isTouchInput: input.isTouchInput,
        showAngleCalc: popovers.showAngleCalc,
        // Whatever the HUD is about to redraw for, any open popover is now stale
        onBeforeRender: popovers.closeAll,
    });

    function selectionChanged() {
        cube.refreshTextures(selection);
        hud.render();
    }

    function clearSelection() {
        if (selection.isEmpty()) return;
        selection.clear();
        selectionChanged();
    }

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
        if (legal.isOpen()) legal.close();
        else clearSelection();
    });

    hud.render();
    viewer.start(() => cube.pulseReference(selection));
}

init().catch(console.error);
