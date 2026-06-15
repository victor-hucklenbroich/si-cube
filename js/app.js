import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';


const settings = {
    theme: getPreferredTheme(),
    lang: getPreferredLanguage(),
};

const translations = {
    de: {
        page: "Silizium Würfel",
        title: "Si Kristallebenen",
        subtitle: "Millersche Indizes",
        facing: "BETRACHTETE EBENE",
        angles: "WINKEL",
        rotate: "Drehen",
        reference: "Referenzebene",
        select: "Auswählen",
        family: "Äquivalente",
        zoom: "Zoom",
        hint_empty: "Rechtsklick auf eine Ebene (•••) um diese auszuwählen. Shift+Rechtsklick wählt alle äquialenten Ebenen {•••} aus.",
        hint_single: "Wähle eine weitere Ebene, um dessen Winkel zu vergleichen.",
        formula_plane1: "Indizes Ebene 1",
        formula_plane2: "Indizes Ebene 2",
    },
    en: {
        page: "Silicon Cube",
        title: "Si Crystal Planes",
        subtitle: "Miller Indices",
        facing: "FACING PLANE",
        angles: "ANGLES",
        rotate: "Rotate",
        reference: "Reference Plane",
        select: "Select",
        family: "Equivalents",
        zoom: "Zoom",
        hint_empty: "Right-click a plane (•••) to select. Shift+right-click selects all equivalent planes {•••}.",
        hint_single: "Select another plane to compare their angles.",
        formula_plane1: "indices of plane 1",
        formula_plane2: "indices of plane 2",
    },
};

const THEME_COLORS = {
    dark: {
        sceneBg: 0x212121,
        faceColor: "dimgrey",
        textColor: "snow",
        edgeColor: 0xB3B3B3,
        faceTextAlpha: 1.0,
    },
    light: {
        sceneBg: 0xF2F2F2,
        faceColor: "white",
        textColor: "black",
        edgeColor: 0x595959,
        faceTextAlpha: 0.85,
    }
};

const PLANE_COLORS = {
    dark:  { '100': '#41ccb4', '110': '#f59e0b', '111': '#a78bfa' },
    light: { '100': '#19cc9c', '110': '#f5490b', '111': '#761aff' },
};

const DEFAULT_CAM = {x: 3.8, y: 2.5, z: 3.8};

let scene, camera, renderer, controls;
let facesData = [];
let currentRefIdx = -1;
let currentRefMode = null;
let animTarget = null;
let faceMeshes = [];
let edgeLines = null;
let cubeData = null;

// Selection state
const selectedFaces = new Set();
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
let rmbDownPos = null;


async function init() {
    applyLanguage(settings.lang);
    applyTheme(settings.theme);

    const resp = await fetch('data/cube.json');
    cubeData = await resp.json();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(THEME_COLORS[settings.theme].sceneBg);

    // Camera
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 6;
    controls.maxDistance = 25;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null,
    };

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    // Build
    buildCube(cubeData);
    updateReferenceFace();
    updateAngleList();
    renderFormula();
    setupFormulaPopover();

    // Events
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectedFaces.size > 0) clearSelection();
    });

    animate();
}

function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    settings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☽' : '☀';

    if (scene) {
        const tc = THEME_COLORS[theme];
        scene.background = new THREE.Color(tc.sceneBg);
        if (edgeLines) edgeLines.material.color.set(tc.edgeColor);
        rebuildFaceTextures();
    }
}

window.switchTheme = function () {
    applyTheme(settings.theme === 'dark' ? 'light' : 'dark');
};

function getPreferredLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    return navigator.language.startsWith('de') ? 'de' : 'en';
}

function applyLanguage(lang) {
    settings.lang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = lang === 'de' ? 'DE' : 'EN';

    // Force HUD re-render so reference-mode label gets correct translation
    currentRefIdx = -1;
    currentRefMode = null;
    if (facesData.length) {
        updateReferenceFace();
        updateAngleList();
    }
}

window.switchLanguage = function () {
    applyLanguage(settings.lang === 'de' ? 'en' : 'de');
};

const FORMULA_FRAC = String.raw`\dfrac{h\,h'+k\,k'+l\,l'}{\sqrt{(h^2+k^2+l^2)\,(h'^2+k'^2+l'^2)}}`;
const FORMULA_LATEX = String.raw`\begin{aligned}
\cos(\alpha) &= ${FORMULA_FRAC} \\[6pt]
\Rightarrow\quad \alpha &= \cos^{-1}\!\left(${FORMULA_FRAC}\right)
\end{aligned}`;

function renderFormula() {
    const el = document.getElementById('formula');
    if (!el || !window.katex) return;
    katex.render(FORMULA_LATEX, el, {throwOnError: false, displayMode: true});
    fitFormula();
}

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

function setupFormulaPopover() {
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

// Miller index labels
function createFaceTexture(label, family, isTriangle, isSelected, textCenter) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const tc = THEME_COLORS[settings.theme];

    ctx.fillStyle = isSelected ? PLANE_COLORS[settings.theme][family] : tc.faceColor;
    ctx.fillRect(0, 0, size, size);

    // Text
    const fontSize = isTriangle ? 38 : 48;
    ctx.font = `300 ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textColor = isSelected ? '#ffffff' : tc.textColor;
    ctx.globalAlpha = isSelected ? 1.0 : tc.faceTextAlpha;
    ctx.fillStyle = textColor;

    const tcu = textCenter ? textCenter.u : 0.5;
    const tcv = textCenter ? textCenter.v : 0.5;
    const cx = tcu * size;
    const cy = (1 - tcv) * size;
    const parts = label.map((v) => ({val: Math.abs(v), neg: v < 0}));
    const spacing = fontSize * 0.55;
    const totalW = spacing * (parts.length - 1);
    const startX = cx - totalW / 2;

    ctx.fillText('(', startX - fontSize * 0.45, cy);
    ctx.fillText(')', startX + totalW + fontSize * 0.45, cy);

    parts.forEach((p, i) => {
        const x = startX + i * spacing;
        ctx.fillText(String(p.val), x, cy);
        if (p.neg) {
            const w = ctx.measureText(String(p.val)).width / 2;
            ctx.strokeStyle = textColor;
            ctx.lineWidth = 2.65;
            ctx.beginPath();
            ctx.moveTo(x - w, cy + fontSize * 0.5);
            ctx.lineTo(x + w, cy + fontSize * 0.5);
            ctx.stroke();
        }
    });

    ctx.globalAlpha = 1.0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
}

function rebuildFaceTextures() {
    faceMeshes.forEach((fm, idx) => {
        const isSelected = selectedFaces.has(idx);
        if (fm.mesh.material.map) fm.mesh.material.map.dispose();
        fm.mesh.material.map = createFaceTexture(fm.label, fm.family, fm.isTriangle, isSelected, fm.textCenter);
        fm.mesh.material.needsUpdate = true;
    });
}

// UV Mapping
function computeFaceUVs(faceVerts3D, normal) {
    const n = new THREE.Vector3(...normal).normalize();
    const u = new THREE.Vector3();
    if (Math.abs(n.x) < 0.9) u.crossVectors(n, new THREE.Vector3(1, 0, 0));
    else u.crossVectors(n, new THREE.Vector3(0, 1, 0));
    u.normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();

    const pts = faceVerts3D.map((p) => ({
        x: new THREE.Vector3(...p).dot(u),
        y: new THREE.Vector3(...p).dot(v),
    }));

    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    pts.forEach((p) => {
        mnX = Math.min(mnX, p.x);
        mxX = Math.max(mxX, p.x);
        mnY = Math.min(mnY, p.y);
        mxY = Math.max(mxY, p.y);
    });
    const rX = mxX - mnX || 1, rY = mxY - mnY || 1, pad = 0.02;
    const uvs = pts.map((p) => ({
        u: pad + (1 - 2 * pad) * (p.x - mnX) / rX,
        v: pad + (1 - 2 * pad) * (p.y - mnY) / rY,
    }));

    // Geometric centroid of the face in UV space
    let cu = 0, cv = 0;
    uvs.forEach((p) => { cu += p.u; cv += p.v; });
    cu /= uvs.length;
    cv /= uvs.length;

    return { uvs, centroid: { u: cu, v: cv } };
}

function buildCube(cube) {
    const vertices = cube.vertices;
    const edgePositions = [];
    facesData = [];
    faceMeshes = [];

    cube.faces.forEach((face) => {
        const n = face.normal;
        const isTriangle = face.family === '111';

        facesData.push({
            label: face.label,
            family: face.family,
            normal: new THREE.Vector3(...n),
            centroid: new THREE.Vector3(...face.centroid),
        });

        // Collect unique vertices for UV computation
        const idxSet = new Set();
        face.triangles.forEach((tri) => tri.forEach((i) => idxSet.add(i)));
        const uArr = Array.from(idxSet);
        const { uvs, centroid: uvCentroid } = computeFaceUVs(uArr.map((i) => vertices[i]), n);
        const idxToUV = {};
        uArr.forEach((vi, i) => {
            idxToUV[vi] = uvs[i];
        });

        // Geometry with UVs
        const pos = [], nrm = [], uv = [];
        face.triangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const v = vertices[tri[i]];
                pos.push(v[0], v[1], v[2]);
                nrm.push(n[0], n[1], n[2]);
                const fuv = idxToUV[tri[i]];
                uv.push(fuv.u, fuv.v);
            }
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));

        const texture = createFaceTexture(face.label, face.family, isTriangle, false, uvCentroid);
        const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            map: texture,
            flatShading: true,
            side: THREE.DoubleSide,
        }));
        scene.add(mesh);
        faceMeshes.push({mesh, label: face.label, family: face.family, isTriangle, textCenter: uvCentroid});

        // Boundary edges
        const ec = {};
        face.triangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const a = tri[i], b = tri[(i + 1) % 3];
                const key = Math.min(a, b) + ',' + Math.max(a, b);
                ec[key] = (ec[key] || 0) + 1;
            }
        });
        Object.entries(ec).forEach(([key, count]) => {
            if (count === 1) {
                const [a, b] = key.split(',').map(Number);
                edgePositions.push(...vertices[a], ...vertices[b]);
            }
        });
    });

    // Edge wireframe
    const eGeom = new THREE.BufferGeometry();
    eGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeLines = new THREE.LineSegments(eGeom, new THREE.LineBasicMaterial({
        color: THEME_COLORS[settings.theme].edgeColor,
    }));
    scene.add(edgeLines);
}

// Miller index formatting
function formatMillerIndexHTML(hkl) {
    return '(' + hkl.map((v) =>
        v < 0 ? '<span style="text-decoration:underline;text-underline-offset:0.14em">' + Math.abs(v) + '</span>' : '' + v
    ).join(' ') + ')';
}

// Facing detection
function findFacingPlane() {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    let bestIdx = 0, bestDot = -Infinity;
    facesData.forEach((face, i) => {
        const dot = -camDir.dot(face.normal);
        if (dot > bestDot) {
            bestDot = dot;
            bestIdx = i;
        }
    });
    return bestIdx;
}

function angleBetween(n1, n2) {
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(n1.dot(n2), -1, 1)));
}

// Selection
function onPointerDown(e) {
    if (animTarget) { animTarget = null; controls.enableDamping = true; }
    if (e.button === 2) rmbDownPos = { x: e.clientX, y: e.clientY };
}

function onPointerUp(e) {
    if (e.button !== 2 || !rmbDownPos) return;
    const dx = e.clientX - rmbDownPos.x;
    const dy = e.clientY - rmbDownPos.y;
    rmbDownPos = null;
    if (dx * dx + dy * dy > 25) return;
    handleSelectClick(e);
}

function handleSelectClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseNDC, camera);
    const meshes = faceMeshes.map(f => f.mesh);
    const hits = raycaster.intersectObjects(meshes, false);

    if (hits.length === 0) {
        if (selectedFaces.size > 0) clearSelection();
        return;
    }

    const idx = faceMeshes.findIndex(f => f.mesh === hits[0].object);
    if (idx < 0) return;

    if (e.shiftKey) toggleFamily(idx);
    else toggleFace(idx);

    rebuildFaceTextures();
    updateReferenceFace();
    updateAngleList();
}

function toggleFace(idx) {
    if (selectedFaces.has(idx)) selectedFaces.delete(idx);
    else selectedFaces.add(idx);
}

function toggleFamily(clickedIdx) {
    const family = facesData[clickedIdx].family;
    const ids = facesData
        .map((f, i) => f.family === family ? i : -1)
        .filter(i => i >= 0);
    const allOn = ids.every(i => selectedFaces.has(i));
    if (allOn) {
        ids.forEach(i => selectedFaces.delete(i));
    } else {
        selectedFaces.add(clickedIdx);
        ids.forEach(i => selectedFaces.add(i));
    }
}

function clearSelection() {
    selectedFaces.clear();
    rebuildFaceTextures();
    updateReferenceFace();
    updateAngleList();
}

window.clearSelection = clearSelection;

window.navigateToFace = function (faceIdx) {
    const face = facesData[faceIdx];
    const radius = camera.position.length();
    animTarget = {
        position: face.normal.clone().multiplyScalar(radius),
        startPos: camera.position.clone(),
        startTarget: controls.target.clone(),
        endTarget: new THREE.Vector3(0, 0, 0),
        progress: 0,
    };
    controls.enableDamping = false;
};

function updateReferenceFace() {
    let mode, idx;
    if (selectedFaces.size > 0) {
        mode = 'selected';
        idx = selectedFaces.values().next().value;
    } else {
        mode = 'facing';
        idx = findFacingPlane();
    }

    if (idx === currentRefIdx && mode === currentRefMode) return;
    currentRefIdx = idx;
    currentRefMode = mode;

    const face = facesData[idx];
    document.getElementById('facing-index').innerHTML = formatMillerIndexHTML(face.label);
    const familyEl = document.getElementById('facing-family');
    familyEl.textContent = '{' + face.family + '}';
    familyEl.className = 'family-tag family-' + face.family;
    document.getElementById('face-label').textContent =
        translations[settings.lang][mode === 'selected' ? 'reference' : 'facing'];
}

function updateAngleList() {
    const listEl = document.getElementById('angle-list');
    const clearBtn = document.getElementById('clear-btn');
    const t = translations[settings.lang];

    const selected = Array.from(selectedFaces);

    if (clearBtn) clearBtn.style.visibility = selected.length > 0 ? 'visible' : 'hidden';

    if (selected.length === 0) {
        listEl.innerHTML = `<div class="hint-msg">${t.hint_empty}</div>`;
        return;
    }

    if (selected.length === 1) {
        listEl.innerHTML = `<div class="hint-msg">${t.hint_single}</div>`;
        return;
    }

    // Angles from the reference plane (first selected)
    const refIdx = selected[0];
    const ref = facesData[refIdx];

    const others = selected.slice(1).map(i => ({
        idx: i,
        face: facesData[i],
        angle: angleBetween(ref.normal, facesData[i].normal),
    }));
    others.sort((a, b) => a.angle - b.angle);

    listEl.innerHTML = others.map(o => `
        <div class="angle-row" onclick="navigateToFace(${o.idx})">
            <span class="dot dot-${o.face.family}"></span>
            <span class="idx">${formatMillerIndexHTML(o.face.label)}</span>
            <span class="deg">${o.angle.toFixed(1)}°</span>
        </div>
    `).join('');
}

function onResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (animTarget) {
        animTarget.progress += 0.03;
        const t = Math.min(1, animTarget.progress);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(animTarget.startPos, animTarget.position, ease);
        controls.target.lerpVectors(animTarget.startTarget, animTarget.endTarget, ease);
        camera.lookAt(controls.target);
        controls.update();
        if (t >= 1) {
            animTarget = null;
            controls.enableDamping = true;
        }
    } else {
        controls.update();
    }

    updateReferenceFace();
    renderer.render(scene, camera);
}

init().catch(console.error);
